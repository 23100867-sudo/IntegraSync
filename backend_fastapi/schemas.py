from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# Role Schema
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleOut(RoleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role_id: int
    employee_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
    full_name: str
    role_id: int
    employee_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

# Employee Schemas
class EmployeeBase(BaseModel):
    employee_id: str
    full_name: str
    position: str
    division: str
    employment_status: str
    email: EmailStr
    address: Optional[str] = None
    date_hired: date
    contact_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    position: Optional[str] = None
    division: Optional[str] = None
    employment_status: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class EmployeeOut(EmployeeBase):
    id: str
    pds_file_name: Optional[str] = None
    pds_uploaded_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Training Schema
class TrainingBase(BaseModel):
    title: str
    organizer: str
    date_conducted: date
    training_hours: int
    certificate_file_name: Optional[str] = None

class TrainingCreate(TrainingBase):
    employee_id: str

class TrainingOut(TrainingBase):
    id: str
    employee_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Financial Transaction Schemas
class SupportingDocumentBase(BaseModel):
    name: str
    type: str # PR, LR, Invoice, etc
    file_name: str

class SupportingDocumentOut(SupportingDocumentBase):
    id: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    transaction_id: str
    transaction_date: date
    supplier: str
    amount: Decimal
    description: str

class TransactionCreate(TransactionBase):
    receipt_file_name: Optional[str] = None

class TransactionOut(TransactionBase):
    id: str
    status: str
    receipt_file_name: Optional[str] = None
    supporting_documents: List[SupportingDocumentOut] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Asset Schemas
class AssetBase(BaseModel):
    asset_number: str
    serial_number: str
    category: str
    description: str
    date_acquired: date
    cost: Decimal

class AssetCreate(AssetBase):
    pass

class AssetOut(AssetBase):
    id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Requests Schemas
class RequestBase(BaseModel):
    request_type: str
    employee_id: str
    employee_name: str
    date_requested: date

class RequestCreate(BaseModel):
    request_type: str
    details: dict # Dynamic fields based on request type

class RequestOut(RequestBase):
    id: str
    status: str
    approved_by: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Log Schema
class AuditLogOut(BaseModel):
    id: str
    timestamp: datetime
    user_id: str
    username: str
    role: str
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True
