import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  UserRole, 
  User, 
  Employee, 
  EmploymentHistory, 
  Training, 
  TransactionStatus, 
  FinancialTransaction, 
  AssetStatus, 
  Asset, 
  AssetIssuance, 
  SupplyItem, 
  SupplyIssuance, 
  RequestType, 
  RequestStatus, 
  AnyRequest, 
  AuditLog,
  Liquidation,
  BudgetAllocation,
  FinanceAuditLog,
  Notification,
  BudgetRequestItem
} from "./src/types";

const app = express();
const PORT = 3000;
const DATA_FILE_PATH = path.join(process.cwd(), "data_store.json");

app.use(express.json({ limit: "50mb" }));

// Mock database type definitions
interface DBStructure {
  users: User[];
  employees: Employee[];
  employmentHistory: EmploymentHistory[];
  trainings: Training[];
  financialTransactions: FinancialTransaction[];
  assets: Asset[];
  assetIssuances: AssetIssuance[];
  supplyItems: SupplyItem[];
  supplyIssuances: SupplyIssuance[];
  requests: AnyRequest[];
  auditLogs: AuditLog[];
  liquidations: Liquidation[];
  budgetAllocations: BudgetAllocation[];
  financeAuditLogs: FinanceAuditLog[];
  notifications: Notification[];
  budgetRequests: BudgetRequestItem[];
  activities: any[];
  liquidationSubmissions: any[];
  activityBudgetLinks: any[];
}

// Check and seed DB on server launch
function getInitialData(): DBStructure {
  if (fs.existsSync(DATA_FILE_PATH)) {
    try {
      const content = fs.readFileSync(DATA_FILE_PATH, "utf8");
      const loaded = JSON.parse(content);
      
      let changed = false;

      // Migrate existing "Admin" role string to new "Administrator / Division Chief" value
      if (loaded.users && Array.isArray(loaded.users)) {
        loaded.users.forEach((u: any) => {
          if (u.role === "Admin") {
            u.role = UserRole.SUPER_ADMIN;
            changed = true;
          }
        });
      }
      if (loaded.notifications && Array.isArray(loaded.notifications)) {
        loaded.notifications.forEach((n: any) => {
          if (n.targetRole === "Admin") {
            n.targetRole = UserRole.SUPER_ADMIN;
            changed = true;
          }
        });
      }
      if (!loaded.liquidations) {
        loaded.liquidations = [
          {
            id: "liqp-1",
            liquidationNo: "LIQ-2026-001",
            requestRef: "REQ-VHL-091",
            employee: "Andres B. Bonifacio",
            department: "Adjudication Division",
            amountReleased: 5000.00,
            amountLiquidated: 4800.00,
            remainingBalance: 200.00,
            liquidationDate: "2026-06-03",
            status: "Completed",
            notes: "Completed Petron fuel trip liquidation. Refund has been submitted.",
            approvedBy: "Juan dela Cruz",
            createdAt: "2026-06-03T17:00:00Z"
          },
          {
            id: "liqp-2",
            liquidationNo: "LIQ-2026-002",
            requestRef: "REQ-SPL-044",
            employee: "Pedro B. Penduko",
            department: "Administrative and Finance Division",
            amountReleased: 15000.00,
            amountLiquidated: 14500.00,
            remainingBalance: 500.00,
            liquidationDate: "2026-05-15",
            status: "Completed",
            notes: "La Union Office Supplies purchase liquidation.",
            approvedBy: "Juan dela Cruz",
            createdAt: "2026-05-15T16:45:00Z"
          },
          {
            id: "liqp-3",
            liquidationNo: "LIQ-2026-003",
            requestRef: "REQ-TRV-112",
            employee: "Juan dela Cruz",
            department: "Administrative and Finance Division",
            amountReleased: 12000.00,
            amountLiquidated: 0.00,
            remainingBalance: 12000.00,
            liquidationDate: "2026-06-08",
            status: "Under Review",
            notes: "Awaiting review of food receipts and accommodation invoice details for mediation trip.",
            createdAt: "2026-06-08T09:00:00Z"
          },
          {
            id: "liqp-4",
            liquidationNo: "LIQ-2026-004",
            requestRef: "REQ-PRV-312",
            employee: "Maria Clara V. Santos",
            department: "Administrative and Finance Division",
            amountReleased: 8500.00,
            amountLiquidated: 0.00,
            remainingBalance: 8500.00,
            liquidationDate: "2026-06-09",
            status: "Pending Submission",
            notes: "Equipment repairs cash advance for regional branch laptops.",
            createdAt: "2026-06-09T08:30:00Z"
          }
        ];
        changed = true;
      }
      if (!loaded.budgetAllocations) {
        loaded.budgetAllocations = [
          { id: "b-1", department: "Adjudication Division", budgetAllocation: 500000.00, budgetUtilized: 120000.00, remainingBudget: 380000.00, budgetPercentageUsed: 24 },
          { id: "b-2", department: "Administrative and Finance Division", budgetAllocation: 1000000.00, budgetUtilized: 450000.00, remainingBudget: 550000.00, budgetPercentageUsed: 45 },
          { id: "b-3", department: "Legal Division", budgetAllocation: 400000.00, budgetUtilized: 85500.00, remainingBudget: 314500.00, budgetPercentageUsed: 21 }
        ];
        changed = true;
      }
      if (!loaded.financeAuditLogs) {
        loaded.financeAuditLogs = [
          { id: "fl-1", user: "Juan dela Cruz", action: "Validate Transaction", module: "Financial Transactions", timestamp: "2026-05-13T09:30:00Z", previousValue: "Under Review", newValue: "Validated" },
          { id: "fl-2", user: "Juan dela Cruz", action: "Complete Liquidation", module: "Liquidation Monitoring", timestamp: "2026-06-03T17:00:00Z", previousValue: "Under Review", newValue: "Completed" }
        ];
        changed = true;
      }
      if (!loaded.budgetRequests) {
        loaded.budgetRequests = [
          { id: "br-1", department: "Adjudication Division", amountRequested: 150000.00, requestType: "Augmentation", purpose: "Additional travel allocations for provincial hearings", status: "Pending", createdAt: "2026-06-15T09:00:00Z" },
          { id: "br-2", department: "Legal Division", amountRequested: 50000.00, requestType: "Emergency", purpose: "Urgent purchase of legal research library subscriptions", status: "Approved", remarks: "Approved for FY2026 Q3", createdAt: "2026-06-12T14:30:00Z" }
        ];
        changed = true;
      }
      if (!loaded.notifications) {
        loaded.notifications = [
          {
            id: "notif-1",
            title: "Leave Request Submitted",
            message: "Adjudicator Andres Bonifacio has submitted an urgent Vacation Leave Request for your review.",
            type: "urgent",
            isRead: false,
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            targetRole: UserRole.HR_OFFICER
          },
          {
            id: "notif-2",
            title: "Low Supply Inventory Range Alert",
            message: "Supply stock for 'A4 Multi-purpose Bond Paper (80gsm)' is currently low (5 units left). Please arrange purchase acquisition.",
            type: "warning",
            isRead: false,
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
            targetRole: UserRole.SUPER_ADMIN
          },
          {
            id: "notif-3",
            title: "Financial Liquidation Verification",
            message: "Juan dela Cruz submitted a travel liquidation of ₱12,000 for travel request REQ-TRV-112. Support vouchers need verification.",
            type: "info",
            isRead: false,
            timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
            targetRole: UserRole.FINANCE_OFFICER
          },
          {
            id: "notif-4",
            title: "Comprehensive Security Compliance Log Audit",
            message: "All HR and Finance tables comply with RA 10173 Data Privacy protection directives. Periodic validation complete.",
            type: "success",
            isRead: false,
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
            targetRole: UserRole.SUPER_ADMIN
          },
          {
            id: "notif-5",
            title: "En Banc Board Case Reconciliation Scheduled",
            message: "A general assembly has been scheduled for case adjustments on Room B at 09:00 AM.",
            type: "info",
            isRead: false,
            timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
            targetRole: UserRole.EMPLOYEE
          },
          {
            id: "notif-6",
            title: "Meeting Room Assignment Active",
            message: "Zoom meeting 'RAB 1 En Banc Case Reconciliation Adjudication' setup is ready for launch.",
            type: "success",
            isRead: false,
            timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
            targetRole: UserRole.EMPLOYEE
          }
        ];
        changed = true;
      }
      
      // Backfill missing fields in financial transactions
      loaded.financialTransactions.forEach((tx: any) => {
        if (!tx.department) {
          tx.department = tx.id === "tx-1" ? "Legal Division" : "Administrative and Finance Division";
          changed = true;
        }
        if (!tx.category) {
          tx.category = tx.id === "tx-1" ? "Office Supplies" : tx.id === "tx-3" ? "Fuel/Tolls" : "Maintenance";
          changed = true;
        }
        if (!tx.employeeRef) {
          tx.employeeRef = tx.id === "tx-1" ? "EMP006" : tx.id === "tx-3" ? "EMP006" : "EMP004";
          changed = true;
        }
        if (!tx.createdBy) {
          tx.createdBy = tx.id === "tx-1" ? "Andres B. Bonifacio" : tx.id === "tx-3" ? "Andres B. Bonifacio" : "Pedro B. Penduko";
          changed = true;
        }
        if (!tx.dateCreated) {
          tx.dateCreated = tx.transactionDate;
          changed = true;
        }
      });

      if (!loaded.activities) {
        loaded.activities = [
          {
            id: "act-1",
            activityNo: "ACT-2026-001",
            title: "Regional Case Mediation Caravan",
            description: "En banc travel and lodging expenses for case mediations in Region 1.",
            dateScheduled: "2026-06-10",
            allottedBudget: 25000,
            budgetId: "b-2",
            assignedEmployeeId: "EMP006",
            status: "Active"
          },
          {
            id: "act-2",
            activityNo: "ACT-2026-002",
            title: "Legal Research Library Subscriptions",
            description: "Establishment of digital research accounts for legal officers.",
            dateScheduled: "2026-06-14",
            allottedBudget: 5000,
            budgetId: "b-3",
            assignedEmployeeId: "EMP006",
            status: "Active"
          },
          {
            id: "act-3",
            activityNo: "ACT-2026-003",
            title: "Administrative Technical Audit Workshop",
            description: "Capacity building and audits for regional support departments.",
            dateScheduled: "2026-06-25",
            allottedBudget: 15000,
            budgetId: "b-2",
            assignedEmployeeId: "EMP006",
            status: "Pending"
          }
        ];
        changed = true;
      }

      if (!loaded.liquidationSubmissions) {
        loaded.liquidationSubmissions = [
          {
            id: "liqsub-1",
            submissionNo: "LIQSUB-2026-001",
            activityId: "act-1",
            employeeId: "EMP006",
            employeeName: "Andres B. Bonifacio",
            totalReleased: 12000,
            totalSpent: 11500,
            remainingBalance: 500,
            remarks: "Hotel invoices and transportation receipts attached for review.",
            supportingDocs: [
              { id: "doc-1", name: "Official Vigan Lodging Receipt", type: "Invoice", filename: "vigan_lodging_receipt.pdf", uploadedAt: new Date().toISOString() }
            ],
            hrStatus: "Verified & Forwarded",
            hrRemarks: "Verified matching employee and activity relationship.",
            hrVerifiedBy: "Maria Clara V. Santos",
            hrVerifiedAt: "2026-06-16T10:00:00Z",
            financeStatus: "Pending Validation",
            financeRemarks: "",
            divisionChiefStatus: "Pending Chief Approval",
            divisionChiefRemarks: "",
            status: "Pending Finance Validation",
            createdAt: "2026-06-15T09:30:00Z"
          },
          {
            id: "liqsub-2",
            submissionNo: "LIQSUB-2026-002",
            activityId: "act-2",
            employeeId: "EMP006",
            employeeName: "Andres B. Bonifacio",
            totalReleased: 5000,
            totalSpent: 5000,
            remainingBalance: 0,
            remarks: "All items compiled.",
            supportingDocs: [],
            hrStatus: "Pending Review",
            hrRemarks: "",
            financeStatus: "Pending Validation",
            financeRemarks: "",
            divisionChiefStatus: "Pending Chief Approval",
            divisionChiefRemarks: "",
            status: "Pending HR Review",
            createdAt: "2026-06-19T14:22:00Z"
          }
        ];
        changed = true;
      }

      if (!loaded.activityBudgetLinks) {
        loaded.activityBudgetLinks = [
          { id: "bl-1", liquidationNo: "LIQ-2026-001", employee: "Andres B. Bonifacio", department: "Adjudication Division", amount: 12000.00, budgetId: "b-1", timestamp: "2026-06-14T10:00:00Z" },
          { id: "bl-2", liquidationNo: "LIQ-2026-002", employee: "Apolinario M. Mabini", department: "Legal Division", amount: 25000.00, budgetId: "b-3", timestamp: "2026-06-15T11:30:00Z" }
        ];
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(loaded, null, 2), "utf8");
      }
      return loaded;
    } catch (e) {
      console.error("Error reading data_store.json, re-initializing", e);
    }
  }

  // Set seed data
  const seedDB: DBStructure = {
    users: [
      { id: "u-1", username: "admin", email: "admin@hsac.gov.ph", fullName: "Hon. Romeo M. Alcantara", role: UserRole.SUPER_ADMIN, employeeId: "EMP001", status: "Active", createdAt: "2026-01-15T08:00:00Z" },
      { id: "u-2", username: "hr", email: "clara.santos@hsac.gov.ph", fullName: "Maria Clara V. Santos", role: UserRole.HR_OFFICER, employeeId: "EMP002", status: "Active", createdAt: "2026-01-15T08:30:00Z" },
      { id: "u-3", username: "finance", email: "juan.delacruz@hsac.gov.ph", fullName: "Juan dela Cruz", role: UserRole.FINANCE_OFFICER, employeeId: "EMP003", status: "Active", createdAt: "2026-01-15T09:00:00Z" },
      { id: "u-6", username: "employee", email: "andres.bonifacio@hsac.gov.ph", fullName: "Andres B. Bonifacio", role: UserRole.EMPLOYEE, employeeId: "EMP006", status: "Active", createdAt: "2026-01-15T10:00:00Z" },
      { id: "u-7", username: "budget", email: "budget@hsac.gov.ph", fullName: "Francisco F. Balagtas", role: UserRole.BUDGET_OFFICER, employeeId: "EMP007", status: "Active", createdAt: "2026-01-15T10:15:00Z" },
    ],
    employees: [
      {
        id: "emp-1",
        employeeId: "EMP001",
        fullName: "Hon. Romeo M. Alcantara",
        position: "Regional Executive Adjudicator",
        division: "Adjudication Division",
        employmentStatus: "Permanent",
        email: "admin@hsac.gov.ph",
        address: "La Union, Philippines",
        dateHired: "2020-03-01",
        contactNumber: "09171234567",
        emergencyContactName: "Leonor Rivera",
        emergencyContactPhone: "09177654321",
        pdsFieldName: "EMP001_PDS_Signed.pdf",
        pdsUploadedAt: "2026-02-01T09:00:00Z"
      },
      {
        id: "emp-2",
        employeeId: "EMP002",
        fullName: "Maria Clara V. Santos",
        position: "Administrative Officer IV (HR)",
        division: "Administrative and Finance Division",
        employmentStatus: "Permanent",
        email: "clara.santos@hsac.gov.ph",
        address: "San Fernando City, La Union",
        dateHired: "2021-06-15",
        contactNumber: "09182345678",
        emergencyContactName: "Crisostomo Ibarra",
        emergencyContactPhone: "091887654321",
        pdsFieldName: "EMP002_PDS.pdf",
        pdsUploadedAt: "2026-02-10T10:30:00Z"
      },
      {
        id: "emp-3",
        employeeId: "EMP003",
        fullName: "Juan dela Cruz",
        position: "Financial Analyst II",
        division: "Administrative and Finance Division",
        employmentStatus: "Permanent",
        email: "juan.delacruz@hsac.gov.ph",
        address: "Bauang, La Union",
        dateHired: "2022-01-10",
        contactNumber: "09193456789",
        emergencyContactName: "Juana dela Cruz",
        emergencyContactPhone: "09199876543",
        pdsFieldName: "EMP003_PDS.pdf",
        pdsUploadedAt: "2026-02-11T14:22:00Z"
      },
      {
        id: "emp-4",
        employeeId: "EMP004",
        fullName: "Pedro B. Penduko",
        position: "Property Custodian / AO II",
        division: "Administrative and Finance Division",
        employmentStatus: "Permanent",
        email: "pedro.penduko@hsac.gov.ph",
        address: "San Juan, La Union",
        dateHired: "2021-09-01",
        contactNumber: "09204567890",
        emergencyContactName: "Maria Makiling",
        emergencyContactPhone: "09201234567",
        pdsFieldName: "EMP004_PDS.pdf",
        pdsUploadedAt: "2026-02-12T11:15:00Z"
      },
      {
        id: "emp-5",
        employeeId: "EMP005",
        fullName: "Dr. Jose P. Rizal",
        position: "Legal Officer IV",
        division: "Legal Division",
        employmentStatus: "Permanent",
        email: "jose.rizal@hsac.gov.ph",
        address: "Calamba, Laguna / San Fernando, La Union",
        dateHired: "2019-11-20",
        contactNumber: "09159998888",
        emergencyContactName: "Paciano Rizal",
        emergencyContactPhone: "09151112222",
        pdsFieldName: "EMP005_PDS_Official.pdf",
        pdsUploadedAt: "2026-02-05T08:45:00Z"
      },
      {
        id: "emp-6",
        employeeId: "EMP006",
        fullName: "Andres B. Bonifacio",
        position: "Adjudication Assistant",
        division: "Adjudication Division",
        employmentStatus: "Contractual",
        email: "andres.bonifacio@hsac.gov.ph",
        address: "Agoo, La Union",
        dateHired: "2023-01-16",
        contactNumber: "09162223333",
        emergencyContactName: "Gregoria de Jesus",
        emergencyContactPhone: "09164445555",
        pdsFieldName: "EMP006_PDS.pdf",
        pdsUploadedAt: "2026-03-01T15:00:00Z"
      },
      {
        id: "emp-7",
        employeeId: "EMP007",
        fullName: "Francisco F. Balagtas",
        position: "Administrative Officer IV (Budget)",
        division: "Administrative and Finance Division",
        employmentStatus: "Permanent",
        email: "budget@hsac.gov.ph",
        address: "San Fernando City, La Union",
        dateHired: "2022-04-18",
        contactNumber: "09175551234",
        emergencyContactName: "Juana Tiambeng",
        emergencyContactPhone: "09175554321",
        pdsFieldName: "EMP007_PDS.pdf",
        pdsUploadedAt: "2026-04-01T10:00:00Z"
      }
    ],
    employmentHistory: [
      { id: "h-1", employeeId: "EMP001", action: "Designation", previousDetails: "Attorney V", newDetails: "Regional Executive Adjudicator", effectiveDate: "2020-03-01", updatedBy: "System Setup" },
      { id: "h-2", employeeId: "EMP006", action: "Service Record Update", previousDetails: "Contract Started", newDetails: "Contract Renewed for FY 2026", effectiveDate: "2026-01-01", updatedBy: "Maria Clara V. Santos" },
      { id: "h-3", employeeId: "EMP002", action: "Promotion", previousDetails: "Administrative Officer III", newDetails: "Administrative Officer IV (HR)", effectiveDate: "2023-08-15", updatedBy: "System Administrator" }
    ],
    trainings: [
      { id: "t-1", employeeId: "EMP001", title: "Advanced Legal Writing & Case Adjudication", organizer: "Supreme Court / PhilJA", dateConducted: "2025-05-12", certificateFilename: "EMP001_PhilJA_Cert.pdf", trainingHours: 40 },
      { id: "t-2", employeeId: "EMP005", title: "Housing and Land Use Adjudication Rules", organizer: "HSAC Central Office", dateConducted: "2025-07-20", certificateFilename: "EMP005_AdjudicationRules.pdf", trainingHours: 24 },
      { id: "t-3", employeeId: "EMP002", title: "Strategic HR Management in the Public Sector", organizer: "Civil Service Commission", dateConducted: "2025-09-18", certificateFilename: "EMP002_StrategicHR_Cert.pdf", trainingHours: 32 },
      { id: "t-4", employeeId: "EMP003", title: "Government Procurement Reform Act (RA 9184)", organizer: "Department of Budget and Management", dateConducted: "2025-11-10", certificateFilename: "EMP003_RA9184_Cert.pdf", trainingHours: 16 }
    ],
    financialTransactions: [
      {
        id: "tx-1",
        transactionId: "TXN-2026-001",
        transactionDate: "2026-05-10",
        supplier: "La Union Office Supplies Trading",
        amount: 14500.00,
        description: "Purchase of high-speed heavy-duty staplers and binding materials for the Legal Records Section",
        receiptFilename: "receipt_001_legal.png",
        status: TransactionStatus.LIQUIDATED,
        supportingDocuments: [
          { id: "doc-1", name: "Approved Purchase Request", type: "Purchase Request", filename: "PR_2026_001.pdf", uploadedAt: "2026-05-09T08:00:00Z" },
          { id: "doc-2", name: "Official Vendor Invoice", type: "Invoice", filename: "INV_92318.pdf", uploadedAt: "2026-05-10T11:00:00Z" },
          { id: "doc-3", name: "Disbursement Voucher DV-26-882", type: "Disbursement Voucher", filename: "DV_26_882.pdf", uploadedAt: "2026-05-11T14:00:00Z" },
          { id: "doc-4", name: "Liquidation Report Signed", type: "Liquidation Report", filename: "LR_2026_01.pdf", uploadedAt: "2026-05-15T16:30:00Z" }
        ],
        history: [
          { id: "th-1", status: TransactionStatus.PENDING_VALIDATION, changedBy: "Andres B. Bonifacio", changedAt: "2026-05-10T11:05:00Z", remarks: "Initial upload of vendor official receipt." },
          { id: "th-2", status: TransactionStatus.UNDER_REVIEW, changedBy: "Juan dela Cruz", changedAt: "2026-05-12T10:00:00Z", remarks: "Under audit review of supporting receipts and disbursement voucher compatibility." },
          { id: "th-3", status: TransactionStatus.VALIDATED, changedBy: "Juan dela Cruz", changedAt: "2026-05-13T09:30:00Z", remarks: "All invoices and purchase orders confirmed correct." },
          { id: "th-4", status: TransactionStatus.LIQUIDATED, changedBy: "Juan dela Cruz", changedAt: "2026-05-15T17:00:00Z", remarks: "Liquidation approved. Records match general ledger entry." }
        ]
      },
      {
        id: "tx-2",
        transactionId: "TXN-2026-002",
        transactionDate: "2026-06-01",
        supplier: "A3 Tech Solutions and Services",
        amount: 32000.00,
        description: "IT Maintenance services and network diagnostic tests for the server room of RAB 1",
        receiptFilename: "receipt_02_server.png",
        status: TransactionStatus.PENDING_VALIDATION,
        supportingDocuments: [
          { id: "doc-5", name: "Scope of Work Approval", type: "Other", filename: "SOW_A3Tech.pdf", uploadedAt: "2026-06-01T09:00:00Z" }
        ],
        history: [
          { id: "th-5", status: TransactionStatus.PENDING_VALIDATION, changedBy: "Pedro B. Penduko", changedAt: "2026-06-02T09:30:00Z", remarks: "Awaiting submission of structural invoice and job completion certification from service heads." }
        ]
      },
      {
        id: "tx-3",
        transactionId: "TXN-2026-003",
        transactionDate: "2026-06-03",
        supplier: "Petron Fuel Station SF",
        amount: 4800.00,
        description: "Official travel fuel refuel package for the Service Isuzu D-MAX - RAB 1 field mission",
        receiptFilename: "fuel_receipt_03.jpg",
        status: TransactionStatus.VALIDATED,
        supportingDocuments: [
          { id: "doc-6", name: "Approved Trip Ticket No 119", type: "Other", filename: "TripTicket_119.pdf", uploadedAt: "2026-06-03T07:45:00Z" },
          { id: "doc-7", name: "Official Fuel Invoice", type: "Invoice", filename: "PetronInv_9921.pdf", uploadedAt: "2026-06-03T16:00:00Z" }
        ],
        history: [
          { id: "th-6", status: TransactionStatus.PENDING_VALIDATION, changedBy: "Andres B. Bonifacio", changedAt: "2026-06-03T17:15:00Z", remarks: "Fuel slip submitted." },
          { id: "th-7", status: TransactionStatus.UNDER_REVIEW, changedBy: "Juan dela Cruz", changedAt: "2026-06-04T11:00:00Z", remarks: "Checking itinerary of Trip Ticket." },
          { id: "th-8", status: TransactionStatus.VALIDATED, changedBy: "Juan dela Cruz", changedAt: "2026-06-05T09:12:00Z", remarks: "Validated. Cleared for budget allocation." }
        ]
      }
    ],
    assets: [
      { id: "ast-1", assetNumber: "HSAC-RAB1-AST-001", serialNumber: "5CD1923JXP", category: "IT Equipment", description: "HP ProBook Laptop Core i5, 16GB RAM, 512GB SSD", dateAcquired: "2024-03-10", cost: 48500.00, status: AssetStatus.ASSIGNED, assignedToId: "EMP002", assignedToName: "Maria Clara V. Santos" },
      { id: "ast-2", assetNumber: "HSAC-RAB1-AST-002", serialNumber: "5CD1923K9D", category: "IT Equipment", description: "HP ProBook Laptop Core i5, 16GB RAM, 512GB SSD", dateAcquired: "2024-03-10", cost: 48500.00, status: AssetStatus.AVAILABLE },
      { id: "ast-3", assetNumber: "HSAC-RAB1-AST-003", serialNumber: "SN-VHL-ISZ8810", category: "Vehicles", description: "Executive Service Vehicle - Isuzu D-MAX 3.0 BluePower 4x4", dateAcquired: "2023-01-20", cost: 1450000.00, status: AssetStatus.ASSIGNED, assignedToId: "EMP001", assignedToName: "Hon. Romeo M. Alcantara" },
      { id: "ast-4", assetNumber: "HSAC-RAB1-AST-004", serialNumber: "OFC-DSK-2024-09", category: "Office Furniture", description: "Executive Mahogany Wooden Desk with drawers", dateAcquired: "2024-06-15", cost: 18000.00, status: AssetStatus.ASSIGNED, assignedToId: "EMP005", assignedToName: "Dr. Jose P. Rizal" },
      { id: "ast-5", assetNumber: "HSAC-RAB1-AST-005", serialNumber: "PRJ-EPS-7712", category: "IT Equipment", description: "Epson Multimedia Projector for Adjudication Hearing Room 1", dateAcquired: "2025-02-05", cost: 26000.00, status: AssetStatus.AVAILABLE },
      { id: "ast-6", assetNumber: "HSAC-RAB1-AST-006", serialNumber: "OFC-CHR-4422", category: "Office Furniture", description: "Ergonomic High-Back Executive Mesh Office Chair", dateAcquired: "2024-06-15", cost: 8500.00, status: AssetStatus.DAMAGED },
      { id: "ast-7", assetNumber: "HSAC-RAB1-AST-007", serialNumber: "TAB-APL-IPD09", category: "IT Equipment", description: "Apple iPad Pro 11-inch (M2, 128GB, Wi-Fi)", dateAcquired: "2024-08-22", cost: 52000.00, status: AssetStatus.LOST }
    ],
    assetIssuances: [
      { id: "iss-1", assetId: "ast-1", assetNumber: "HSAC-RAB1-AST-001", assignedToId: "EMP002", assignedToName: "Maria Clara V. Santos", dateIssued: "2024-03-12", quantity: 1, conditionOnIssue: "Brand New in box" },
      { id: "iss-2", assetId: "ast-3", assetNumber: "HSAC-RAB1-AST-003", assignedToId: "EMP001", assignedToName: "Hon. Romeo M. Alcantara", dateIssued: "2023-01-22", quantity: 1, conditionOnIssue: "Brand New" },
      { id: "iss-3", assetId: "ast-4", assetNumber: "HSAC-RAB1-AST-004", assignedToId: "EMP005", assignedToName: "Dr. Jose P. Rizal", dateIssued: "2024-06-16", quantity: 1, conditionOnIssue: "Good - Minor scratches" }
    ],
    supplyItems: [
      { id: "sup-1", name: "A4 Multi-purpose Bond Paper (80gsm)", totalQuantity: 150, availableQuantity: 112, unit: "reams" },
      { id: "sup-2", name: "Black Gel Ink Pen 0.5mm", totalQuantity: 300, availableQuantity: 245, unit: "pieces" },
      { id: "sup-3", name: "Sign Pen Blue 0.7mm", totalQuantity: 200, availableQuantity: 160, unit: "pieces" },
      { id: "sup-4", name: "Yellow Post-It notes 3x3", totalQuantity: 100, availableQuantity: 82, unit: "pads" },
      { id: "sup-5", name: "Heavy Duty Expanding Folders (Legal)", totalQuantity: 500, availableQuantity: 410, unit: "pieces" }
    ],
    supplyIssuances: [
      { id: "si-1", supplyId: "sup-1", supplyName: "A4 Multi-purpose Bond Paper (80gsm)", issuedToId: "EMP005", issuedToName: "Dr. Jose P. Rizal", quantity: 10, dateIssued: "2026-05-18" },
      { id: "si-2", supplyId: "sup-2", supplyName: "Black Gel Ink Pen 0.5mm", issuedToId: "EMP006", issuedToName: "Andres B. Bonifacio", quantity: 12, dateIssued: "2026-05-20" },
      { id: "si-3", supplyId: "sup-5", supplyName: "Heavy Duty Expanding Folders (Legal)", issuedToId: "EMP006", issuedToName: "Andres B. Bonifacio", quantity: 50, dateIssued: "2026-05-22" }
    ],
    requests: [
      {
        id: "req-1",
        requestType: RequestType.LEAVE,
        employeeId: "EMP006",
        employeeName: "Andres B. Bonifacio",
        dateRequested: "2026-06-01",
        status: RequestStatus.PENDING,
        leaveType: "Vacation Leave",
        startDate: "2026-06-12",
        endDate: "2026-06-15",
        reason: "Family event / out of town celebration in Baguio City."
      } as any,
      {
        id: "req-2",
        requestType: RequestType.SERVICE_RECORD,
        employeeId: "EMP003",
        employeeName: "Juan dela Cruz",
        dateRequested: "2026-06-03",
        status: RequestStatus.APPROVED,
        purpose: "Loan application requirement with GSIS",
        copies: 2,
        approvedBy: "Maria Clara V. Santos (HR)",
        remarks: "Official physical copy prepared in sealed envelope."
      } as any,
      {
        id: "req-3",
        requestType: RequestType.VEHICLE,
        employeeId: "EMP005",
        employeeName: "Dr. Jose P. Rizal",
        dateRequested: "2026-06-04",
        status: RequestStatus.PENDING,
        destination: "Bangui, Ilocos Norte - Dispute Mediation Site Visit",
        purpose: "Conduct compulsory ocular inspection of disputable housing settlements.",
        dateNeeded: "2026-06-18",
        passengers: "Dr. Jose Rizal, Andres Bonifacio, Engr. Juan Perez"
      } as any,
      {
        id: "req-4",
        requestType: RequestType.ZOOM,
        employeeId: "EMP001",
        employeeName: "Hon. Romeo M. Alcantara",
        dateRequested: "2026-06-05",
        status: RequestStatus.APPROVED,
        meetingTitle: "RAB 1 En Banc Case Reconciliation Adjudication",
        meetingDate: "2026-06-10",
        startTime: "09:00 AM",
        endTime: "12:00 PM",
        alternativeHost: "jose.rizal@hsac.gov.ph",
        approvedBy: "Super Administrator",
        remarks: "Assigned Executive Account Room B"
      } as any,
      {
        id: "req-5",
        requestType: RequestType.SUPPLY,
        employeeId: "EMP002",
        employeeName: "Maria Clara V. Santos",
        dateRequested: "2026-06-06",
        status: RequestStatus.PENDING,
        supplyId: "sup-1",
        supplyName: "A4 Multi-purpose Bond Paper (80gsm)",
        quantity: 5,
        purpose: "Urgent recruitment materials printing and exam templates compilation."
      } as any
    ],
    auditLogs: [
      { id: "log-1", timestamp: "2026-06-01T08:30:00Z", userId: "u-2", username: "hr", role: "HR Officer", action: "Login", details: "Successful login via secure web portal" },
      { id: "log-2", timestamp: "2026-06-01T09:12:00Z", userId: "u-2", username: "hr", role: "HR Officer", action: "Create Request Approval", details: "Approved Service Record Request for Juan dela Cruz - Copies: 2" },
      { id: "log-3", timestamp: "2026-06-03T10:15:00Z", userId: "u-3", username: "finance", role: "Finance Officer", action: "Login", details: "Financial Officer logged into ledger analytics portal." },
      { id: "log-4", timestamp: "2026-06-03T11:45:00Z", userId: "u-3", username: "finance", role: "Finance Officer", action: "Review Journal Receipts", details: "Reviewed fuel transaction documentation with ID TXN-2026-003." }
    ],
    liquidations: [
      {
        id: "liqp-1",
        liquidationNo: "LIQ-2026-001",
        requestRef: "REQ-VHL-091",
        employee: "Andres B. Bonifacio",
        department: "Adjudication Division",
        amountReleased: 5000.00,
        amountLiquidated: 4800.00,
        remainingBalance: 200.00,
        liquidationDate: "2026-06-03",
        status: "Completed",
        notes: "Completed Petron fuel trip liquidation. Refund has been submitted.",
        approvedBy: "Juan dela Cruz",
        createdAt: "2026-06-03T17:00:00Z"
      },
      {
        id: "liqp-2",
        liquidationNo: "LIQ-2026-002",
        requestRef: "REQ-SPL-044",
        employee: "Pedro B. Penduko",
        department: "Administrative and Finance Division",
        amountReleased: 15000.00,
        amountLiquidated: 14500.00,
        remainingBalance: 500.00,
        liquidationDate: "2026-05-15",
        status: "Completed",
        notes: "La Union Office Supplies purchase liquidation.",
        approvedBy: "Juan dela Cruz",
        createdAt: "2026-05-15T16:45:00Z"
      },
      {
        id: "liqp-3",
        liquidationNo: "LIQ-2026-003",
        requestRef: "REQ-TRV-112",
        employee: "Juan dela Cruz",
        department: "Administrative and Finance Division",
        amountReleased: 12000.00,
        amountLiquidated: 0.00,
        remainingBalance: 12000.00,
        liquidationDate: "2026-06-08",
        status: "Under Review",
        notes: "Awaiting review of food receipts and accommodation invoice details for mediation trip.",
        createdAt: "2026-06-08T09:00:00Z"
      },
      {
        id: "liqp-4",
        liquidationNo: "LIQ-2026-004",
        requestRef: "REQ-PRV-312",
        employee: "Maria Clara V. Santos",
        department: "Administrative and Finance Division",
        amountReleased: 8500.00,
        amountLiquidated: 0.00,
        remainingBalance: 8500.00,
        liquidationDate: "2026-06-09",
        status: "Pending Submission",
        notes: "Equipment repairs cash advance for regional branch laptops.",
        createdAt: "2026-06-09T08:30:00Z"
      }
    ],
        budgetAllocations: [
      { id: "b-1", department: "Adjudication Division", budgetAllocation: 500000.00, budgetUtilized: 120000.00, remainingBudget: 380000.00, budgetPercentageUsed: 24 },
      { id: "b-2", department: "Administrative and Finance Division", budgetAllocation: 1000000.00, budgetUtilized: 450000.00, remainingBudget: 550000.00, budgetPercentageUsed: 45 },
      { id: "b-3", department: "Legal Division", budgetAllocation: 400000.00, budgetUtilized: 85500.00, remainingBudget: 314500.00, budgetPercentageUsed: 21 }
    ],
    financeAuditLogs: [
      { id: "fl-1", user: "Juan dela Cruz", action: "Validate Transaction", module: "Financial Transactions", timestamp: "2026-05-13T09:30:00Z", previousValue: "Under Review", newValue: "Validated" },
      { id: "fl-2", user: "Juan dela Cruz", action: "Complete Liquidation", module: "Liquidation Monitoring", timestamp: "2026-06-03T17:00:00Z", previousValue: "Under Review", newValue: "Completed" }
    ],
    budgetRequests: [
      { id: "br-1", department: "Adjudication Division", amountRequested: 150000.00, requestType: "Augmentation", purpose: "Additional travel allocations for provincial hearings", status: "Pending", createdAt: "2026-06-15T09:00:00Z" },
      { id: "br-2", department: "Legal Division", amountRequested: 50000.00, requestType: "Emergency", purpose: "Urgent purchase of legal research library subscriptions", status: "Approved", remarks: "Approved for FY2026 Q3", createdAt: "2026-06-12T14:30:00Z" }
    ],
    notifications: [
      {
        id: "notif-1",
        title: "Leave Request Submitted",
        message: "Adjudicator Andres Bonifacio has submitted an urgent Vacation Leave Request for your review.",
        type: "urgent",
        isRead: false,
        timestamp: "2026-06-16T02:00:00Z",
        targetRole: UserRole.HR_OFFICER
      },
      {
        id: "notif-2",
        title: "Low Supply Inventory Range Alert",
        message: "Supply stock for 'A4 Multi-purpose Bond Paper (80gsm)' is currently low (5 units left). Please arrange purchase acquisition.",
        type: "warning",
        isRead: false,
        timestamp: "2026-06-16T01:30:00Z",
        targetRole: UserRole.SUPER_ADMIN
      },
      {
        id: "notif-3",
        title: "Financial Liquidation Verification",
        message: "Juan dela Cruz submitted a travel liquidation of ₱12,000 for travel request REQ-TRV-112. Support vouchers need verification.",
        type: "info",
        isRead: false,
        timestamp: "2026-06-15T18:00:00Z",
        targetRole: UserRole.FINANCE_OFFICER
      },
      {
        id: "notif-4",
        title: "Comprehensive Security Compliance Log Audit",
        message: "All HR and Finance tables comply with RA 10173 Data Privacy protection directives. Periodic validation complete.",
        type: "success",
        isRead: false,
        timestamp: "2026-06-15T10:00:00Z",
        targetRole: UserRole.SUPER_ADMIN
      },
      {
        id: "notif-5",
        title: "En Banc Board Case Reconciliation Scheduled",
        message: "A general assembly has been scheduled for case adjustments on Room B at 09:00 AM.",
        type: "info",
        isRead: false,
        timestamp: "2026-06-15T09:00:00Z",
        targetRole: UserRole.EMPLOYEE
      },
      {
        id: "notif-6",
        title: "Meeting Room Assignment Active",
        message: "Zoom meeting 'RAB 1 En Banc Case Reconciliation Adjudication' setup is ready for launch.",
        type: "success",
        isRead: false,
        timestamp: "2026-06-15T08:00:00Z",
        targetRole: UserRole.EMPLOYEE
      }
    ],
    activities: [],
    liquidationSubmissions: [],
    activityBudgetLinks: [
      { id: "bl-1", liquidationNo: "LIQ-2026-001", employee: "Andres B. Bonifacio", department: "Adjudication Division", amount: 12000.00, budgetId: "b-1", timestamp: "2026-06-14T10:00:00Z" },
      { id: "bl-2", liquidationNo: "LIQ-2026-002", employee: "Apolinario M. Mabini", department: "Legal Division", amount: 25000.00, budgetId: "b-3", timestamp: "2026-06-15T11:30:00Z" }
    ]
  };

  // Write initial setup
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(seedDB, null, 2), "utf8");
  return seedDB;
}

const db = getInitialData();

function saveDB() {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(db, null, 2), "utf8");
}

// RESTful API Routes

// Helper to log audit actions
function logEvent(userId: string, username: string, role: string, action: string, details: string) {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId,
    username,
    role,
    action,
    details
  };
  db.auditLogs.unshift(newLog);
  saveDB();
}

function logFinanceAudit(user: string, action: string, module: string, previousValue: string, newValue: string) {
  const newLog: FinanceAuditLog = {
    id: `fl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user,
    action,
    module,
    timestamp: new Date().toISOString(),
    previousValue: previousValue || "None",
    newValue: newValue || "None"
  };
  if (!db.financeAuditLogs) {
    db.financeAuditLogs = [];
  }
  db.financeAuditLogs.unshift(newLog);
  saveDB();
}

// 1. Authentication Routes
app.post("/api/auth/login", (req, res) => {
  const { username, email, password } = req.body;
  const inputIdentifier = (username || email || "").trim().toLowerCase();
  
  // Resolve standard or sandbox-specific aliases to correct database usernames
  let targetUsername = inputIdentifier;
  if (inputIdentifier === "super-admin@hsac.gov.ph" || inputIdentifier === "admin@hsac.gov.ph" || inputIdentifier === "admin") {
    targetUsername = "admin";
  } else if (inputIdentifier === "hr@hsac.gov.ph" || inputIdentifier === "clara.santos@hsac.gov.ph" || inputIdentifier === "hr") {
    targetUsername = "hr";
  } else if (inputIdentifier === "finance@hsac.gov.ph" || inputIdentifier === "juan.delacruz@hsac.gov.ph" || inputIdentifier === "finance") {
    targetUsername = "finance";
  } else if (inputIdentifier === "employee@hsac.gov.ph" || inputIdentifier === "andres.bonifacio@hsac.gov.ph" || inputIdentifier === "employee") {
    targetUsername = "employee";
  } else if (inputIdentifier === "budget@hsac.gov.ph" || inputIdentifier === "budget" || inputIdentifier === "francisco.balagtas@hsac.gov.ph") {
    targetUsername = "budget";
  }

  // Locate the user record in database
  const user = db.users.find(u => 
    u.username.toLowerCase() === targetUsername || 
    u.email.toLowerCase() === inputIdentifier ||
    u.username.toLowerCase() === inputIdentifier
  );
  
  // Accepts standard "password123" OR sandbox master password for simple user validation flow
  const isValidPassword = password === "password123" || password === "sandbox-master-pass";

  if (user && isValidPassword) {
    if (user.status === "Deactivated") {
      logEvent(user.id, user.username, user.role, "Blocked Login Attempt", "A blocked login attempt was recorded for deactivated account credentials.");
      return res.status(403).json({ status: "error", message: "This user credentials account is Deactivated. Please consult the Division Chief / Administrator." });
    }

    // Return a mocked JWT containing the profile data
    const tokenPayload = Buffer.from(JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      employeeId: user.employeeId
    })).toString("base64");

    logEvent(user.id, user.username, user.role, "Login", "Successful authenticated session login via credentials.");

    const formattedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      employeeId: user.employeeId
    };

    res.json({
      status: "success",
      token: `Bearer ${tokenPayload}`,
      user: formattedUser,
      data: {
        token: `Bearer ${tokenPayload}`,
        user: formattedUser
      }
    });
  } else {
    res.status(401).json({ status: "error", message: "Invalid regional credential pair" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ status: "success", message: "Session signed out successfully" });
});

// Middleware to verify Auth/RBAC Roles
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "error", message: "Authorization credential header required" });
  }

  try {
    const rawPayload = authHeader.split(" ")[1];
    const userJson = JSON.parse(Buffer.from(rawPayload, "base64").toString("utf8"));
    req.user = userJson;
    next();
  } catch (err) {
    return res.status(403).json({ status: "error", message: "Malformed session verification token" });
  }
}

app.get("/api/sessions/current", authenticateToken, (req: any, res) => {
  res.json({ status: "success", data: req.user });
});

// 2. Employee CRUD & Personnel Details
app.get("/api/employees/me", authenticateToken, (req: any, res) => {
  const employeeId = req.user.employeeId;
  const employee = db.employees.find(e => e.employeeId === employeeId);
  if (!employee) {
    return res.status(404).json({ status: "error", message: "Personnel profile not found for this user account" });
  }
  res.json({ status: "success", data: employee });
});

app.get("/api/employees", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.HR_OFFICER) {
    return res.status(403).json({ status: "error", message: "Unauthorized: Full employee list is confidential and restricted." });
  }
  res.json({ status: "success", data: db.employees });
});

app.post("/api/employees", authenticateToken, (req: any, res) => {
  const data = req.body;

  // Enforce Roles: Admin or HR only
  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.HR_OFFICER) {
    return res.status(403).json({ status: "error", message: "Unauthorized: Requires HR or Admin access" });
  }

  const existing = db.employees.find(e => e.employeeId === data.employeeId);
  if (existing) {
    return res.status(400).json({ status: "error", message: "An employee with this Employee ID already exists." });
  }

  const newEmployee: Employee = {
    id: `emp-${Date.now()}`,
    employeeId: data.employeeId,
    fullName: data.fullName,
    position: data.position,
    division: data.division,
    employmentStatus: data.employmentStatus,
    email: data.email,
    address: data.address,
    dateHired: data.dateHired || new Date().toISOString().split("T")[0],
    contactNumber: data.contactNumber,
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    pdsFieldName: data.pdsFieldName || undefined,
    pdsUploadedAt: data.pdsFieldName ? new Date().toISOString() : undefined
  };

  db.employees.push(newEmployee);

  // Add employment history entry
  const newHist: EmploymentHistory = {
    id: `h-${Date.now()}`,
    employeeId: newEmployee.employeeId,
    action: "Service Record Update",
    previousDetails: "N/A",
    newDetails: `Initial employment records set as ${newEmployee.position} (${newEmployee.employmentStatus}) in ${newEmployee.division}.`,
    effectiveDate: newEmployee.dateHired,
    updatedBy: req.user.fullName
  };
  db.employmentHistory.push(newHist);

  // Auto-generate matching portal user if none exists
  const userExist = db.users.find(u => u.username === data.employeeId.toLowerCase());
  if (!userExist) {
    db.users.push({
      id: `u-${Date.now()}`,
      username: data.employeeId.toLowerCase(),
      email: data.email,
      fullName: data.fullName,
      role: UserRole.EMPLOYEE,
      employeeId: data.employeeId,
      createdAt: new Date().toISOString()
    });
  }

  logEvent(req.user.id, req.user.username, req.user.role, "Create Employee", `Registered new personnel ${newEmployee.fullName} (${newEmployee.employeeId})`);
  saveDB();
  res.json({ status: "success", data: newEmployee });
});

app.put("/api/employees/:id", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const data = req.body;

  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.HR_OFFICER) {
    return res.status(403).json({ status: "error", message: "Unauthorized: Requires HR or Admin access" });
  }

  const index = db.employees.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ status: "error", message: "Employee record not found" });
  }

  const oldRecord = db.employees[index];

  // Track changes for history
  let changes: string[] = [];
  if (oldRecord.position !== data.position) {
    changes.push(`Position changed from ${oldRecord.position} to ${data.position}`);
    // Register high history promotable item
    const newHist: EmploymentHistory = {
      id: `h-${Date.now()}`,
      employeeId: oldRecord.employeeId,
      action: "Promotion",
      previousDetails: oldRecord.position,
      newDetails: data.position,
      effectiveDate: new Date().toISOString().split("T")[0],
      updatedBy: req.user.fullName
    };
    db.employmentHistory.push(newHist);
  }
  if (oldRecord.division !== data.division) {
    changes.push(`Division changed from ${oldRecord.division} to ${data.division}`);
    const newHist: EmploymentHistory = {
      id: `h-${Date.now()}`,
      employeeId: oldRecord.employeeId,
      action: "Transfer",
      previousDetails: oldRecord.division,
      newDetails: data.division,
      effectiveDate: new Date().toISOString().split("T")[0],
      updatedBy: req.user.fullName
    };
    db.employmentHistory.push(newHist);
  }

  const updatedEmployee = {
    ...oldRecord,
    ...data,
    pdsFieldName: data.pdsFieldName || oldRecord.pdsFieldName,
    pdsUploadedAt: data.pdsFieldName ? new Date().toISOString() : oldRecord.pdsUploadedAt
  };

  db.employees[index] = updatedEmployee;

  logEvent(req.user.id, req.user.username, req.user.role, "Update Employee", `Updated professional profile of ${updatedEmployee.fullName} (${updatedEmployee.employeeId}). Changes: ${changes.join(", ") || "Contact info"}`);
  saveDB();
  res.json({ status: "success", data: updatedEmployee });
});

app.delete("/api/employees/:id", authenticateToken, (req: any, res) => {
  const { id } = req.params;

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Unauthorized: Requires Super Admin authority" });
  }

  const employee = db.employees.find(e => e.id === id);
  if (!employee) {
    return res.status(404).json({ status: "error", message: "Employee record not found" });
  }

  db.employees = db.employees.filter(e => e.id !== id);

  logEvent(req.user.id, req.user.username, req.user.role, "Delete Employee", `Declassified/Removed Employee record profile ${employee.fullName} (${employee.employeeId})`);
  saveDB();
  res.json({ status: "success", message: "Employee record off-boarded" });
});

// PDS Upload and View Endpoints (base64 simulation)
app.post("/api/employees/:employeeId/pds", authenticateToken, (req: any, res) => {
  const { employeeId } = req.params;
  const { filename } = req.body;

  const emp = db.employees.find(e => e.employeeId === employeeId);
  if (!emp) {
    return res.status(404).json({ status: "error", message: "Target employee record not found" });
  }

  emp.pdsFieldName = filename || "PDS_Document_Uploaded.pdf";
  emp.pdsUploadedAt = new Date().toISOString();

  logEvent(req.user.id, req.user.username, req.user.role, "Upload PDS", `Uploaded official Personal Data Sheet (PDS) for ${emp.fullName} (${employeeId})`);
  saveDB();
  res.json({ status: "success", data: emp });
});

// Employee specific details (Training & History)
app.get("/api/employees/:employeeId/trainings", authenticateToken, (req, res) => {
  const { employeeId } = req.params;
  const records = db.trainings.filter(t => t.employeeId === employeeId);
  res.json({ status: "success", data: records });
});

app.post("/api/employees/:employeeId/trainings", authenticateToken, (req: any, res) => {
  const { employeeId } = req.params;
  const data = req.body;

  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.HR_OFFICER) {
    return res.status(403).json({ status: "error", message: "Unauthorized" });
  }

  const newTraining: Training = {
    id: `t-${Date.now()}`,
    employeeId,
    title: data.title,
    organizer: data.organizer,
    dateConducted: data.dateConducted,
    trainingHours: Number(data.trainingHours || data.hours || 8),
    certificateFilename: data.certificateFilename || "certificate.pdf"
  };

  db.trainings.push(newTraining);
  logEvent(req.user.id, req.user.username, req.user.role, "Add Training", `Added training attendance for ${employeeId}: "${newTraining.title}" (${newTraining.trainingHours} hrs)`);
  saveDB();
  res.json({ status: "success", data: newTraining });
});

app.get("/api/employees/:employeeId/history", authenticateToken, (req, res) => {
  const { employeeId } = req.params;
  const history = db.employmentHistory.filter(h => h.employeeId === employeeId);
  res.json({ status: "success", data: history });
});


// 3. Financial Document & Receipt Tracking Module
app.get("/api/financial-transactions", authenticateToken, (req, res) => {
  res.json({ status: "success", data: db.financialTransactions });
});

app.post("/api/financial-transactions", authenticateToken, (req: any, res) => {
  const data = req.body;

  // Enforce Roles: Admin or Finance
  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.FINANCE_OFFICER) {
    return res.status(403).json({ status: "error", message: "Unauthorized to log financial receipts" });
  }

  const txnId = `TXN-2026-${Math.floor(100 + Math.random() * 900)}`;
  const empRef = data.employeeRef || req.user.employeeId || "EMP003";
  const dept = data.department || req.user.division || "Administrative and Finance Division";
  const cat = data.category || "Other";

  const newTxn: FinancialTransaction = {
    id: `tx-${Date.now()}`,
    transactionId: txnId,
    transactionDate: data.transactionDate || new Date().toISOString().split("T")[0],
    supplier: data.supplier,
    amount: Number(data.amount),
    description: data.description,
    receiptFilename: data.receiptFilename || "receipt.png",
    status: TransactionStatus.PENDING_VALIDATION,
    supportingDocuments: data.supportingDocuments || [],
    history: [{
      id: `th-${Date.now()}`,
      status: TransactionStatus.PENDING_VALIDATION,
      changedBy: req.user.fullName,
      changedAt: new Date().toISOString(),
      remarks: "Receipt submitted to registry ledger. Awaiting Finance verification."
    }],
    employeeRef: empRef,
    department: dept,
    category: cat,
    createdBy: req.user.fullName,
    dateCreated: new Date().toISOString().split("T")[0]
  };

  db.financialTransactions.push(newTxn);
  
  // Create precise finance audit log trace
  logFinanceAudit(req.user.fullName, "Transaction Creation", "Financial Transactions", "None", txnId);
  logEvent(req.user.id, req.user.username, req.user.role, "Register Receipt", `Logged regional financial receipt ${newTxn.transactionId} matching PHP ${newTxn.amount} from ${newTxn.supplier}`);
  saveDB();
  res.json({ status: "success", data: newTxn });
});

// Update financial transactions workflow status index
app.put("/api/financial-transactions/:id/status", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  // Finance Officer or Super Admin validation
  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.FINANCE_OFFICER) {
    return res.status(403).json({ status: "error", message: "Only Finance Officers can validate journals" });
  }

  const txn = db.financialTransactions.find(t => t.id === id);
  if (!txn) {
    return res.status(404).json({ status: "error", message: "Financial entry ledger index not found" });
  }

  const oldStatus = txn.status;
  txn.status = status as TransactionStatus;

  txn.history.push({
    id: `th-${Date.now()}`,
    status: txn.status,
    changedBy: req.user.fullName,
    changedAt: new Date().toISOString(),
    remarks: remarks || `Workflow shift to: ${status}`
  });

  // Track budget utilization dynamically upon validating transactions
  if (status === TransactionStatus.VALIDATED || status === TransactionStatus.LIQUIDATED) {
    if (oldStatus !== TransactionStatus.VALIDATED && oldStatus !== TransactionStatus.LIQUIDATED) {
      const deptBudget = db.budgetAllocations.find(b => b.department === txn.department);
      if (deptBudget) {
        deptBudget.budgetUtilized += txn.amount;
        deptBudget.remainingBudget = deptBudget.budgetAllocation - deptBudget.budgetUtilized;
        deptBudget.budgetPercentageUsed = Math.round((deptBudget.budgetUtilized / deptBudget.budgetAllocation) * 100);
        logFinanceAudit(req.user.fullName, "Update Budget Utilization", "Budget Monitoring", `${deptBudget.budgetUtilized - txn.amount}`, `${deptBudget.budgetUtilized}`);
      }
    }
  }

  logFinanceAudit(req.user.fullName, "Transaction Status Shift", "Financial Transactions", oldStatus, status);
  logEvent(req.user.id, req.user.username, req.user.role, "Validate Financial Record", `Upgraded ledger transaction ${txn.transactionId} status from ${oldStatus} to ${status}`);
  saveDB();
  res.json({ status: "success", data: txn });
});

// Attach general supporting document to transaction index
app.post("/api/financial-transactions/:id/documents", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { name, type, filename } = req.body;

  const txn = db.financialTransactions.find(t => t.id === id);
  if (!txn) {
    return res.status(404).json({ status: "error", message: "Financial entry ledger index not found" });
  }

  const scanFile = filename || "scanned_doc.pdf";
  const newDoc = {
    id: `doc-${Date.now()}`,
    name,
    type,
    filename: scanFile,
    uploadedAt: new Date().toISOString(),
    uploadedBy: req.user.fullName,
    validationStatus: "Validated",
    versions: [
      { version: 1, filename: scanFile, uploadedAt: new Date().toISOString(), uploadedBy: req.user.fullName }
    ]
  };

  txn.supportingDocuments.push(newDoc as any);
  
  logFinanceAudit(req.user.fullName, "Receipt Upload", "Supporting Documents", "None", name);
  logEvent(req.user.id, req.user.username, req.user.role, "Upload Support Doc", `Attached supporting document: "${name}" (${type}) to transaction ledger ${txn.transactionId}`);
  saveDB();
  res.json({ status: "success", data: txn });
});

// Replace/update version of a supporting document
app.post("/api/financial-transactions/:id/documents/:docId/replace", authenticateToken, (req: any, res) => {
  const { id, docId } = req.params;
  const { filename } = req.body;

  const txn = db.financialTransactions.find(t => t.id === id);
  if (!txn) {
    return res.status(404).json({ status: "error", message: "Financial entry ledger index not found" });
  }

  const doc = txn.supportingDocuments.find(d => d.id === docId);
  if (!doc) {
    return res.status(404).json({ status: "error", message: "Supporting document not found in this transaction" });
  }

  if (!doc.versions) {
    doc.versions = [];
  }
  if (doc.versions.length === 0) {
    doc.versions.push({
      version: 1,
      filename: doc.filename,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.uploadedBy || "Staff uploader"
    });
  }

  const nextVersionNum = doc.versions.length + 1;
  const safeFilename = filename || `updated_v${nextVersionNum}_${doc.filename}`;

  doc.versions.push({
    version: nextVersionNum,
    filename: safeFilename,
    uploadedAt: new Date().toISOString(),
    uploadedBy: req.user.fullName
  });

  const oldFilename = doc.filename;
  doc.filename = safeFilename;
  doc.uploadedAt = new Date().toISOString();
  doc.uploadedBy = req.user.fullName;

  logFinanceAudit(req.user.fullName, "Document Replaced", "Supporting Documents", oldFilename, safeFilename);
  logEvent(req.user.id, req.user.username, req.user.role, "Replace Support Doc", `Replaced file for "${doc.name}" on ${txn.transactionId} from ${oldFilename} to ${safeFilename}`);
  saveDB();

  res.json({ status: "success", data: txn });
});

// --- NEW LIQUIDATION WORKFLOW ENDPOINTS (READ-ONLY MONITORING FOR LEGACY CONTEXT) ---
app.get("/api/finance/liquidations", authenticateToken, (req, res) => {
  res.json({ status: "success", data: db.liquidations || [] });
});

app.post("/api/finance/liquidations", authenticateToken, (req: any, res) => {
  return res.status(403).json({
    status: "error",
    message: "Direct budget liquidation additions have been deprecated for compliance safety. All liquidation processing must begin in the Employee Portal via /api/liquidation-submissions, passing through HR verification, Finance validation, and the Division Chief final approved seal."
  });
});

app.put("/api/finance/liquidations/:id/status", authenticateToken, (req: any, res) => {
  return res.status(403).json({
    status: "error",
    message: "Direct adjustment of liquidation statuses is disabled. Status updates must proceed natively through the multi-stage HR-verification to Chief-approval workflow via /api/liquidation-submissions."
  });
});

// --- DYNAMIC PERMANENT ACTIVITY-BUDGET LINKING ENDPOINTS ---
app.get("/api/finance/activity-budget-links", authenticateToken, (req, res) => {
  res.json({ status: "success", data: db.activityBudgetLinks || [] });
});

app.post("/api/finance/activity-budget-links", authenticateToken, (req: any, res) => {
  const { liquidationNo, employee, department, amount, budgetId } = req.body;
  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.BUDGET_OFFICER && req.user.role !== UserRole.FINANCE_OFFICER) {
    return res.status(403).json({ status: "error", message: "Only Budget or Finance Officers can map activities to budgets." });
  }

  const newLink = {
    id: `bl-${Date.now()}`,
    liquidationNo,
    employee,
    department,
    amount: Number(amount),
    budgetId,
    timestamp: new Date().toISOString()
  };

  if (!db.activityBudgetLinks) db.activityBudgetLinks = [];
  db.activityBudgetLinks.unshift(newLink);
  
  logFinanceAudit(req.user.fullName, "Map Activity To Budget", "Budget Linking", "None", `${liquidationNo} linked to ${budgetId}`);
  logEvent(req.user.id, req.user.username, req.user.role, "Map Activity Budget", `Linked activity ${liquidationNo} to budget total`);
  saveDB();

  res.json({ status: "success", data: newLink });
});

// --- NEW BUDGET MANAGEMENT ENDPOINTS ---
app.get("/api/finance/budgets", authenticateToken, (req, res) => {
  res.json({ status: "success", data: db.budgetAllocations || [] });
});

app.post("/api/finance/budgets", authenticateToken, (req: any, res) => {
  const { department, budgetAllocation, approvedRequestId } = req.body;
  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.BUDGET_OFFICER && req.user.role !== UserRole.FINANCE_OFFICER) {
    return res.status(403).json({ status: "error", message: "Unauthorized. Requires Budget Officer or Admin." });
  }

  // If NOT Super Admin, they must provide a valid approved request ID to change/create allocation totals
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    if (!approvedRequestId) {
      return res.status(403).json({ 
        status: "error", 
        message: "Direct budget allocation adjustments that alter approved totals require Chief concurrence. Please submit a Budget Request first, or provide an Approved Request ID." 
      });
    }
    const reqItem = db.budgetRequests?.find(r => r.id === approvedRequestId && r.status === "Approved");
    if (!reqItem) {
      return res.status(403).json({ 
        status: "error", 
        message: "The provided Request ID is either invalid or not yet approved by the Division Chief." 
      });
    }
  }

  const existing = db.budgetAllocations.find(b => b.department.toLowerCase() === department.toLowerCase());
  if (existing) {
    return res.status(400).json({ status: "error", message: "Allocation for department already exists. Please edit instead." });
  }

  const newBudget: BudgetAllocation = {
    id: `b-${Date.now()}`,
    department,
    budgetAllocation: Number(budgetAllocation),
    budgetUtilized: 0,
    remainingBudget: Number(budgetAllocation),
    budgetPercentageUsed: 0
  };
  db.budgetAllocations.push(newBudget);
  logFinanceAudit(req.user.fullName, "Create Budget Allocation", "Budget Monitoring", "None", `${budgetAllocation} for ${department}`);
  logEvent(req.user.id, req.user.username, req.user.role, "Create Budget", `Created new budget allocation for ${department}: PHP ${budgetAllocation}`);
  saveDB();
  res.json({ status: "success", data: newBudget });
});

app.put("/api/finance/budgets/:id", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { budgetAllocation, approvedRequestId } = req.body;

  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.BUDGET_OFFICER && req.user.role !== UserRole.FINANCE_OFFICER) {
    return res.status(403).json({ status: "error", message: "Only Budget or Finance Officers can adjust budget allocations." });
  }

  const budget = db.budgetAllocations.find(b => b.id === id);
  if (!budget) {
    return res.status(404).json({ status: "error", message: "Budget allocation record not found" });
  }

  const targetAmount = Number(budgetAllocation);
  const oldAllocation = budget.budgetAllocation;

  // If the total allocation is being changed and NOT Super Admin, require valid approved budgetRequestId
  if (targetAmount !== oldAllocation && req.user.role !== UserRole.SUPER_ADMIN) {
    if (!approvedRequestId) {
      return res.status(403).json({ 
        status: "error", 
        message: "Any change to the approved allocation amount requires Division Chief concurrence. Please submit a formal Budget Request first, or provide an Approved Request ID." 
      });
    }
    const reqItem = db.budgetRequests?.find(r => r.id === approvedRequestId && r.status === "Approved");
    if (!reqItem) {
      return res.status(403).json({ 
        status: "error", 
        message: "The provided Request ID is either invalid or not yet approved by the Division Chief." 
      });
    }
  }

  budget.budgetAllocation = targetAmount;
  budget.remainingBudget = budget.budgetAllocation - budget.budgetUtilized;
  budget.budgetPercentageUsed = Math.round((budget.budgetUtilized / budget.budgetAllocation) * 100);

  logFinanceAudit(req.user.fullName, "Adjust Budget Allocation", "Budget Monitoring", `${oldAllocation}`, `${budgetAllocation}`);
  logEvent(req.user.id, req.user.username, req.user.role, "Adjust Budget", `Adjusted budget allocation for ${budget.department} to PHP ${budgetAllocation}`);
  saveDB();
  res.json({ status: "success", data: budget });
});

app.get("/api/finance/budget-requests", authenticateToken, (req, res) => {
  res.json({ status: "success", data: db.budgetRequests || [] });
});

app.post("/api/finance/budget-requests", authenticateToken, (req: any, res) => {
  const { department, amountRequested, requestType, purpose } = req.body;
  const newRequest: BudgetRequestItem = {
    id: `br-${Date.now()}`,
    department,
    amountRequested: Number(amountRequested),
    requestType,
    purpose,
    status: "Pending",
    createdAt: new Date().toISOString()
  };
  if (!db.budgetRequests) {
    db.budgetRequests = [];
  }
  db.budgetRequests.push(newRequest);
  logEvent(req.user.id, req.user.username, req.user.role, "Submit Budget Request", `Submitted ${requestType} request for ${department} of PHP ${amountRequested}`);
  saveDB();
  res.json({ status: "success", data: newRequest });
});

app.post("/api/finance/budget-requests/:id/action", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { action, remarks } = req.body; // Approved or Returned

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Only the Division Chief has concession authority to approve/return budget request adjustments." });
  }

  const reqItem = db.budgetRequests?.find(r => r.id === id);
  if (!reqItem) {
    return res.status(404).json({ status: "error", message: "Budget request not found" });
  }

  reqItem.status = action;
  reqItem.remarks = remarks;
  reqItem.approvedBy = req.user.fullName;

  if (action === "Approved") {
    const budget = db.budgetAllocations.find(b => b.department === reqItem.department);
    if (budget) {
      const oldAllocation = budget.budgetAllocation;
      budget.budgetAllocation += reqItem.amountRequested;
      budget.remainingBudget = budget.budgetAllocation - budget.budgetUtilized;
      budget.budgetPercentageUsed = Math.round((budget.budgetUtilized / budget.budgetAllocation) * 100);
      logFinanceAudit(req.user.fullName, `Augment Budget Allocation via request ${reqItem.id}`, "Budget Monitoring", `${oldAllocation}`, `${budget.budgetAllocation}`);
    } else {
      db.budgetAllocations.push({
        id: `b-${Date.now()}`,
        department: reqItem.department,
        budgetAllocation: reqItem.amountRequested,
        budgetUtilized: 0,
        remainingBudget: reqItem.amountRequested,
        budgetPercentageUsed: 0
      });
    }
  }

  logEvent(req.user.id, req.user.username, req.user.role, `${action} Budget Request`, `${action} budget request ${id} with remarks: ${remarks}`);
  saveDB();
  res.json({ status: "success", data: reqItem });
});

app.get("/api/budget-requests", authenticateToken, (req, res) => {
  res.json({ status: "success", data: db.budgetRequests || [] });
});

app.put("/api/budget-requests/:id/approve", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Only the Division Chief has concession authority to approve/return budget request adjustments." });
  }

  const reqItem = db.budgetRequests?.find(r => r.id === id);
  if (!reqItem) {
    return res.status(404).json({ status: "error", message: "Budget request not found" });
  }

  reqItem.status = status;
  reqItem.remarks = remarks || "";
  reqItem.approvedBy = req.user.fullName;

  if (status === "Approved") {
    const budget = db.budgetAllocations.find(b => b.department === reqItem.department);
    if (budget) {
      const oldAllocation = budget.budgetAllocation;
      budget.budgetAllocation += reqItem.amountRequested;
      budget.remainingBudget = budget.budgetAllocation - budget.budgetUtilized;
      budget.budgetPercentageUsed = Math.round((budget.budgetUtilized / budget.budgetAllocation) * 100);
      logFinanceAudit(req.user.fullName, `Augment Budget Allocation (Chief Concurrence) ${reqItem.id}`, "Budget Monitoring", `${oldAllocation}`, `${budget.budgetAllocation}`);
    } else {
      db.budgetAllocations.push({
        id: `b-${Date.now()}`,
        department: reqItem.department,
        budgetAllocation: reqItem.amountRequested,
        budgetUtilized: 0,
        remainingBudget: reqItem.amountRequested,
        budgetPercentageUsed: 0
      });
    }
  }

  logEvent(req.user.id, req.user.username, req.user.role, `Resolve Budget Request: ${status}`, `${status} budget request ${id} with comments: ${remarks}`);
  saveDB();
  res.json({ status: "success", data: reqItem });
});

// --- NEW FINANCE AUDIT ENDPOINT ---
app.get("/api/finance/audit-logs", authenticateToken, (req, res) => {
  res.json({ status: "success", data: db.financeAuditLogs || [] });
});


// 4. Property Accountability, Assets & Supply Monitoring Module
app.get("/api/assets", authenticateToken, (req, res) => {
  res.json({ status: "success", data: db.assets });
});

app.post("/api/assets", authenticateToken, (req: any, res) => {
  const data = req.body;

  // Access check: Admin
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Access denied: Requires Admin" });
  }

  const existing = db.assets.find(a => a.assetNumber === data.assetNumber);
  if (existing) {
    return res.status(400).json({ status: "error", message: "Asset Number already registered" });
  }

  const newAsset: Asset = {
    id: `ast-${Date.now()}`,
    assetNumber: data.assetNumber || `HSAC-RAB1-AST-${Math.floor(100 + Math.random() * 900)}`,
    serialNumber: data.serialNumber || "N/A",
    category: data.category,
    description: data.description,
    dateAcquired: data.dateAcquired || new Date().toISOString().split("T")[0],
    cost: Number(data.cost),
    status: AssetStatus.AVAILABLE
  };

  db.assets.push(newAsset);
  logEvent(req.user.id, req.user.username, req.user.role, "Register Asset", `Registered inventory item ${newAsset.assetNumber} - ${newAsset.description}`);
  saveDB();
  res.json({ status: "success", data: newAsset });
});

// Update asset status
app.put("/api/assets/:id/status", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Unauthorized" });
  }

  const asset = db.assets.find(a => a.id === id);
  if (!asset) {
    return res.status(404).json({ status: "error", message: "Asset not found" });
  }

  const oldStatus = asset.status;
  asset.status = status as AssetStatus;
  
  if (status === AssetStatus.AVAILABLE) {
    asset.assignedToId = undefined;
    asset.assignedToName = undefined;
  }

  logEvent(req.user.id, req.user.username, req.user.role, "Update Asset Status", `Altered inventory status of ${asset.assetNumber} from ${oldStatus} to ${status}`);
  saveDB();
  res.json({ status: "success", data: asset });
});

// Allocate/Issue property accountability
app.post("/api/assets/:id/issue", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { employeeId } = req.body;

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Access restricted to Admin" });
  }

  const asset = db.assets.find(a => a.id === id);
  if (!asset) {
    return res.status(404).json({ status: "error", message: "Asset index entry not found" });
  }

  const employee = db.employees.find(e => e.employeeId === employeeId);
  if (!employee) {
    return res.status(404).json({ status: "error", message: "Target Employee record not found to claim receipt" });
  }

  asset.status = AssetStatus.ASSIGNED;
  asset.assignedToId = employee.employeeId;
  asset.assignedToName = employee.fullName;

  const issuance: AssetIssuance = {
    id: `iss-${Date.now()}`,
    assetId: asset.id,
    assetNumber: asset.assetNumber,
    assignedToId: employee.employeeId,
    assignedToName: employee.fullName,
    dateIssued: new Date().toISOString().split("T")[0],
    quantity: 1,
    conditionOnIssue: "Good working condition - Active accountability hand-off and signature"
  };

  db.assetIssuances.push(issuance);
  logEvent(req.user.id, req.user.username, req.user.role, "Assign Accountability", `Issued property item ${asset.assetNumber} to ${employee.fullName} under PAR`);
  saveDB();
  res.json({ status: "success", data: asset });
});

// Process asset returns
app.post("/api/assets/:id/return", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { conditionOnReturn, clearanceStatus } = req.body;

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Access restricted to Admin" });
  }

  const asset = db.assets.find(a => a.id === id);
  if (!asset) {
    return res.status(404).json({ status: "error", message: "Asset not found" });
  }

  const borrowerName = asset.assignedToName || "Personnel";
  
  asset.status = AssetStatus.RETURNED;
  asset.assignedToId = undefined;
  asset.assignedToName = undefined;

  // Find active issuance and update return records
  const issuance = db.assetIssuances.find(i => i.assetId === id && !i.returnDate);
  if (issuance) {
    issuance.returnDate = new Date().toISOString().split("T")[0];
    issuance.conditionOnReturn = conditionOnReturn || "Returned in good physical status - general wear and tear";
    issuance.clearanceStatus = clearanceStatus || "Cleared";
  }

  logEvent(req.user.id, req.user.username, req.user.role, "Return Asset Accountability", `Received returned property item ${asset.assetNumber} from ${borrowerName} with status [${clearanceStatus || "Cleared"}]`);
  saveDB();
  res.json({ status: "success", data: asset });
});

// Supply Inventory list
app.get("/api/supplies", authenticateToken, (req, res) => {
  res.json({ status: "success", data: db.supplyItems });
});

app.post("/api/supplies", authenticateToken, (req: any, res) => {
  const data = req.body;

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Authorized to Admin only" });
  }

  const newSupply: SupplyItem = {
    id: `sup-${Date.now()}`,
    name: data.name,
    totalQuantity: Number(data.totalQuantity),
    availableQuantity: Number(data.totalQuantity),
    unit: data.unit || "pieces"
  };

  db.supplyItems.push(newSupply);
  logEvent(req.user.id, req.user.username, req.user.role, "Create Supply Item", `Added new common supply item to shelf: "${newSupply.name}"`);
  saveDB();
  res.json({ status: "success", data: newSupply });
});

// Direct issue of supplies to administrative offices
app.get("/api/supplies/issuances", authenticateToken, (req, res) => {
  res.json({ status: "success", data: db.supplyIssuances });
});

app.post("/api/supplies/issue", authenticateToken, (req: any, res) => {
  const { supplyId, issuedToId, quantity } = req.body;

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Unauthorized" });
  }

  const supply = db.supplyItems.find(s => s.id === supplyId);
  if (!supply) {
    return res.status(404).json({ status: "error", message: "Supply inventory item not found" });
  }

  if (supply.availableQuantity < Number(quantity)) {
    return res.status(400).json({ status: "error", message: `Insufficient quantities on stock. Max available: ${supply.availableQuantity}` });
  }

  const employee = db.employees.find(e => e.employeeId === issuedToId);
  const employeeName = employee ? employee.fullName : issuedToId;

  supply.availableQuantity -= Number(quantity);

  const issuance: SupplyIssuance = {
    id: `si-${Date.now()}`,
    supplyId,
    supplyName: supply.name,
    issuedToId,
    issuedToName: employeeName,
    quantity: Number(quantity),
    dateIssued: new Date().toISOString().split("T")[0]
  };

  db.supplyIssuances.push(issuance);
  logEvent(req.user.id, req.user.username, req.user.role, "Issue Supplies", `Handed out ${quantity} ${supply.unit} of "${supply.name}" to ${employeeName}`);
  saveDB();
  res.json({ status: "success", data: supply });
});


// 5. Digital Request & Approvals Workflow
app.get("/api/requests", authenticateToken, (req: any, res) => {
  // Employees can only view their own requests unless they are Admin, HR, Department Head, Custodian
  const { role, employeeId } = req.user;
  
  if (role === UserRole.EMPLOYEE) {
    const records = db.requests.filter(r => r.employeeId === employeeId);
    return res.json({ status: "success", data: records });
  }
  
  res.json({ status: "success", data: db.requests });
});

app.post("/api/requests", authenticateToken, (req: any, res) => {
  const data = req.body;
  const { employeeId, fullName } = req.user;

  if (!employeeId) {
    return res.status(400).json({ status: "error", message: "User is not linked to a regional employee profile code" });
  }

  const baseReq = {
    id: `req-${Date.now()}`,
    requestType: data.requestType,
    employeeId,
    employeeName: fullName,
    dateRequested: new Date().toISOString().split("T")[0],
    status: RequestStatus.PENDING
  };

  let fullReq: AnyRequest;

  switch (data.requestType) {
    case RequestType.LEAVE:
      fullReq = {
        ...baseReq,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason
      } as any;
      break;
    case RequestType.SERVICE_RECORD:
      fullReq = {
        ...baseReq,
        purpose: data.purpose,
        copies: Number(data.copies || 1)
      } as any;
      break;
    case RequestType.VEHICLE:
      fullReq = {
        ...baseReq,
        destination: data.destination,
        purpose: data.purpose,
        dateNeeded: data.dateNeeded,
        passengers: data.passengers
      } as any;
      break;
    case RequestType.ZOOM:
      fullReq = {
        ...baseReq,
        meetingTitle: data.meetingTitle,
        meetingDate: data.meetingDate,
        startTime: data.startTime,
        endTime: data.endTime,
        alternativeHost: data.alternativeHost
      } as any;
      break;
    case RequestType.SUPPLY:
      fullReq = {
        ...baseReq,
        supplyId: data.supplyId,
        supplyName: data.supplyName,
        quantity: Number(data.quantity),
        purpose: data.purpose
      } as any;
      break;
    default:
      return res.status(400).json({ status: "error", message: "Invalid regional service request classification type" });
  }

  db.requests.push(fullReq);
  
  // Trigger system notification dynamically
  if (!db.notifications) {
    db.notifications = [];
  }
  let targetRole: string | undefined = undefined;
  if (fullReq.requestType === RequestType.LEAVE || fullReq.requestType === RequestType.SERVICE_RECORD || fullReq.requestType === RequestType.SUPPLY || fullReq.requestType === RequestType.VEHICLE || fullReq.requestType === RequestType.ZOOM) {
    targetRole = UserRole.HR_OFFICER;
  }
  db.notifications.push({
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: `New ${fullReq.requestType}`,
    message: `${fullReq.employeeName} submitted a ${fullReq.requestType} for verification and approval.`,
    type: "info",
    isRead: false,
    timestamp: new Date().toISOString(),
    targetRole
  });

  logEvent(req.user.id, req.user.username, req.user.role, "Create Request", `Submitted digital request: ${fullReq.requestType} for processing.`);
  saveDB();
  res.json({ status: "success", data: fullReq });
});

// Old Appraise and adjudicate Requests index status has been deprecated for security compliance.
app.put("/api/requests/:id/approve", authenticateToken, (req: any, res) => {
  return res.status(400).json({ 
    status: "error", 
    message: "This shortcut approval endpoint has been disabled for workflow safety. Please use /api/requests/:id/hr-endorse and /api/requests/:id/chief-decide to follow the mandated two-stage approval governance." 
  });
});
// 6. Role-Based Dashboards & Analytics
app.get("/api/dashboard/summary", authenticateToken, (req: any, res) => {
  const role = req.user.role;
  
  // Total stats values (general overview)
  const totalEmployees = db.employees.length;
  const activeEmployees = db.employees.filter(e => e.employmentStatus === "Permanent").length;
  const listTrainings = db.trainings;
  const totalAssetsVal = db.assets.reduce((sum, a) => sum + a.cost, 0);

  const pendingValidations = db.financialTransactions.filter(t => t.status === TransactionStatus.PENDING_VALIDATION).length;
  const validatedTransactions = db.financialTransactions.filter(t => t.status === TransactionStatus.VALIDATED).length;
  const liquidatedTransactions = db.financialTransactions.filter(t => t.status === TransactionStatus.LIQUIDATED).length;
  const totalExpenditure = db.financialTransactions.reduce((acc, t) => acc + t.amount, 0);

  const totalAssets = db.assets.length;
  const assignedAssets = db.assets.filter(a => a.status === AssetStatus.ASSIGNED).length;
  const returnedAssets = db.assets.filter(a => a.status === AssetStatus.RETURNED).length;
  const damagedAssets = db.assets.filter(a => a.status === AssetStatus.DAMAGED).length;

  const totalRequests = db.requests.length;
  const pendingRequests = db.requests.filter(r => r.status === RequestStatus.PENDING).length;

  res.json({
    status: "success",
    data: {
      role,
      userFullName: req.user.fullName,
      stats: {
        totalEmployees,
        activeEmployees,
        trainingCount: listTrainings.length,
        totalAssets,
        assignedAssets,
        returnedAssets,
        damagedAssets,
        totalAssetsVal,
        totalTransactions: db.financialTransactions.length,
        pendingValidations,
        validatedTransactions,
        liquidatedTransactions,
        totalExpenditure,
        totalRequests,
        pendingRequests,
      },
      auditLogs: db.auditLogs.slice(0, 8), // recent activities
      recentRequests: db.requests.slice(0, 5),
      recentTransactions: db.financialTransactions.slice(0, 5),
    }
  });
});

// 7. Audit System Log index route
app.get("/api/audit-logs", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Only administrators can review operational security audits" });
  }
  res.json({ status: "success", data: db.auditLogs });
});

// 8. Dynamic Notifications APIs
app.get("/api/notifications", authenticateToken, (req: any, res) => {
  if (!db.notifications) {
    db.notifications = [];
  }
  const role = req.user.role;
  const employeeId = req.user.employeeId;
  // Send notifications belonging to this role OR globals (which have no targetRole), filtered by employeeId if targetRole is Employee
  const filtered = db.notifications.filter(n => {
    const roleMatches = !n.targetRole || n.targetRole === role;
    if (role === UserRole.EMPLOYEE) {
      return roleMatches && (!n.targetEmployeeId || n.targetEmployeeId === employeeId);
    }
    return roleMatches;
  });
  res.json({ status: "success", data: filtered });
});

app.post("/api/notifications/:id/read", authenticateToken, (req: any, res) => {
  if (!db.notifications) {
    db.notifications = [];
  }
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.isRead = true;
    saveDB();
    res.json({ status: "success", data: notif });
  } else {
    res.status(404).json({ status: "error", message: "Notification slot not found" });
  }
});

app.post("/api/notifications/read-all", authenticateToken, (req: any, res) => {
  if (!db.notifications) {
    db.notifications = [];
  }
  const role = req.user.role;
  const employeeId = req.user.employeeId;
  db.notifications.forEach(n => {
    const roleMatches = !n.targetRole || n.targetRole === role;
    if (role === UserRole.EMPLOYEE) {
      if (roleMatches && (!n.targetEmployeeId || n.targetEmployeeId === employeeId)) {
        n.isRead = true;
      }
    } else {
      if (roleMatches) {
        n.isRead = true;
      }
    }
  });
  saveDB();
  res.json({ status: "success", message: "All user notifications marked as read successfully" });
});


// ============================================
// PARTNERSHIP & ALIGNMENT API SUITE
// ============================================

// A. USER ACCOUNT & ROLE MANAGEMENT (Administrator/Chief)
app.get("/api/admin/users", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Requires Administrator / Division Chief privileges" });
  }
  res.json({ status: "success", data: db.users });
});

app.post("/api/admin/users", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Requires Administrator / Division Chief privileges" });
  }
  const { username, email, fullName, role, status } = req.body;
  if (!username || !email || !fullName || !role) {
    return res.status(400).json({ status: "error", message: "Please supply all required properties" });
  }
  
  const existing = db.users.find(u => u.username === username || u.email === email);
  if (existing) {
    return res.status(400).json({ status: "error", message: "Username or Email already registered" });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    username,
    email,
    fullName,
    role,
    status: status || "Active",
    employeeId: `EMP${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  logEvent(req.user.id, req.user.username, req.user.role, "Create User Account", `Created digital user: ${username} with role ${role}`);
  saveDB();
  res.json({ status: "success", data: newUser });
});

app.put("/api/admin/users/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Requires Administrator / Division Chief privileges" });
  }
  const { id } = req.params;
  const { fullName, email, role, username, status } = req.body;
  
  const targetUser = db.users.find(u => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ status: "error", message: "User account not found" });
  }

  if (fullName) targetUser.fullName = fullName;
  if (email) targetUser.email = email;
  if (role) targetUser.role = role;
  if (username) targetUser.username = username;
  if (status) targetUser.status = status;

  logEvent(req.user.id, req.user.username, req.user.role, "Modify User Account", `Modified user details for: ${targetUser.username} (${status || targetUser.status})`);
  saveDB();
  res.json({ status: "success", data: targetUser });
});

app.delete("/api/admin/users/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Requires Administrator / Division Chief privileges" });
  }
  const { id } = req.params;
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ status: "error", message: "User not found" });
  }
  if (db.users[index].username === "admin" || db.users[index].id === req.user.id) {
    return res.status(400).json({ status: "error", message: "Cannot remove seed superuser or your own active credential" });
  }
  const removed = db.users.splice(index, 1);
  logEvent(req.user.id, req.user.username, req.user.role, "Delete User Account", `Removed user: ${removed[0].username}`);
  saveDB();
  res.json({ status: "success", message: "User account deleted successfully" });
});


// B. PERSONNEL TWO-STAGE ENDORSEMENT FLOW
app.put("/api/requests/:id/hr-endorse", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.HR_OFFICER) {
    return res.status(403).json({ status: "error", message: "Requires HR Officer review authorities" });
  }
  const { id } = req.params;
  const { endorse, remarks } = req.body; // endorse: boolean

  const request = db.requests.find(r => r.id === id);
  if (!request) return res.status(404).json({ status: "error", message: "Personnel Request not found" });

  if (endorse) {
    request.status = RequestStatus.ENDORSED_TO_CHIEF;
    request.remarks = remarks || "Endorsed under HR review benchmarks.";
  } else {
    request.status = RequestStatus.RETURNED_BY_HR;
    request.remarks = remarks || "Returned with HR verification queries.";
  }
  
  if (!db.notifications) db.notifications = [];
  db.notifications.push({
    id: `notif-${Date.now()}`,
    title: endorse ? "Request Endorsed" : "Request Returned to Employee",
    message: endorse 
      ? `HR Officer ${req.user.fullName} endorsed ${request.requestType} for ${request.employeeName} to Division Chief.`
      : `HR Officer ${req.user.fullName} returned ${request.requestType} with remarks: "${remarks}".`,
    type: endorse ? "success" : "warning",
    isRead: false,
    timestamp: new Date().toISOString(),
    targetRole: endorse ? UserRole.SUPER_ADMIN : UserRole.EMPLOYEE,
    targetEmployeeId: endorse ? undefined : request.employeeId
  });

  logEvent(req.user.id, req.user.username, req.user.role, "Endorse Personnel Request", `HR acted on request ${request.id}, status: ${request.status}`);
  saveDB();
  res.json({ status: "success", data: request });
});

app.put("/api/requests/:id/chief-decide", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Requires Administrator / Division Chief final authority" });
  }
  const { id } = req.params;
  const { decision, remarks } = req.body; // decision: "Approved" | "Rejected" | "Returned"

  const request = db.requests.find(r => r.id === id);
  if (!request) return res.status(404).json({ status: "error", message: "Personnel Request not found" });

  if (decision === "Approved") {
    request.status = RequestStatus.APPROVED;
    request.approvedBy = req.user.fullName;
    request.remarks = remarks || "Approved and finalized by Division Chief.";

    // If Supply request, deduct inventory
    if (request.requestType === RequestType.SUPPLY) {
      const supplyReq = request as any;
      const supply = db.supplyItems.find(s => s.id === supplyReq.supplyId || s.name === supplyReq.supplyName);
      if (supply) {
        if (supply.availableQuantity >= supplyReq.quantity) {
          supply.availableQuantity -= supplyReq.quantity;
          db.supplyIssuances.push({
            id: `si-${Date.now()}`,
            supplyId: supply.id,
            supplyName: supply.name,
            issuedToId: supplyReq.employeeId,
            issuedToName: supplyReq.employeeName,
            quantity: supplyReq.quantity,
            dateIssued: new Date().toISOString().split("T")[0]
          });
        } else {
          request.status = RequestStatus.REJECTED;
          request.remarks = "Disapproved: Supply requested quantity exceeds currently available warehouse balance.";
        }
      }
    }
  } else if (decision === "Returned") {
    request.status = RequestStatus.RETURNED_BY_CHIEF;
    request.remarks = remarks || "Returned for corrections by Division Chief.";
  } else {
    request.status = RequestStatus.REJECTED;
    request.remarks = remarks || "Rejected by Division Chief.";
  }

  if (!db.notifications) db.notifications = [];
  db.notifications.push({
    id: `notif-${Date.now()}`,
    title: `Request ${request.status}`,
    message: `Division Chief Hon. Romeo M. Alcantara acted on your ${request.requestType}: ${request.status}`,
    type: request.status === RequestStatus.APPROVED ? "success" : "warning",
    isRead: false,
    timestamp: new Date().toISOString(),
    targetRole: UserRole.EMPLOYEE,
    targetEmployeeId: request.employeeId
  });

  logEvent(req.user.id, req.user.username, req.user.role, "Final Chief Decision", `Chief decided ${request.id}, status: ${request.status}`);
  saveDB();
  res.json({ status: "success", data: request });
});


// C. ASSIGNED ACTIVITIES APIs
app.get("/api/activities", authenticateToken, (req: any, res) => {
  const { role, employeeId } = req.user;
  if (role === UserRole.EMPLOYEE) {
    const list = db.activities.filter(a => a.assignedEmployeeId === employeeId);
    return res.json({ status: "success", data: list });
  }
  res.json({ status: "success", data: db.activities });
});

app.post("/api/activities", authenticateToken, (req: any, res) => {
  const { title, description, dateScheduled, allottedBudget, budgetId, assignedEmployeeId } = req.body;
  if (!title || !allottedBudget || !assignedEmployeeId) {
    return res.status(400).json({ status: "error", message: "Missing required activity definition metrics" });
  }

  const newAct = {
    id: `act-${Date.now()}`,
    activityNo: `ACT-2026-0${db.activities.length + 1}`,
    title,
    description: description || "",
    dateScheduled: dateScheduled || new Date().toISOString().split("T")[0],
    allottedBudget: Number(allottedBudget),
    budgetId: budgetId || "b-2",
    assignedEmployeeId,
    status: "Active"
  };

  db.activities.push(newAct);
  logEvent(req.user.id, req.user.username, req.user.role, "Create Activity", `Created assigned employee activity: ${title}`);
  saveDB();
  res.json({ status: "success", data: newAct });
});


// D. THREE-STAGED EXHAUSTIVE LIQUIDATION SUBMISSIONS APIs
app.get("/api/liquidation-submissions", authenticateToken, (req: any, res) => {
  const { role, employeeId } = req.user;
  if (role === UserRole.EMPLOYEE) {
    const list = db.liquidationSubmissions.filter(l => l.employeeId === employeeId);
    return res.json({ status: "success", data: list });
  }
  res.json({ status: "success", data: db.liquidationSubmissions });
});

app.post("/api/liquidation-submissions", authenticateToken, (req: any, res) => {
  const { employeeId, fullName } = req.user;
  const { activityId, totalReleased, totalSpent, remarks, supportingDocs } = req.body;

  if (!activityId || !totalReleased) {
    return res.status(400).json({ status: "error", message: "Please compile activity reference and budget disbursement values" });
  }

  const subNo = `LIQSUB-2026-0${db.liquidationSubmissions.length + 1}`;
  const newSub = {
    id: `liqsub-${Date.now()}`,
    submissionNo: subNo,
    activityId,
    employeeId,
    employeeName: fullName,
    totalReleased: Number(totalReleased),
    totalSpent: Number(totalSpent || 0),
    remainingBalance: Number(totalReleased) - Number(totalSpent || 0),
    remarks: remarks || "",
    supportingDocs: supportingDocs || [],
    hrStatus: "Pending Review",
    hrRemarks: "",
    financeStatus: "Pending Validation",
    financeRemarks: "",
    divisionChiefStatus: "Pending Chief Approval",
    divisionChiefRemarks: "",
    status: "Pending HR Review",
    createdAt: new Date().toISOString()
  };

  db.liquidationSubmissions.push(newSub);
  
  if (!db.notifications) db.notifications = [];
  db.notifications.push({
    id: `notif-${Date.now()}`,
    title: "Liquidation Report Submitted",
    message: `${fullName} submitted a liquidation report for activity relationship evaluation.`,
    isRead: false,
    type: "info",
    timestamp: new Date().toISOString(),
    targetRole: UserRole.HR_OFFICER
  });

  logEvent(req.user.id, req.user.username, req.user.role, "Submit Liquidation", `Submitted liquidation report: ${subNo}`);
  saveDB();
  res.json({ status: "success", data: newSub });
});

app.put("/api/liquidation-submissions/:id/resubmit", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { totalSpent, remarks, supportingDocs } = req.body;

  const sub = db.liquidationSubmissions.find(l => l.id === id);
  if (!sub) {
    return res.status(404).json({ status: "error", message: "Submission records not found" });
  }

  if (sub.employeeId !== req.user.employeeId && req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Forbidden: You cannot resubmit this report details." });
  }

  // Update details
  sub.totalSpent = Number(totalSpent || 0);
  sub.remainingBalance = sub.totalReleased - sub.totalSpent;
  sub.remarks = remarks || sub.remarks;
  
  if (supportingDocs && supportingDocs.length > 0) {
    // Append unique documents to keep version history
    const uniqueDocs = [...sub.supportingDocs];
    for (const d of supportingDocs) {
      if (!uniqueDocs.some(existing => existing.name === d.name)) {
        uniqueDocs.push(d);
      }
    }
    sub.supportingDocs = uniqueDocs;
  }

  // Revert statuses for workflow loop re-execution
  sub.status = "Pending HR Review";
  sub.hrStatus = "Pending Review";
  sub.financeStatus = "Pending Validation";
  sub.divisionChiefStatus = "Pending Chief Approval";

  if (!db.notifications) db.notifications = [];
  db.notifications.push({
    id: `notif-${Date.now()}`,
    title: "Liquidation Report Resubmitted",
    message: `${req.user.fullName} corrected and resubmitted liquidation report ${sub.submissionNo}.`,
    isRead: false,
    type: "info",
    timestamp: new Date().toISOString(),
    targetRole: UserRole.HR_OFFICER
  });

  logEvent(req.user.id, req.user.username, req.user.role, "Resubmit Liquidation", `Resubmitted liquidation report: ${sub.submissionNo}`);
  saveDB();
  res.json({ status: "success", data: sub });
});

app.put("/api/liquidation-submissions/:id/hr-action", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.HR_OFFICER) {
    return res.status(403).json({ status: "error", message: "Access Restricted to HR Officer verification" });
  }
  const { id } = req.params;
  const { action, remarks } = req.body; // action: "Verify" | "Return"

  const sub = db.liquidationSubmissions.find(l => l.id === id);
  if (!sub) return res.status(404).json({ status: "error", message: "Submission records not found" });

  if (action === "Verify") {
    sub.hrStatus = "Verified & Forwarded";
    sub.hrRemarks = remarks || "Relationship confirmed between employee, activity, and budget line.";
    sub.hrVerifiedBy = req.user.fullName;
    sub.hrVerifiedAt = new Date().toISOString();
    sub.status = "Verified & Forwarded";
    
    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: `notif-${Date.now()}`,
      title: "HR Verification Completed",
      message: `Liquidation submission ${sub.submissionNo} verified by HR & forwarded to Finance.`,
      isRead: false,
      type: "success",
      timestamp: new Date().toISOString(),
      targetRole: UserRole.FINANCE_OFFICER
    });
  } else {
    sub.hrStatus = "Returned by HR";
    sub.hrRemarks = remarks || "Assigned activity/employee mismatch; returned for revision.";
    sub.status = "Returned";
    
    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: `notif-${Date.now()}`,
      title: "Liquidation Submission Returned",
      message: `Your liquidation report ${sub.submissionNo} was returned by HR: ${remarks}`,
      isRead: false,
      type: "warning",
      timestamp: new Date().toISOString(),
      targetRole: UserRole.EMPLOYEE,
      targetEmployeeId: sub.employeeId
    });
  }

  logEvent(req.user.id, req.user.username, req.user.role, "HR Verify Liquidation", `HR evaluated liquidation ${sub.submissionNo} with action ${action}`);
  saveDB();
  res.json({ status: "success", data: sub });
});

app.put("/api/liquidation-submissions/:id/finance-action", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.FINANCE_OFFICER) {
    return res.status(403).json({ status: "error", message: "Access restricted to Financial Officer validations" });
  }
  const { id } = req.params;
  const { action, remarks } = req.body; // action: "Validate" | "Return"

  const sub = db.liquidationSubmissions.find(l => l.id === id);
  if (!sub) return res.status(404).json({ status: "error", message: "Submission records not found" });

  if (action === "Validate") {
    sub.financeStatus = "Validated & Endorsed";
    sub.financeRemarks = remarks || "Financial documentations, vouchers, and ledger matching validated.";
    sub.financeValidatedBy = req.user.fullName;
    sub.financeValidatedAt = new Date().toISOString();
    sub.status = "Validated & Endorsed";

    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: `notif-${Date.now()}`,
      title: "Finance Validation Completed",
      message: `Liquidation submission ${sub.submissionNo} validated and endorsed. Chief final seal pending.`,
      isRead: false,
      type: "success",
      timestamp: new Date().toISOString(),
      targetRole: UserRole.SUPER_ADMIN
    });
  } else {
    sub.financeStatus = "Returned by Finance";
    sub.financeRemarks = remarks || "Receipt vouchers incomplete; returned for clarification.";
    sub.status = "Returned";

    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: `notif-${Date.now()}`,
      title: "Liquidation Submission Returned (Finance)",
      message: `Your liquidation report ${sub.submissionNo} was returned by Finance: ${remarks}`,
      isRead: false,
      type: "warning",
      timestamp: new Date().toISOString(),
      targetRole: UserRole.EMPLOYEE,
      targetEmployeeId: sub.employeeId
    });
  }

  logEvent(req.user.id, req.user.username, req.user.role, "Finance Validate Liquidation", `Finance evaluated liquidation ${sub.submissionNo} with action ${action}`);
  saveDB();
  res.json({ status: "success", data: sub });
});

app.put("/api/liquidation-submissions/:id/chief-action", authenticateToken, (req: any, res) => {
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ status: "error", message: "Only Division Chief can give the final seal" });
  }
  const { id } = req.params;
  const { action, remarks } = req.body; // action: "Approve" | "Reject" | "Return"

  const sub = db.liquidationSubmissions.find(l => l.id === id);
  if (!sub) return res.status(404).json({ status: "error", message: "Submission records not found" });

  if (action === "Approve") {
    sub.divisionChiefStatus = "Approved";
    sub.divisionChiefRemarks = remarks || "Final liquidation approved. Record is finalized.";
    sub.divisionChiefApprovedBy = req.user.fullName;
    sub.divisionChiefApprovedAt = new Date().toISOString();
    sub.status = "Approved";

    const act = db.activities.find(a => a.id === sub.activityId);
    if (act) {
      const budget = db.budgetAllocations.find(b => b.id === act.budgetId || b.department === act.title);
      if (budget) {
        budget.budgetUtilized += sub.totalSpent;
        budget.remainingBudget = budget.budgetAllocation - budget.budgetUtilized;
        budget.budgetPercentageUsed = Math.round((budget.budgetUtilized / budget.budgetAllocation) * 100);
      }
    }

    db.financialTransactions.push({
      id: `tx-${Date.now()}`,
      transactionId: `TX-LIQ-${Date.now().toString().slice(-4)}`,
      transactionDate: new Date().toISOString().split("T")[0],
      supplier: "Regional Expenses",
      amount: sub.totalSpent,
      description: `Official travel liquidation for activity: ${act ? act.title : sub.submissionNo}`,
      status: TransactionStatus.LIQUIDATED,
      supportingDocuments: sub.supportingDocs.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        filename: d.filename,
        uploadedAt: d.uploadedAt,
        validationStatus: "Validated"
      })),
      history: [
        { id: `his-${Date.now()}`, status: TransactionStatus.LIQUIDATED, changedBy: req.user.fullName, changedAt: new Date().toISOString(), remarks: "Approved and finalized from Employee Liquidation submission" }
      ],
      employeeRef: sub.employeeId,
      department: "Administrative and Finance Division",
      category: "Travel",
      createdBy: sub.employeeName,
      dateCreated: new Date().toISOString()
    });

    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: `notif-${Date.now()}`,
      title: "Liquidation APPROVED",
      message: `Your liquidation report ${sub.submissionNo} has received the final approved seal from Division Chief Hon. Romeo M. Alcantara!`,
      isRead: false,
      type: "success",
      timestamp: new Date().toISOString(),
      targetRole: UserRole.EMPLOYEE,
      targetEmployeeId: sub.employeeId
    });
  } else if (action === "Return") {
    sub.divisionChiefStatus = "Returned by Chief";
    sub.divisionChiefRemarks = remarks || "Returned for revisions by Division Chief.";
    sub.status = "Returned";

    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: `notif-${Date.now()}`,
      title: "Liquidation Submission Returned by Division Chief",
      message: `Your liquidation report ${sub.submissionNo} was returned for adjustments by Division Chief: ${remarks}`,
      isRead: false,
      type: "warning",
      timestamp: new Date().toISOString(),
      targetRole: UserRole.EMPLOYEE,
      targetEmployeeId: sub.employeeId
    });
  } else {
    sub.divisionChiefStatus = "Rejected";
    sub.divisionChiefRemarks = remarks || "Disapproved by Division Chief.";
    sub.status = "Rejected";

    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: `notif-${Date.now()}`,
      title: "Liquidation Submission REJECTED",
      message: `Your liquidation report ${sub.submissionNo} was Rejected by Division Chief: ${remarks}`,
      isRead: false,
      type: "urgent",
      timestamp: new Date().toISOString(),
      targetRole: UserRole.EMPLOYEE,
      targetEmployeeId: sub.employeeId
    });
  }

  logEvent(req.user.id, req.user.username, req.user.role, "Chief Final Liquidation Seal", `Chief evaluated liquidation ${sub.submissionNo} with action ${action}`);
  saveDB();
  res.json({ status: "success", data: sub });
});


// Handle serving the Vite client in development and compiled files in production
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Fallback index.html route for SPA
    app.get("*", (req, res, next) => {
      const idxPath = path.join(process.cwd(), "index.html");
      const html = fs.readFileSync(idxPath, "utf8");
      vite.transformIndexHtml(req.url, html).then((transformedHtml) => {
        res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
      }).catch(next);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[IPFMS Server Host] Live operational portal initialized on core PORT ${PORT}`);
});
