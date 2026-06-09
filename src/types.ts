export enum UserRole {
  SUPER_ADMIN = "Super Administrator",
  HR_OFFICER = "HR Officer",
  FINANCE_OFFICER = "Finance Officer",
  PROPERTY_CUSTODIAN = "Property Custodian",
  DEPARTMENT_HEAD = "Department Head",
  EMPLOYEE = "Employee",
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  employeeId?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  position: string;
  division: string;
  employmentStatus: "Permanent" | "Temporary" | "Co-terminus" | "Contractual";
  email: string;
  address: string;
  dateHired: string;
  contactNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  pdsFieldName?: string; // name of the uploaded PDS PDF
  pdsUploadedAt?: string;
}

export interface EmploymentHistory {
  id: string;
  employeeId: string;
  action: "Promotion" | "Transfer" | "Designation" | "Service Record Update";
  previousDetails: string;
  newDetails: string;
  effectiveDate: string;
  updatedBy: string;
}

export interface Training {
  id: string;
  employeeId: string;
  title: string;
  organizer: string;
  dateConducted: string;
  certificateFilename?: string;
  trainingHours: number;
}

export interface Seminar {
  id: string;
  employeeId: string;
  title: string;
  organizer: string;
  dateConducted: string;
  certificateFilename?: string;
  hours: number;
}

export enum TransactionStatus {
  PENDING_VALIDATION = "Pending Validation",
  UNDER_REVIEW = "Under Review",
  VALIDATED = "Validated",
  LIQUIDATED = "Liquidated",
  ARCHIVED = "Archived",
}

export interface FinancialTransaction {
  id: string;
  transactionId: string;
  transactionDate: string;
  supplier: string;
  amount: number;
  description: string;
  receiptFilename?: string;
  status: TransactionStatus;
  supportingDocuments: SupportingDocument[];
  history: TransactionHistory[];
}

export interface SupportingDocument {
  id: string;
  name: string;
  type: "Purchase Request" | "Liquidation Report" | "Invoice" | "Disbursement Voucher" | "Other";
  filename: string;
  uploadedAt: string;
}

export interface TransactionHistory {
  id: string;
  status: TransactionStatus;
  changedBy: string;
  changedAt: string;
  remarks: string;
}

export enum AssetStatus {
  AVAILABLE = "Available",
  ASSIGNED = "Assigned",
  RETURNED = "Returned",
  DAMAGED = "Damaged",
  LOST = "Lost",
  ARCHIVED = "Archived",
}

export interface Asset {
  id: string;
  assetNumber: string;
  serialNumber: string;
  category: "IT Equipment" | "Office Furniture" | "Vehicles" | "Office Supplies" | "Other";
  description: string;
  dateAcquired: string;
  cost: number;
  status: AssetStatus;
  assignedToId?: string; // Employee ID
  assignedToName?: string;
}

export interface AssetIssuance {
  id: string;
  assetId: string;
  assetNumber: string;
  assignedToId: string;
  assignedToName: string;
  dateIssued: string;
  quantity: number;
  conditionOnIssue: string;
  returnDate?: string;
  conditionOnReturn?: string;
  clearanceStatus?: "Cleared" | "Pending" | "Disapproved";
}

export interface SupplyItem {
  id: string;
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  unit: string;
}

export interface SupplyIssuance {
  id: string;
  supplyId: string;
  supplyName: string;
  issuedToId: string;
  issuedToName: string;
  quantity: number;
  dateIssued: string;
}

export enum RequestType {
  LEAVE = "Leave Request",
  SERVICE_RECORD = "Service Record Request",
  VEHICLE = "Vehicle Request",
  ZOOM = "Zoom Access Request",
  SUPPLY = "Supply Request",
}

export enum RequestStatus {
  PENDING = "Pending Review",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

export interface BaseRequest {
  id: string;
  requestType: RequestType;
  employeeId: string;
  employeeName: string;
  dateRequested: string;
  status: RequestStatus;
  approvedBy?: string;
  remarks?: string;
}

export interface LeaveRequest extends BaseRequest {
  leaveType: "Sick Leave" | "Vacation Leave" | "Maternity/Paternity Leave" | "Emergency Leave" | "Special Privilege";
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ServiceRecordRequest extends BaseRequest {
  purpose: string;
  copies: number;
}

export interface VehicleRequest extends BaseRequest {
  destination: string;
  purpose: string;
  dateNeeded: string;
  passengers: string;
}

export interface ZoomRequest extends BaseRequest {
  meetingTitle: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  alternativeHost?: string;
}

export interface SupplyRequest extends BaseRequest {
  supplyId: string;
  supplyName: string;
  quantity: number;
  purpose: string;
}

export type AnyRequest = LeaveRequest | ServiceRecordRequest | VehicleRequest | ZoomRequest | SupplyRequest;

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  role: string;
  action: string; // e.g., "Login", "Create Employee", "Approve Request", "Update Transaction"
  details: string; // Brief explanatory text
}
