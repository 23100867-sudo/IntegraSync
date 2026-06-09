from fastapi import FastAPI, Depends, HTTPException, status, Security, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

from .database import get_db, engine, Base
from . import models, schemas

# Boot base tables matching PostgreSQL definition
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HSAC RAB 1 IPFMS API",
    description="Integrated Personnel and Financial Management System Backend API Services",
    version="1.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Settings
SECRET_KEY = os.getenv("JWT_SECRET", "superprivate_hsac_rab1_secret_9921_abc")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_auth = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security_auth), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid credentials session")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials session token")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User account is off-boarded")
    return user

def log_audit_trail(db: Session, user_id: str, username: str, role: str, action: str, details: str):
    log = models.AuditLog(
        user_id=user_id,
        username=username,
        role=role,
        action=action,
        details=details
    )
    db.add(log)
    db.commit()

# --- AUTH ENDPOINTS ---
@app.post("/api/auth/login")
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password credentials")
    
    role_name = db.query(models.Role).filter(models.Role.id == user.role_id).first().name
    access_token = create_access_token(data={"sub": user.username, "role": role_name})
    
    log_audit_trail(db, user.id, user.username, role_name, "Login", "Successful authenticated portal login session.")
    
    return {
        "status": "success",
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "fullName": user.full_name,
            "role": role_name,
            "employeeId": user.employee_id
        }
    }

# --- EMPLOYEE ENDPOINTS ---
@app.get("/api/employees", response_model=List[schemas.EmployeeOut])
def read_employees(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.ModelEmployee).all()

@app.post("/api/employees", response_model=schemas.EmployeeOut)
def register_employee(emp: schemas.EmployeeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check authorized role
    role = db.query(models.Role).filter(models.Role.id == current_user.role_id).first().name
    if role not in ["Super Administrator", "HR Officer"]:
        raise HTTPException(status_code=403, detail="Unauthorized action: Requires Admin or HR status")
    
    dup = db.query(models.ModelEmployee).filter(models.ModelEmployee.employee_id == emp.employee_id).first()
    if dup:
        raise HTTPException(status_code=400, detail="Employee ID already mapped")
    
    db_emp = models.ModelEmployee(**emp.dict())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    
    hist = models.ModelEmploymentHistory(
        employee_id=db_emp.employee_id,
        action="Service Record Update",
        previous_details="N/A",
        new_details=f"Initial employment record created as {db_emp.position}",
        effective_date=db_emp.date_hired,
        updated_by=current_user.full_name
    )
    db.add(hist)
    db.commit()
    
    log_audit_trail(db, current_user.id, current_user.username, role, "Create Employee", f"Registered new personnel {db_emp.full_name}")
    return db_emp

# --- ASSETS ENDPOINTS ---
@app.get("/api/assets", response_model=List[schemas.AssetOut])
def list_assets(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.ModelAsset).all()

@app.post("/api/assets", response_model=schemas.AssetOut)
def record_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    role = db.query(models.Role).filter(models.Role.id == current_user.role_id).first().name
    if role not in ["Super Administrator", "Property Custodian"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_asset = models.ModelAsset(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    log_audit_trail(db, current_user.id, current_user.username, role, "Register Asset", f"Added hardware asset {db_asset.asset_number}")
    return db_asset

# --- FINANCIAL ENDPOINTS ---
@app.get("/api/financial-transactions", response_model=List[schemas.TransactionOut])
def get_transactions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.ModelFinancialTransaction).all()

@app.post("/api/financial-transactions", response_model=schemas.TransactionOut)
def record_transaction(txn: schemas.TransactionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    role = db.query(models.Role).filter(models.Role.id == current_user.role_id).first().name
    if role not in ["Super Administrator", "Finance Officer", "Property Custodian"]:
        raise HTTPException(status_code=403, detail="Insufficient ledger rights")
    
    db_txn = models.ModelFinancialTransaction(**txn.dict())
    db.add(db_txn)
    db.commit()
    db.refresh(db_txn)
    
    hist = models.ModelTransactionHistory(
        transaction_id=db_txn.transaction_id,
        status="Pending Validation",
        changed_by=current_user.full_name,
        remarks="Transaction registered, pending voucher check."
    )
    db.add(hist)
    db.commit()
    
    log_audit_trail(db, current_user.id, current_user.username, role, "Register Receipt", f"Receipt recorded: {db_txn.transaction_id}")
    return db_txn

# --- AUDIT ENDPOINT ---
@app.get("/api/audit-logs", response_model=List[schemas.AuditLogOut])
def inspect_audits(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    role = db.query(models.Role).filter(models.Role.id == current_user.role_id).first().name
    if role != "Super Administrator":
        raise HTTPException(status_code=403, detail="Unauthorized action: Admin access only")
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()

# --- HEALTH CHECK ---
@app.get("/api/health")
def api_status():
    return {"status": "operational", "timestamp": datetime.utcnow().isoformat()}
