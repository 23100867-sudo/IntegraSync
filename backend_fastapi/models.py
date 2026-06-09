import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Decimal, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    employee_id = Column(String(50), ForeignKey("employees.employee_id", ondelete="SET NULL"), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role_rel = relationship("Role")
    employee_rel = relationship("ModelEmployee", back_populates="user_rel")

class ModelEmployee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    position = Column(String(100), nullable=False)
    division = Column(String(100), nullable=False)
    employment_status = Column(String(50), nullable=False) -- 'Permanent', 'Temporary', etc.
    email = Column(String(255), unique=True, nullable=False)
    address = Column(Text)
    date_hired = Column(Date, nullable=False)
    contact_number = Column(String(20))
    emergency_contact_name = Column(String(150))
    emergency_contact_phone = Column(String(20))
    pds_file_name = Column(String(255))
    pds_uploaded_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user_rel = relationship("User", uselist=False, back_populates="employee_rel")
    history_rel = relationship("ModelEmploymentHistory", back_populates="employee")
    trainings_rel = relationship("ModelTraining", back_populates="employee")
    seminars_rel = relationship("ModelSeminar", back_populates="employee")

class ModelEmploymentHistory(Base):
    __tablename__ = "employment_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(50), ForeignKey("employees.employee_id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    previous_details = Column(Text)
    new_details = Column(Text)
    effective_date = Column(Date, nullable=False)
    updated_by = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("ModelEmployee", back_populates="history_rel")

class ModelTraining(Base):
    __tablename__ = "trainings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(50), ForeignKey("employees.employee_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    organizer = Column(String(255), nullable=False)
    date_conducted = Column(Date, nullable=False)
    certificate_file_name = Column(String(255))
    training_hours = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("ModelEmployee", back_populates="trainings_rel")

class ModelSeminar(Base):
    __tablename__ = "seminars"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(50), ForeignKey("employees.employee_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    organizer = Column(String(255), nullable=False)
    date_conducted = Column(Date, nullable=False)
    certificate_file_name = Column(String(255))
    hours = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("ModelEmployee", back_populates="seminars_rel")

class ModelFinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(50), unique=True, index=True, nullable=False)
    transaction_date = Column(Date, nullable=False)
    supplier = Column(String(255), nullable=False)
    amount = Column(Decimal(15, 2), nullable=False)
    description = Column(Text, nullable=False)
    receipt_file_name = Column(String(255))
    status = Column(String(50), default="Pending Validation", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents_rel = relationship("ModelSupportingDocument", back_populates="transaction")
    history_rel = relationship("ModelTransactionHistory", back_populates="transaction")

class ModelSupportingDocument(Base):
    __tablename__ = "supporting_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(50), ForeignKey("financial_transactions.transaction_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    file_name = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("ModelFinancialTransaction", back_populates="documents_rel")

class ModelTransactionHistory(Base):
    __tablename__ = "transaction_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(50), ForeignKey("financial_transactions.transaction_id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    changed_by = Column(String(150), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    remarks = Column(Text)

    transaction = relationship("ModelFinancialTransaction", back_populates="history_rel")

class ModelAsset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_number = Column(String(100), unique=True, index=True, nullable=False)
    serial_number = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    date_acquired = Column(Date, nullable=False)
    cost = Column(Decimal(15, 2), nullable=False)
    status = Column(String(50), default="Available", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ModelSupplyItem(Base):
    __tablename__ = "supply_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), unique=True, index=True, nullable=False)
    total_quantity = Column(Integer, default=0, nullable=False)
    available_quantity = Column(Integer, default=0, nullable=False)
    unit = Column(String(50), default="pieces")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ModelRequest(Base):
    __tablename__ = "requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_type = Column(String(50), nullable=False)
    employee_id = Column(String(50), ForeignKey("employees.employee_id", ondelete="CASCADE"), nullable=False)
    employee_name = Column(String(150), nullable=False)
    date_requested = Column(Date, default=date.today)
    status = Column(String(50), default="Pending Review", nullable=False)
    approved_by = Column(String(150))
    remarks = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String(100), nullable=False)
    username = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    action = Column(Text, nullable=False)
    details = Column(Text)
    ip_address = Column(String(100))
