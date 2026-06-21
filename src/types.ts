export enum UserRole {
  SUPER_ADMIN = "Administrator / Division Chief",
  HR_OFFICER = "HR Officer",
  FINANCE_OFFICER = "Financial Officer",
  BUDGET_OFFICER = "Budget Officer",
  EMPLOYEE = "Personnel",
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  employeeId?: string;
  status?: "Active" | "Deactivated";
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
  employeeRef?: string;
  department?: string;
  category?: string;
  createdBy?: string;
  dateCreated?: string;
}

export interface SupportingDocument {
  id: string;
  name: string;
  type: "Purchase Request" | "Liquidation Report" | "Invoice" | "Disbursement Voucher" | "Other";
  filename: string;
  uploadedAt: string;
  uploadedBy?: string;
  validationStatus?: string;
  versions?: { version: number; filename: string; uploadedAt: string; uploadedBy: string }[];
}

export interface TransactionHistory {
  id: string;
  status: TransactionStatus;
  changedBy: string;
  changedAt: string;
  remarks: string;
}

export interface Liquidation {
  id: string;
  liquidationNo: string;
  requestRef: string;
  employee: string;
  department: string;
  amountReleased: number;
  amountLiquidated: number;
  remainingBalance: number;
  liquidationDate: string;
  status: "Pending Submission" | "Submitted" | "Under Review" | "Approved" | "Completed";
  notes?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface BudgetAllocation {
  id: string;
  department: string;
  budgetAllocation: number;
  budgetUtilized: number;
  remainingBudget: number;
  budgetPercentageUsed: number;
}

export interface BudgetRequestItem {
  id: string;
  department: string;
  amountRequested: number;
  requestType: "Augmentation" | "Realignment" | "Emergency";
  purpose: string;
  status: "Pending" | "Approved" | "Returned";
  remarks?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface FinanceAuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
  previousValue: string;
  newValue: string;
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
  PENDING = "Pending HR Review",
  PENDING_HR_REVIEW = "Pending HR Review",
  RETURNED_BY_HR = "Returned by HR",
  ENDORSED_TO_CHIEF = "Endorsed to Division Chief",
  PENDING_CHIEF_APPROVAL = "Pending Division Chief Approval",
  RETURNED_BY_CHIEF = "Returned by Division Chief",
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "urgent";
  isRead: boolean;
  timestamp: string;
  targetRole?: string; // If undefined, visible to everyone. If specified, only visible to users with this role
  targetEmployeeId?: string; // If specified, only visible specifically to this individual employee
}

export interface Activity {
  id: string;
  activityNo: string;
  title: string;
  description: string;
  dateScheduled: string;
  allottedBudget: number;
  budgetId: string; // linked to BudgetAllocation
  assignedEmployeeId: string; // Employee ID (EMP006, etc.) or Employee name
  status: "Active" | "Completed" | "Pending";
}

export interface LiquidationSubmission {
  id: string;
  submissionNo: string;
  activityId: string;
  employeeId: string; // EMP006, etc.
  employeeName: string;
  totalReleased: number;
  totalSpent: number;
  remainingBalance: number;
  remarks: string;
  supportingDocs: { id: string; name: string; type: string; filename: string; uploadedAt: string }[];
  
  // Three-tier statuses
  hrStatus: "Pending Review" | "Verified & Forwarded" | "Returned by HR";
  hrRemarks?: string;
  hrVerifiedBy?: string;
  hrVerifiedAt?: string;

  financeStatus: "Pending Validation" | "Validated & Endorsed" | "Returned by Finance";
  financeRemarks?: string;
  financeValidatedBy?: string;
  financeValidatedAt?: string;

  divisionChiefStatus: "Pending Chief Approval" | "Approved" | "Returned by Chief" | "Rejected";
  divisionChiefRemarks?: string;
  divisionChiefApprovedBy?: string;
  divisionChiefApprovedAt?: string;

  status: "Pending HR Review" | "Verified & Forwarded" | "Validated & Endorsed" | "Approved" | "Returned" | "Rejected";
  createdAt: string;
}


