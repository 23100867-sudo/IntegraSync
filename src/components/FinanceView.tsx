import React, { useState, useEffect } from "react";
import { FinancialTransaction, User, UserRole, TransactionStatus, SupportingDocument } from "../types";
import { 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileCheck,
  FileCode,
  DollarSign,
  Download,
  BookOpen,
  ArrowRight,
  PlusCircle,
  X,
  History,
  Tag
} from "lucide-react";
import { apiCall, formatCurrency, formatDate } from "../utils";

interface FinanceViewProps {
  user: User;
  transactions: FinancialTransaction[];
  fetchSummary: () => void;
  onRefresh: () => void;
}

export default function FinanceView({ user, transactions, fetchSummary, onRefresh }: FinanceViewProps) {
  const [txnList, setTxnList] = useState<FinancialTransaction[]>(transactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All"); // filter tab by TransactionStatus or "All"
  
  // Selected detail card
  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(null);
  
  // Forms modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Forms values
  const [txFormData, setTxFormData] = useState({
    supplier: "",
    amount: "",
    transactionDate: "",
    description: "",
    receiptFilename: "",
  });

  const [docFormData, setDocFormData] = useState({
    name: "",
    type: "Invoice" as any,
    filename: ""
  });

  const [auditFormData, setAuditFormData] = useState({
    status: TransactionStatus.UNDER_REVIEW as any,
    remarks: ""
  });

  const isFinanceOrAdmin = [UserRole.SUPER_ADMIN, UserRole.FINANCE_OFFICER].includes(user.role);

  useEffect(() => {
    setTxnList(transactions);
    if (selectedTx) {
      const updated = transactions.find(t => t.id === selectedTx.id);
      if (updated) setSelectedTx(updated);
    }
  }, [transactions]);

  // Submit expense record
  async function handleCreateTx(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiCall("/api/financial-transactions", {
        method: "POST",
        body: JSON.stringify(txFormData)
      });
      if (res.status === "success") {
        alert("Expenditure item logged successfully! Pending validation.");
        setIsTxModalOpen(false);
        onRefresh();
        fetchSummary();
        // Reset
        setTxFormData({
          supplier: "",
          amount: "",
          transactionDate: "",
          description: "",
          receiptFilename: "",
        });
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Attach digital supporting doc
  async function handleAddDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTx) return;
    try {
      const res = await apiCall(`/api/financial-transactions/${selectedTx.id}/documents`, {
        method: "POST",
        body: JSON.stringify(docFormData)
      });
      if (res.status === "success") {
        alert("Supporting document attached successfully!");
        setIsDocModalOpen(false);
        onRefresh();
        // Reset
        setDocFormData({
          name: "",
          type: "Invoice",
          filename: ""
        });
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Evaluate workflow progression
  async function handleAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTx) return;
    try {
      const res = await apiCall(`/api/financial-transactions/${selectedTx.id}/status`, {
        method: "PUT",
        body: JSON.stringify(auditFormData)
      });
      if (res.status === "success") {
        alert("Voucher validation status updated successfully!");
        setIsAuditModalOpen(false);
        onRefresh();
        fetchSummary();
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Live filter matching
  const filteredTxns = txnList.filter((tx) => {
    const matchesSearch = 
      tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "All" ? true : tx.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const workflowSteps = [
    TransactionStatus.PENDING_VALIDATION,
    TransactionStatus.UNDER_REVIEW,
    TransactionStatus.VALIDATED,
    TransactionStatus.LIQUIDATED,
    TransactionStatus.ARCHIVED
  ];

  return (
    <div id="finance-view-container" className="flex-1 flex overflow-hidden bg-slate-50">
      
      {/* LEFT SECTION: TRANSACTIONS LIST */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-md font-bold text-slate-800">Financial Document & Receipt Registry</h1>
            <p className="text-[11px] text-slate-500">Track and liquidate regional transaction vouchers, receipts, and invoices.</p>
          </div>
          {isFinanceOrAdmin && (
            <button
              id="btn-register-expense"
              onClick={() => setIsTxModalOpen(true)}
              className="bg-slate-900 border border-slate-850 text-white hover:bg-slate-800 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center shadow"
            >
              <Plus size={14} className="mr-1.5" />
              <span>Record Expense / Receipt</span>
            </button>
          )}
        </div>

        {/* STATUS TABS SELECTORS */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto shrink-0 bg-white p-1 rounded-lg">
          {["All", ...workflowSteps].map((tab) => {
            const isActive = activeTab === tab;
            const count = tab === "All" 
              ? txnList.length 
              : txnList.filter(t => t.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all shrink-0 ${
                  isActive 
                    ? "bg-slate-900 text-white" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <span>{tab}</span>
                <span className={`ml-1.5 px-1 rounded text-[9px] font-semibold ${isActive ? "bg-amber-400 text-slate-900" : "bg-slate-150 text-slate-600"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions by Supplier, ID, description details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-sm"
          />
        </div>

        {/* DATA GRID */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px] select-none">
                  <th className="p-4 w-28">ID</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Transaction Date</th>
                  <th className="p-4 text-right">Amount (PHP)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Docs Attached</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxns.length > 0 ? (
                  filteredTxns.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => {
                        setSelectedTx(tx);
                        setAuditFormData({ status: tx.status as any, remarks: "" });
                      }}
                      className={`cursor-pointer transition-colors ${
                        selectedTx?.id === tx.id ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="p-4 font-mono font-semibold text-slate-700">{tx.transactionId}</td>
                      <td className="p-4 font-medium text-slate-900 line-clamp-1 max-w-[150px]">{tx.supplier}</td>
                      <td className="p-4 text-slate-500">{formatDate(tx.transactionDate)}</td>
                      <td className="p-4 text-right font-mono text-slate-700 font-bold">{formatCurrency(tx.amount)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                          tx.status === TransactionStatus.LIQUIDATED 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                            : tx.status === TransactionStatus.VALIDATED
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : tx.status === TransactionStatus.PENDING_VALIDATION
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-500 font-mono">
                        {tx.supportingDocuments?.length || 0} files
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-mono">
                      No matching financial transaction papers in this stack index.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: EXHAUSTIVE EXPENSE DETAIL PANEL */}
      {selectedTx && (
        <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto flex flex-col shrink-0">
          <div className="p-4 bg-slate-100 text-slate-800 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center space-x-2">
              <FileCode size={16} className="text-amber-605" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Voucher Inspector</h3>
            </div>
            <button onClick={() => setSelectedTx(null)} className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-6">
            
            {/* CORE TOTAL DETAILS BLOCK */}
            <div className="border-b border-slate-100 pb-5">
              <span className="text-[10px] font-mono font-bold text-slate-400">Transaction Registry ID:</span>
              <h2 className="text-sm font-bold font-mono text-slate-800">{selectedTx.transactionId}</h2>
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-center shadow-inner font-mono font-bold text-lg">
                {formatCurrency(selectedTx.amount)}
              </div>
              <p className="text-[11px] text-slate-600 mt-2 font-medium">Supplier: <em className="text-slate-800 font-semibold">{selectedTx.supplier}</em></p>
              <p className="text-[11px] text-slate-400 mt-0.5">Disbursed: {formatDate(selectedTx.transactionDate)}</p>
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">Scope Description</span>
              <p className="text-[11px] leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {selectedTx.description}
              </p>
            </div>

            {/* PROGRESS STATUS WORKFLOW COMPASS */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-0.5">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Status Progression</span>
                <span className="text-[10px] font-bold text-slate-700">{selectedTx.status}</span>
              </div>
              
              {/* STAGES */}
              <div className="space-y-2 mt-2">
                {workflowSteps.map((step, idx) => {
                  const stepIndex = workflowSteps.indexOf(selectedTx.status);
                  const isCompleted = workflowSteps.indexOf(step) <= stepIndex;
                  const isActive = step === selectedTx.status;

                  return (
                    <div key={idx} className="flex items-center space-x-2.5 text-[11px]">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[9px] font-mono ${
                        isCompleted 
                          ? "bg-emerald-500 text-white" 
                          : "bg-slate-100 text-slate-400 outline outline-1 outline-slate-200"
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`font-semibold ${isActive ? "text-slate-800" : isCompleted ? "text-slate-500" : "text-slate-400"}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CORE DOCUMENTS ATTAGENTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Liquidating Attachments</span>
                {isFinanceOrAdmin && (
                  <button 
                    onClick={() => setIsDocModalOpen(true)}
                    className="text-[10px] text-amber-600 hover:underline font-semibold flex items-center"
                  >
                    <PlusCircle size={11} className="mr-0.5" />
                    <span>Attach Doc</span>
                  </button>
                )}
              </div>
              
              {/* PRIMARY RECEIPT IF ANY */}
              {selectedTx.receiptFilename && (
                <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-[11px] border border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <Tag size={13} className="text-amber-500" />
                    <span className="font-semibold text-slate-700">Official Receipt (Primary)</span>
                  </div>
                  <button 
                    onClick={() => alert(`Retrieving scanned proof ${selectedTx.receiptFilename} from filesystem.`)}
                    className="text-[10px] text-slate-500 hover:underline"
                  >
                    {selectedTx.receiptFilename}
                  </button>
                </div>
              )}

              {/* SECONDARY DOCS */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedTx.supportingDocuments && selectedTx.supportingDocuments.length > 0 ? (
                  selectedTx.supportingDocuments.map((doc: SupportingDocument) => (
                    <div key={doc.id} className="p-2 border border-slate-100 rounded-lg text-[11px] leading-relaxed flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1">{doc.name}</p>
                        <p className="text-[9px] text-slate-400">{doc.type} • {formatDate(doc.uploadedAt)}</p>
                      </div>
                      <button 
                        onClick={() => alert(`Downloading voucher document: ${doc.filename}`)}
                        className="text-slate-500 hover:text-slate-800 p-1 rounded"
                        title="Download Asset"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 italic py-2">No additional invoices or vouchers compiled.</p>
                )}
              </div>
            </div>

            {/* AUDIT WORKFLOW LOG CHRONICLE */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block border-b pb-0.5">Evaluation Timeline Logs</span>
              <div className="space-y-2.5 max-h-36 overflow-y-auto">
                {selectedTx.history && selectedTx.history.length > 0 ? (
                  selectedTx.history.map((hist) => (
                    <div key={hist.id} className="text-[10px] bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">
                      <div className="flex justify-between items-center text-slate-500 font-mono">
                        <span className="font-bold">{hist.status}</span>
                        <span>{formatDate(hist.changedAt)}</span>
                      </div>
                      <p className="text-slate-600 mt-1">Remarks: <em>{hist.remarks}</em></p>
                      <p className="text-[9px] text-slate-400 text-right mt-0.5">By: {hist.changedBy}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 italic">No evaluation log registered.</p>
                )}
              </div>
            </div>

            {/* AUDIT STATUS ADJUDICATOR BOX (FINANCE ONLY) */}
            {isFinanceOrAdmin && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="w-full bg-slate-900 border border-slate-850 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm"
                >
                  <History size={13} />
                  <span>Update Liquidation Status</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECORD NEW EXPENSE MODAL */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider">Log Expense Voucher</h3>
              <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTx} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Supplier Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Shell Gasoline Station"
                  value={txFormData.supplier}
                  onChange={(e) => setTxFormData({ ...txFormData, supplier: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Disbursed Amount (PHP) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="4500.00"
                    value={txFormData.amount}
                    onChange={(e) => setTxFormData({ ...txFormData, amount: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs font-mono font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Transaction Date *</label>
                  <input
                    required
                    type="date"
                    value={txFormData.transactionDate}
                    onChange={(e) => setTxFormData({ ...txFormData, transactionDate: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Receipt Slip Filename / Ref</label>
                <input
                  type="text"
                  placeholder="OfficialReceipt_9921.png"
                  value={txFormData.receiptFilename}
                  onChange={(e) => setTxFormData({ ...txFormData, receiptFilename: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Expense Purpose Description *</label>
                <textarea
                  required
                  placeholder="Purchase of fuel and toll gate slips for the San Fernando City to Alaminos regional mediation trip."
                  value={txFormData.description}
                  onChange={(e) => setTxFormData({ ...txFormData, description: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs h-20"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 border border-slate-850 text-white hover:bg-slate-800 font-semibold px-5 py-2 rounded-lg text-xs shadow-md"
                >
                  Submit Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BACKING ATTACHMENT MODAL */}
      {isDocModalOpen && selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider">Attach Support Document</h3>
              <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddDoc} className="p-5 space-y-4">
              <p className="text-[10px] text-slate-500 leading-normal bg-slate-50 p-2 rounded border border-slate-150">
                Adding secondary voucher files to ledger entry: <strong className="text-slate-700 font-mono">{selectedTx.transactionId}</strong>
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Document Label Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Scanned Invoice"
                  value={docFormData.name}
                  onChange={(e) => setDocFormData({ ...docFormData, name: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Voucher Classification *</label>
                <select
                  value={docFormData.type}
                  onChange={(e) => setDocFormData({ ...docFormData, type: e.target.value as any })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                >
                  <option value="Purchase Request">Purchase Request (PR)</option>
                  <option value="Invoice">Supplier Invoice (INV)</option>
                  <option value="Disbursement Voucher">Disbursement Voucher (DV)</option>
                  <option value="Liquidation Report">Liquidation Report (LR)</option>
                  <option value="Other">Other supporting files</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">File Asset Name</label>
                <input
                  type="text"
                  placeholder="DV_2026_9921_Scan.pdf"
                  value={docFormData.filename}
                  onChange={(e) => setDocFormData({ ...docFormData, filename: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 border border-slate-850 text-white hover:bg-slate-800 font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm"
                >
                  Attach Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVALUATION STATUS SHIFTER MODAL */}
      {isAuditModalOpen && selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider">Audit Evaluation Action</h3>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAudit} className="p-5 space-y-4">
              <p className="text-[11px] text-slate-500 leading-normal bg-amber-50 p-2 rounded border border-amber-200 font-medium">
                Adjusting status coordinates of validation voucher <span className="font-mono">{selectedTx.transactionId}</span>
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Select Workflow Stage *</label>
                <select
                  value={auditFormData.status}
                  onChange={(e) => setAuditFormData({ ...auditFormData, status: e.target.value as any })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                >
                  <option value={TransactionStatus.PENDING_VALIDATION}>Pending Validation</option>
                  <option value={TransactionStatus.UNDER_REVIEW}>Under Review</option>
                  <option value={TransactionStatus.VALIDATED}>Validated (Cleared for liquidation)</option>
                  <option value={TransactionStatus.LIQUIDATED}>Liquidated (Completed entries)</option>
                  <option value={TransactionStatus.ARCHIVED}>Archived</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Auditor Comments & Remarks *</label>
                <textarea
                  required
                  placeholder="Describe confirmation of attached slips, bank clearing numbers, or journal indexing coordinates."
                  value={auditFormData.remarks}
                  onChange={(e) => setAuditFormData({ ...auditFormData, remarks: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs h-20"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="bg-slate-150 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 border border-slate-850 text-white hover:bg-slate-800 font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm"
                >
                  Write Evaluation Remarks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
