-- ====================================================================
-- CODESET: Human Settlements Adjudication Commission Regional Adjudication Branch No. 1 (HSAC RAB 1)
-- PROJECT: Integrated Personnel and Financial Management System (IPFMS)
-- TARGET: PostgreSQL v14+ Database Schema Definition
-- ====================================================================

-- Enable UUID extension for robust distributed keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- SECTION 1: USER ACCOUNT SECURITY & ROLE DEFINITIONS
-- ====================================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hashed
    full_name VARCHAR(150) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    employee_id VARCHAR(50) UNIQUE, -- cross-link matching workforce code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- SECTION 2: WORKFORCE & PERSONNEL INFORMATION (HR MODULE)
-- ====================================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    position VARCHAR(100) NOT NULL,
    division VARCHAR(100) NOT NULL,
    employment_status VARCHAR(50) NOT NULL CHECK (employment_status IN ('Permanent', 'Temporary', 'Co-terminus', 'Contractual')),
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    date_hired DATE NOT NULL,
    contact_number VARCHAR(20),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    pds_file_name VARCHAR(255), -- Personal Data Sheet file path / name
    pds_uploaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Register foreign key constraint on users matching employees after table declarations
ALTER TABLE users ADD CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL;

CREATE TABLE employment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- Promotions, Transfers, Designations, Service Record Updates
    previous_details TEXT,
    new_details TEXT,
    effective_date DATE NOT NULL,
    updated_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    date_conducted DATE NOT NULL,
    certificate_file_name VARCHAR(255),
    training_hours INTEGER NOT NULL CHECK (training_hours > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seminars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    date_conducted DATE NOT NULL,
    certificate_file_name VARCHAR(255),
    hours INTEGER NOT NULL CHECK (hours > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- SECTION 3: EXPENSE JOURNALING & RECEIPT LIQUIDATION SYSTEM (FINANCE MODULE)
-- ====================================================================

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    transaction_date DATE NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0.00),
    description TEXT NOT NULL,
    receipt_file_name VARCHAR(255), -- scanned OR file name
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Validation' CHECK (status IN ('Pending Validation', 'Under Review', 'Validated', 'Liquidated', 'Archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supporting_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) NOT NULL REFERENCES financial_transactions(transaction_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN ('Purchase Request', 'Liquidation Report', 'Invoice', 'Disbursement Voucher', 'Other')),
    file_name VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transaction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) NOT NULL REFERENCES financial_transactions(transaction_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(150) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT
);

-- ====================================================================
-- SECTION 4: OFFICE INVENTORY & PROPERTY ACCOUNTABILITY (ASSETS MODULE)
-- ====================================================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_number VARCHAR(100) UNIQUE NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('IT Equipment', 'Office Furniture', 'Vehicles', 'Office Supplies', 'Other')),
    description TEXT NOT NULL,
    date_acquired DATE NOT NULL,
    cost DECIMAL(15,2) NOT NULL CHECK (cost >= 0.00),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Assigned', 'Returned', 'Damaged', 'Lost', 'Archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_issuances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    asset_number VARCHAR(100) NOT NULL,
    assigned_to_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
    assigned_to_name VARCHAR(150) NOT NULL,
    date_issued DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    condition_on_issue TEXT NOT NULL,
    return_date DATE,
    condition_on_return TEXT,
    clearance_status VARCHAR(50) CHECK (clearance_status IN ('Cleared', 'Pending', 'Disapproved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supply_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
    unit VARCHAR(50) DEFAULT 'pieces',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- SECTION 5: DIGITAL REQUEST & APPROVAL WORKFLOW
-- ====================================================================

-- Base super-table partitioning requests patterns
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('Leave Request', 'Service Record Request', 'Vehicle Request', 'Zoom Access Request', 'Supply Request')),
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    employee_name VARCHAR(150) NOT NULL,
    date_requested DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Approved', 'Rejected')),
    approved_by VARCHAR(150),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_requests (
    request_id UUID PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
    leave_type VARCHAR(100) NOT NULL CHECK (leave_type IN ('Sick Leave', 'Vacation Leave', 'Maternity/Paternity Leave', 'Emergency Leave', 'Special Privilege')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL
);

CREATE TABLE service_record_requests (
    request_id UUID PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    copies INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE vehicle_requests (
    request_id PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
    destination VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    date_needed DATE NOT NULL,
    passengers TEXT NOT NULL
);

CREATE TABLE zoom_requests (
    request_id UUID PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
    meeting_title VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    alternative_host VARCHAR(255)
);

CREATE TABLE supply_requests (
    request_id UUID PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
    supply_id UUID NOT NULL REFERENCES supply_items(id) ON DELETE CASCADE,
    supply_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    purpose TEXT NOT NULL
);

-- ====================================================================
-- SECTION 6: SYSTEM AUDIT TRAILING & EVENT LOGGING
-- ====================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    action TEXT NOT NULL, -- "Login", "Create", "Approve", etc.
    details TEXT,
    ip_address VARCHAR(100)
);

-- ====================================================================
-- SECTION 7: DATABASE DQL OPTIMIZING INDEXES
-- ====================================================================

CREATE INDEX idx_employees_lookup ON employees(full_name, employee_id, division);
CREATE INDEX idx_financial_txn_status ON financial_transactions(status, transaction_date);
CREATE INDEX idx_assets_status ON assets(status, asset_number);
CREATE INDEX idx_requests_status ON requests(status, request_type);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- ====================================================================
-- SECTION 8: PRIMARY SECURITY SEEDING
-- ====================================================================

INSERT INTO roles (id, name, description) VALUES
(1, 'Super Administrator', 'Full system access, audit trailing reviews, backup and security managers.'),
(2, 'HR Officer', 'Responsible for employee profiles, Personal Data Sheets (PDS), training catalogs.'),
(3, 'Finance Officer', 'Responsible for receipts monitoring, liquidation validations, invoices.'),
(4, 'Property Custodian', 'Handles assets inventory, supply item stock and issuance ledgers.'),
(5, 'Department Head', 'Adjudicates and reviews leave forms, fuel tickets, zoom licenses.'),
(6, 'Employee', 'Views own profiles, submits leaves, property queries, zoom applications.');

-- Clear default passwords are pre-configured in FastAPI backend (hashed: 'password123' using bcrypt)
-- Administrative Users
INSERT INTO employees (id, employee_id, full_name, position, division, employment_status, email, address, date_hired, contact_number) VALUES
('aa000000-0000-0000-0000-000000000001', 'EMP001', 'Hon. Romeo M. Alcantara', 'Regional Executive Adjudicator', 'Adjudication Division', 'Permanent', 'admin@hsac.gov.ph', 'La Union, Philippines', '2020-03-01', '09171234567'),
('aa000000-0000-0000-0000-000000000002', 'EMP002', 'Maria Clara V. Santos', 'Administrative Officer IV (HR)', 'Administrative and Finance Division', 'Permanent', 'clara.santos@hsac.gov.ph', 'San Fernando City, La Union', '2021-06-15', '09182345678'),
('aa000000-0000-0000-0000-000000000003', 'EMP003', 'Juan dela Cruz', 'Financial Analyst II', 'Administrative and Finance Division', 'Permanent', 'juan.delacruz@hsac.gov.ph', 'Bauang, La Union', '2022-01-10', '09193456789'),
('aa000000-0000-0000-0000-000000000004', 'EMP004', 'Pedro B. Penduko', 'Property Custodian / AO II', 'Administrative and Finance Division', 'Permanent', 'pedro.penduko@hsac.gov.ph', 'San Juan, La Union', '2021-09-01', '09204567890'),
('aa000000-0000-0000-0000-000000000005', 'EMP005', 'Dr. Jose P. Rizal', 'Legal Officer IV', 'Legal Division', 'Permanent', 'jose.rizal@hsac.gov.ph', 'La Union, Philippines', '2019-11-20', '09159998888'),
('aa000000-0000-0000-0000-000000000006', 'EMP006', 'Andres B. Bonifacio', 'Adjudication Assistant', 'Adjudication Division', 'Contractual', 'andres.bonifacio@hsac.gov.ph', 'Agoo, La Union', '2023-01-16', '09162223333');

-- User accounts credentials mapping (Pre-hashed hash is: '$2b$12$N9qo8uLOqpGC12Xf8.Y.QOXgWfWf1N1qjK6M1N8P1S.P6g6C6C7C7' for demo clarity 'password123')
INSERT INTO users (id, username, email, password_hash, full_name, role_id, employee_id) VALUES
('bb000000-0000-0000-0000-000000000001', 'admin', 'admin@hsac.gov.ph', '$2b$12$e0MdxpG4f6L/M8fbyb71IuxE00NlF3D8Uf2S.z3YfXz7gM14v9GWe', 'Hon. Romeo M. Alcantara', 1, 'EMP001'),
('bb000000-0000-0000-0000-000000000002', 'hr', 'clara.santos@hsac.gov.ph', '$2b$12$e0MdxpG4f6L/M8fbyb71IuxE00NlF3D8Uf2S.z3YfXz7gM14v9GWe', 'Maria Clara V. Santos', 2, 'EMP002'),
('bb000000-0000-0000-0000-000000000003', 'finance', 'juan.delacruz@hsac.gov.ph', '$2b$12$e0MdxpG4f6L/M8fbyb71IuxE00NlF3D8Uf2S.z3YfXz7gM14v9GWe', 'Juan dela Cruz', 3, 'EMP003'),
('bb000000-0000-0000-0000-000000000004', 'custodian', 'pedro.penduko@hsac.gov.ph', '$2b$12$e0MdxpG4f6L/M8fbyb71IuxE00NlF3D8Uf2S.z3YfXz7gM14v9GWe', 'Pedro B. Penduko', 4, 'EMP004'),
('bb000000-0000-0000-0000-000000000005', 'head', 'jose.rizal@hsac.gov.ph', '$2b$12$e0MdxpG4f6L/M8fbyb71IuxE00NlF3D8Uf2S.z3YfXz7gM14v9GWe', 'Dr. Jose P. Rizal', 5, 'EMP005'),
('bb000000-0000-0000-0000-000000000006', 'employee', 'andres.bonifacio@hsac.gov.ph', '$2b$12$e0MdxpG4f6L/M8fbyb71IuxE00NlF3D8Uf2S.z3YfXz7gM14v9GWe', 'Andres B. Bonifacio', 6, 'EMP006');
