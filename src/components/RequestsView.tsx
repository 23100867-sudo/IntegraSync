import React, { useState, useEffect } from "react";
import { User, UserRole, RequestType, RequestStatus, AnyRequest, SupplyItem } from "../types";
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Calendar, 
  Car, 
  Video, 
  Package, 
  UserCheck, 
  ArrowRight,
  ClipboardList,
  AlertCircle,
  FileCheck2,
  X
} from "lucide-react";
import { apiCall, formatDate, getRequestTypeColor } from "../utils";

interface RequestsViewProps {
  user: User;
  requests: AnyRequest[];
  supplies: SupplyItem[];
  fetchSummary: () => void;
  onRefresh: () => void;
}

export default function RequestsView({ user, requests, supplies, fetchSummary, onRefresh }: RequestsViewProps) {
  const [reqList, setReqList] = useState<AnyRequest[]>(requests);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeRequestType, setActiveRequestType] = useState<RequestType>(RequestType.LEAVE);
  
  // Selected review item
  const [selectedReviewReq, setSelectedReviewReq] = useState<AnyRequest | null>(null);

  // Liquidation verification queue states
  const [liqSubmissions, setLiqSubmissions] = useState<any[]>([]);
  const [liqRemarks, setLiqRemarks] = useState("");
  const [selectedLiqSub, setSelectedLiqSub] = useState<any>(null);

  useEffect(() => {
    if (user.role === UserRole.HR_OFFICER) {
      fetchLiquidationSubmissions();
    }
  }, [user.role, requests]);

  async function fetchLiquidationSubmissions() {
    try {
      const res = await apiCall("/api/liquidation-submissions");
      if (res.status === "success") {
        // filter for those pending HR action or general ones to view status
        setLiqSubmissions(res.data);
      }
    } catch (err) {
      console.error("Error loading liquidation submissions for HR check", err);
    }
  }

  async function handleHRLiquidationAction(submissionId: string, action: "Verify" | "Return", comments: string) {
    if (action === "Return" && !comments) {
      alert("Specify remarks/reasons for returning this submission.");
      return;
    }
    try {
      const res = await apiCall(`/api/liquidation-submissions/${submissionId}/hr-action`, {
        method: "PUT",
        body: JSON.stringify({ action, remarks: comments || "Verified & forwarded by HR" })
      });
      if (res.status === "success") {
        alert(action === "Verify" ? "Liquidation report verified and forwarded to Financial validation queue!" : "Liquidation report returned to employee.");
        fetchLiquidationSubmissions();
        setSelectedLiqSub(null);
        setLiqRemarks("");
        onRefresh();
      }
    } catch (err: any) {
      alert(err.message || "Action on liquidation failed.");
    }
  }

  // Leave Form Fields
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Sick Leave" as any,
    startDate: "",
    endDate: "",
    reason: ""
  });

  // Service Record Fields
  const [serviceForm, setServiceForm] = useState({
    purpose: "",
    copies: 1
  });

  // Vehicle Fields
  const [vehicleForm, setVehicleForm] = useState({
    destination: "",
    purpose: "",
    dateNeeded: "",
    passengers: ""
  });

  // Zoom Fields
  const [zoomForm, setZoomForm] = useState({
    meetingTitle: "",
    meetingDate: "",
    startTime: "",
    endTime: "",
    alternativeHost: ""
  });

  // Supply Fields
  const [supplyForm, setSupplyForm] = useState({
    supplyId: "",
    quantity: 1,
    purpose: ""
  });

  // Approval Form
  const [approvalParams, setApprovalParams] = useState({
    remarks: ""
  });

  useEffect(() => {
    setReqList(requests);
  }, [requests]);

  // Handle request submission
  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    
    let payload: any = {
      requestType: activeRequestType
    };

    switch (activeRequestType) {
      case RequestType.LEAVE:
        payload = { ...payload, ...leaveForm };
        break;
      case RequestType.SERVICE_RECORD:
        payload = { ...payload, ...serviceForm };
        break;
      case RequestType.VEHICLE:
        payload = { ...payload, ...vehicleForm };
        break;
      case RequestType.ZOOM:
        payload = { ...payload, ...zoomForm };
        break;
      case RequestType.SUPPLY:
        // Get supply name
        const match = supplies.find(s => s.id === supplyForm.supplyId);
        payload = { 
          ...payload, 
          supplyId: supplyForm.supplyId,
          supplyName: match ? match.name : "Office supplies",
          quantity: Number(supplyForm.quantity),
          purpose: supplyForm.purpose
        };
        break;
    }

    try {
      const res = await apiCall("/api/requests", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (res.status === "success") {
        alert("Digital service request filed successfully! Forwarded to the approval pool.");
        setIsSubmitModalOpen(false);
        onRefresh();
        fetchSummary();
        // Reset forms
        setLeaveForm({ leaveType: "Sick Leave", startDate: "", endDate: "", reason: "" });
        setServiceForm({ purpose: "", copies: 1 });
        setVehicleForm({ destination: "", purpose: "", dateNeeded: "", passengers: "" });
        setZoomForm({ meetingTitle: "", meetingDate: "", startTime: "", endTime: "", alternativeHost: "" });
        setSupplyForm({ supplyId: "", quantity: 1, purpose: "" });
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  }

  // Act on HR Endorsement or Return
  async function handleHREndorse(targetId: string, endorse: boolean) {
    if (!endorse && !approvalParams.remarks) {
      alert("Please provide comments/remarks specifying why the request is being returned.");
      return;
    }
    try {
      const res = await apiCall(`/api/requests/${targetId}/hr-endorse`, {
        method: "PUT",
        body: JSON.stringify({
          endorse,
          remarks: approvalParams.remarks || `Endorsed under HR standards by ${user.fullName}.`
        })
      });
      if (res.status === "success") {
        alert(endorse ? "Personnel request has been HR-Endorsed to the Division Chief!" : "Personnel request has been returned to the employee with remarks.");
        setSelectedReviewReq(null);
        setApprovalParams({ remarks: "" });
        onRefresh();
        fetchSummary();
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Determine if a user has approval authority over an active request
  function canUserApprove(req: AnyRequest): boolean {
    const role = user.role;
    // HR is the only one who can endorse to chief
    return role === UserRole.HR_OFFICER && req.status === RequestStatus.PENDING;
  }

  // Classify request lists based on perspective
  const userRequests = reqList.filter(r => r.employeeId === user.employeeId);
  const approvalPool = reqList.filter(r => r.status === RequestStatus.PENDING && canUserApprove(r));
  const otherHistoricalRows = reqList.filter(r => r.employeeId !== user.employeeId);

  return (
    <div id="requests-view-container" className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-md font-bold text-slate-800">Request & Workflow Adjudication</h1>
          <p className="text-[11px] text-slate-500">File leaves, vehicle dispatching, Zoom bookings, and stock items requests.</p>
        </div>
        <button
          id="btn-file-request"
          onClick={() => setIsSubmitModalOpen(true)}
          className="bg-slate-900 border border-slate-850 text-white hover:bg-slate-800 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center shadow"
        >
          <Plus size={14} className="mr-1.5" />
          <span>Post New Request Form</span>
        </button>
      </div>

      {/* PENDING APPROVALS BOARD (IF ACCOUNT ROLE HAS PRIVILEGES) */}
      {user.role !== UserRole.EMPLOYEE && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold font-sans text-slate-800 uppercase tracking-tight flex items-center">
            <ClipboardList size={15} className="mr-2 text-amber-500 animate-pulse" />
            Active Regional Approvals Desk ({approvalPool.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvalPool.length > 0 ? (
              approvalPool.map((req) => (
                <div 
                  key={req.id} 
                  onClick={() => { setSelectedReviewReq(req); setApprovalParams({ remarks: "" }); }}
                  className={`p-4 border border-slate-150 rounded-xl hover:shadow-md cursor-pointer transition-all flex flex-col justify-between ${
                    selectedReviewReq?.id === req.id ? "bg-slate-50 border-amber-400 font-medium" : "bg-white"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getRequestTypeColor(req.requestType)}`}>
                        {req.requestType}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">{formatDate(req.dateRequested)}</span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800">{req.employeeName}</p>
                      
                      {/* DYNAMIC SHORT SPECS */}
                      {req.requestType === RequestType.LEAVE && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Leave type: {(req as any).leaveType} • {(req as any).startDate} to {(req as any).endDate}
                        </p>
                      )}
                      {req.requestType === RequestType.SERVICE_RECORD && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Copies: {(req as any).copies} • Purpose: {(req as any).purpose}
                        </p>
                      )}
                      {req.requestType === RequestType.VEHICLE && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Destination: {(req as any).destination} • Needed: {(req as any).dateNeeded}
                        </p>
                      )}
                      {req.requestType === RequestType.ZOOM && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Title: {(req as any).meetingTitle} • Date: {(req as any).meetingDate}
                        </p>
                      )}
                      {req.requestType === RequestType.SUPPLY && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Supply: {(req as any).supplyName} • Qty: {(req as any).quantity}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-[10px] text-slate-400 flex items-center justify-end font-semibold">
                    <span>Examine Approval</span>
                    <ArrowRight size={10} className="ml-1" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 font-mono text-[10px] md:col-span-2 py-6 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                Excellent. Your active approvals desk is cleared!
              </p>
            )}
          </div>
        </section>
      )}

      {/* HR LIQUIDATION VERIFICATION QUEUE (FOR HR OFFICER ONLY) */}
      {user.role === UserRole.HR_OFFICER && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold font-sans text-slate-800 uppercase tracking-tight flex items-center">
            <ClipboardList size={15} className="mr-2 text-blue-500 animate-pulse" />
            HR Liquidation Verification Queue ({liqSubmissions.filter(s => s.status === "Pending HR Review").length})
          </h2>
          <p className="text-[11px] text-slate-500">Verify requested employee travel expenditures and activities relationship before forwarding to Finance validation.</p>

          <div className="grid grid-cols-1 gap-4">
            {liqSubmissions.filter(s => s.status === "Pending HR Review").length > 0 ? (
              liqSubmissions.filter(s => s.status === "Pending HR Review").map((sub) => (
                <div key={sub.id} className="p-4 border border-blue-100 rounded-xl bg-blue-50/10 hover:border-blue-200 transition-all flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                        {sub.submissionNo}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{sub.createdAt?.split("T")[0]}</span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-800">{sub.employeeName}</h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        <strong>Assigned Activity Reference:</strong> {sub.activityId}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-md">
                      <div className="bg-white p-2 rounded border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block font-mono">Released Advanced</span>
                        <strong className="text-xs text-slate-700">₱{sub.totalReleased.toLocaleString()}</strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block font-mono">Liquidated Spent</span>
                        <strong className="text-xs text-slate-700">₱{sub.totalSpent.toLocaleString()}</strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block font-mono">Remaining Balance</span>
                        <strong className="text-xs text-slate-700">₱{sub.remainingBalance.toLocaleString()}</strong>
                      </div>
                    </div>

                    {sub.remarks && (
                      <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-50 font-sans">
                        "{sub.remarks}"
                      </p>
                    )}
                    
                    {sub.supportingDocs && sub.supportingDocs.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block font-mono">Receipts / Invoices</span>
                        <div className="flex flex-wrap gap-1.5">
                          {sub.supportingDocs.map((doc: any, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">
                              {doc.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACTION CORNER */}
                  <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">Verification Remarks</label>
                      <textarea
                        placeholder="Add remarks for verification check..."
                        value={selectedLiqSub?.id === sub.id ? liqRemarks : ""}
                        onChange={(e) => {
                          setSelectedLiqSub(sub);
                          setLiqRemarks(e.target.value);
                        }}
                        className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs h-16 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-3">
                      <button
                        type="button"
                        onClick={() => handleHRLiquidationAction(sub.id, "Return", selectedLiqSub?.id === sub.id ? liqRemarks : "")}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Return
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHRLiquidationAction(sub.id, "Verify", selectedLiqSub?.id === sub.id ? liqRemarks : "")}
                        className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold shadow shadow-blue-600/10 cursor-pointer"
                      >
                        Verify & Forward
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 font-mono text-[10px] py-6 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                No liquidation reports awaiting HR verification.
              </p>
            )}
          </div>
        </section>
      )}

      {/* DETAILED ADJUDICATION WORKSPACE DRAWER FOR MANAGER ACTION */}
      {selectedReviewReq && (
        <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 shadow-inner space-y-4">
          <div className="flex justify-between items-center border-b border-amber-200/60 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center">
              <UserCheck size={14} className="mr-1.5" />
              Adjudicate Service filing of [ {selectedReviewReq.employeeName} ]
            </h3>
            <button onClick={() => setSelectedReviewReq(null)} className="text-amber-800 hover:text-amber-950 p-1">
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] leading-relaxed">
            <div className="space-y-2">
              <p className="text-slate-500 font-semibold">Filer: <strong className="text-slate-800 font-bold">{selectedReviewReq.employeeName} ({selectedReviewReq.employeeId})</strong></p>
              <p className="text-slate-500">Request Type: <span className="font-semibold">{selectedReviewReq.requestType}</span></p>
              
              <div className="bg-white border rounded p-3 text-slate-600 space-y-1 mt-1 font-sans">
                {selectedReviewReq.requestType === RequestType.LEAVE && (
                  <>
                    <p><strong>Leave:</strong> {(selectedReviewReq as any).leaveType}</p>
                    <p><strong>Start Date:</strong> {(selectedReviewReq as any).startDate}</p>
                    <p><strong>End Date:</strong> {(selectedReviewReq as any).endDate}</p>
                    <p><strong>Reason stated:</strong> &ldquo;{(selectedReviewReq as any).reason}&rdquo;</p>
                  </>
                )}
                {selectedReviewReq.requestType === RequestType.SERVICE_RECORD && (
                  <>
                    <p><strong>Purpose of document:</strong> {(selectedReviewReq as any).purpose}</p>
                    <p><strong>Requested Copies:</strong> {(selectedReviewReq as any).copies}</p>
                  </>
                )}
                {selectedReviewReq.requestType === RequestType.VEHICLE && (
                  <>
                    <p><strong>Destination path:</strong> {(selectedReviewReq as any).destination}</p>
                    <p><strong>Operational Purpose:</strong> &ldquo;{(selectedReviewReq as any).purpose}&rdquo;</p>
                    <p><strong>Dispatch date:</strong> {(selectedReviewReq as any).dateNeeded}</p>
                    <p><strong>Personnel Passengers:</strong> {(selectedReviewReq as any).passengers}</p>
                  </>
                )}
                {selectedReviewReq.requestType === RequestType.ZOOM && (
                  <>
                    <p><strong>Conference Title:</strong> {(selectedReviewReq as any).meetingTitle}</p>
                    <p><strong>Reserved Date:</strong> {(selectedReviewReq as any).meetingDate}</p>
                    <p><strong>Time block:</strong> {(selectedReviewReq as any).startTime} - {(selectedReviewReq as any).endTime}</p>
                    <p><strong>IT Alternative Host:</strong> {(selectedReviewReq as any).alternativeHost || "N/A"}</p>
                  </>
                )}
                {selectedReviewReq.requestType === RequestType.SUPPLY && (
                  <>
                    <p><strong>Storage Item:</strong> {(selectedReviewReq as any).supplyName}</p>
                    <p><strong>Material Quantity:</strong> {(selectedReviewReq as any).quantity}</p>
                    <p><strong>Description of purpose:</strong> &ldquo;{(selectedReviewReq as any).purpose}&rdquo;</p>
                  </>
                )}
              </div>
            </div>

            {/* ACTION TRIGGERS */}
            <div className="flex flex-col justify-between">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Office Action Remarks / Comments *</label>
                <textarea
                  required
                  placeholder="Explain endorsement parameters or grounds for returning the request."
                  value={approvalParams.remarks}
                  onChange={(e) => setApprovalParams({ remarks: e.target.value })}
                  className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs h-20"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => handleHREndorse(selectedReviewReq.id, false)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Return to Employee
                </button>
                <button
                  type="button"
                  onClick={() => handleHREndorse(selectedReviewReq.id, true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-850 px-5 py-2 rounded-lg text-xs font-semibold shadow"
                >
                  Endorse to Chief
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE FILINGS LISTINGS BOARD */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold font-sans text-slate-800 uppercase tracking-tight flex items-center justify-between pb-3 border-b">
          <span className="flex items-center">
            <Clock size={15} className="mr-2 text-slate-500" />
            Leaves & Request Filing Pipelines
          </span>
          <span className="text-[10px] font-mono text-slate-400">Total in system ({reqList.length})</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] select-none">
                <th className="pb-2">Date Submitted</th>
                <th className="pb-2">Filer / Employee</th>
                <th className="pb-2">Request Type</th>
                <th className="pb-2">Core Content Details</th>
                <th className="pb-2 text-center">Status</th>
                <th className="pb-2 text-right">Signed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reqList.length > 0 ? (
                reqList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono text-slate-500">{formatDate(r.dateRequested)}</td>
                    <td className="py-3 font-semibold text-slate-900">{r.employeeName}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getRequestTypeColor(r.requestType)}`}>
                        {r.requestType}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 max-w-[200px] line-clamp-1 truncate" title={r.remarks}>
                      {r.requestType === RequestType.LEAVE && `Leave Period: ${(r as any).leaveType} [${(r as any).startDate} to ${(r as any).endDate}]`}
                      {r.requestType === RequestType.SERVICE_RECORD && `Service record purpose: ${(r as any).purpose}`}
                      {r.requestType === RequestType.VEHICLE && `Journey to: ${(r as any).destination}`}
                      {r.requestType === RequestType.ZOOM && `Conference: ${(r as any).meetingTitle}`}
                      {r.requestType === RequestType.SUPPLY && `Supply items: ${(r as any).supplyName} x ${(r as any).quantity}`}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase border ${
                        r.status === RequestStatus.APPROVED 
                          ? "bg-emerald-50 text-emerald-800 border-emerald-250 font-bold" 
                          : r.status === RequestStatus.REJECTED 
                          ? "bg-rose-50 text-rose-800 border-rose-250 font-bold" 
                          : "bg-slate-50 text-slate-600 border-slate-200 animate-pulse"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-600 font-medium">
                      {r.approvedBy ? (
                        <span className="flex items-center justify-end gap-1 font-semibold text-slate-800">
                          <FileCheck2 size={11} className="text-emerald-500" />
                          <span>{r.approvedBy}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Awaiting adjudication</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-mono">
                    All digital office request pipelines empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* DIGITIER FORM SUBMIT MODULE MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider">File Joint Office Request Form</h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            
            {/* TYPE SWITCHER */}
            <div className="bg-slate-100 p-2.5 flex overflow-x-auto gap-1 border-b border-slate-200 shrink-0">
              {[
                { id: RequestType.LEAVE, icon: Calendar, label: "Leave" },
                { id: RequestType.SERVICE_RECORD, icon: ClipboardList, label: "Service Rec" },
                { id: RequestType.VEHICLE, icon: Car, label: "Vehicle" },
                { id: RequestType.ZOOM, icon: Video, label: "Zoom Box" },
                { id: RequestType.SUPPLY, icon: Package, label: "Supplies" }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setActiveRequestType(type.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase shrink-0 transition-all ${
                    activeRequestType === type.id 
                      ? "bg-slate-950 text-white" 
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitRequest} className="p-5 overflow-y-auto space-y-4">
              
              {/* LEFT PERSPECTIVE DISCLOSURE */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded leading-relaxed border border-slate-150">
                Filing as: <strong className="text-slate-700">{user.fullName} ({user.employeeId})</strong>
              </div>

              {/* DYNAMIC FORMS ACCORDING TO TYPE */}
              {activeRequestType === RequestType.LEAVE && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Select Leave Type *</label>
                    <select
                      value={leaveForm.leaveType}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                    >
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Vacation Leave">Vacation Leave</option>
                      <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
                      <option value="Emergency Leave">Emergency Leave</option>
                      <option value="Special Privilege">Special Privilege Leave</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Start Date *</label>
                      <input
                        required
                        type="date"
                        value={leaveForm.startDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                        className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">End Date *</label>
                      <input
                        required
                        type="date"
                        value={leaveForm.endDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                        className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Formulated Reasons & Context *</label>
                    <textarea
                      required
                      placeholder="Convey personal grounds for file leave..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs h-20"
                    />
                  </div>
                </div>
              )}

              {activeRequestType === RequestType.SERVICE_RECORD && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Purpose of Service Record copies *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. GSIS Loan Application / Promotion Requirement"
                      value={serviceForm.purpose}
                      onChange={(e) => setServiceForm({ ...serviceForm, purpose: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Requested Copies Count *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={serviceForm.copies}
                      onChange={(e) => setServiceForm({ ...serviceForm, copies: Number(e.target.value) })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {activeRequestType === RequestType.VEHICLE && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Travel Target Destination *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Vigan, Ilocos Sur - Case Dispute Settlement"
                      value={vehicleForm.destination}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, destination: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Travel Date *</label>
                      <input
                        required
                        type="date"
                        value={vehicleForm.dateNeeded}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, dateNeeded: e.target.value })}
                        className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Commissions Passengers *</label>
                      <input
                        required
                        type="text"
                        placeholder="Dr. Rizal, Andres Bonifacio"
                        value={vehicleForm.passengers}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, passengers: e.target.value })}
                        className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Travel Purpose *</label>
                    <textarea
                      required
                      placeholder="Detail of dispute hearings or surveys..."
                      value={vehicleForm.purpose}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, purpose: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs h-16"
                    />
                  </div>
                </div>
              )}

              {activeRequestType === RequestType.ZOOM && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Hearing / Meeting Title *</label>
                    <input
                      required
                      type="text"
                      placeholder="RAB 1 En Banc Case Reconciliation"
                      value={zoomForm.meetingTitle}
                      onChange={(e) => setZoomForm({ ...zoomForm, meetingTitle: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Meeting Date *</label>
                      <input
                        required
                        type="date"
                        value={zoomForm.meetingDate}
                        onChange={(e) => setZoomForm({ ...zoomForm, meetingDate: e.target.value })}
                        className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-[11px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Start Time *</label>
                      <input
                        required
                        type="text"
                        placeholder="09:00 AM"
                        value={zoomForm.startTime}
                        onChange={(e) => setZoomForm({ ...zoomForm, startTime: e.target.value })}
                        className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-[11px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">End Time *</label>
                      <input
                        required
                        type="text"
                        placeholder="12:00 PM"
                        value={zoomForm.endTime}
                        onChange={(e) => setZoomForm({ ...zoomForm, endTime: e.target.value })}
                        className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Alternative Co-Host Email</label>
                    <input
                      type="email"
                      placeholder="colleague@hsac.gov.ph"
                      value={zoomForm.alternativeHost}
                      onChange={(e) => setZoomForm({ ...zoomForm, alternativeHost: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {activeRequestType === RequestType.SUPPLY && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Select Stockroom Material *</label>
                    <select
                      required
                      value={supplyForm.supplyId}
                      onChange={(e) => setSupplyForm({ ...supplyForm, supplyId: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                    >
                      <option value="">-- Select Material --</option>
                      {supplies.map(sup => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name} ({sup.availableQuantity} {sup.unit} available)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Filing Quantity *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={supplyForm.quantity}
                      onChange={(e) => setSupplyForm({ ...supplyForm, quantity: Number(e.target.value) })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Usage Purpose Description *</label>
                    <textarea
                      required
                      placeholder="Provide simple reasons..."
                      value={supplyForm.purpose}
                      onChange={(e) => setSupplyForm({ ...supplyForm, purpose: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs h-16"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 border border-slate-850 text-white hover:bg-slate-850 font-semibold px-5 py-2 rounded-lg text-xs shadow-md"
                >
                  Submit Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
