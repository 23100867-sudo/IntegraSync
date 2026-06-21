import React, { useState, useEffect } from "react";
import { User, AnyRequest, RequestType, RequestStatus } from "../types";
import { apiCall } from "../utils";
import { 
  User as UserIcon, 
  Send, 
  Backpack, 
  FileText, 
  Upload, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Paperclip,
  Trash2,
  Bell
} from "lucide-react";

interface EmployeePortalViewProps {
  user: User;
  fetchSummary: () => void;
  onRefresh: () => void;
}

export default function EmployeePortalView({ user, fetchSummary, onRefresh }: EmployeePortalViewProps) {
  const [activeSubMenu, setActiveSubMenu] = useState<"profile" | "requests" | "activities" | "liquidations" | "notifications">("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // States
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<AnyRequest[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Request Form Fields
  const [reqType, setReqType] = useState<RequestType>(RequestType.LEAVE);
  const [leaveType, setLeaveType] = useState("Sick Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [zoomTitle, setZoomTitle] = useState("");
  const [copies, setCopies] = useState(1);
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState("");
  const [customRemarks, setCustomRemarks] = useState("");

  // Liquidation Upload Form
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [totalReleased, setTotalReleased] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [liqRemarks, setLiqRemarks] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; type: string; filename: string; uploadedAt: string }[]>([]);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("Receipt/Invoice");

  useEffect(() => {
    fetchPortalData();
  }, [activeSubMenu, onRefresh]);

  async function fetchPortalData() {
    setLoading(true);
    setError("");
    try {
      // 1. Load active Employee Profile
      const empRes = await apiCall("/api/employees");
      if (empRes.status === "success" && empRes.data) {
        const found = empRes.data.find((e: any) => e.employeeId === user.employeeId);
        setProfile(found || {
          employeeId: user.employeeId || "EMP006",
          fullName: user.fullName,
          position: "Technical Support Staff",
          division: "Administrative and Finance Division",
          employmentStatus: "Permanent",
          email: user.email,
          address: "San Fernando, La Union",
          dateHired: "2024-01-10",
          contactNumber: "0917-111-2233",
          emergencyContactName: "Lani Bonifacio",
          emergencyContactPhone: "0917-222-3344"
        });
      }

      // 2. Load requests
      const reqRes = await apiCall("/api/requests");
      if (reqRes.status === "success") {
        setRequests(reqRes.data);
      }

      // 3. Load activities assigned
      const actRes = await apiCall("/api/activities");
      if (actRes.status === "success") {
        setActivities(actRes.data);
        if (actRes.data.length > 0 && !selectedActivityId) {
          setSelectedActivityId(actRes.data[0].id);
          setTotalReleased(actRes.data[0].allottedBudget);
        }
      }

      // 4. Load submissions
      const subRes = await apiCall("/api/liquidation-submissions");
      if (subRes.status === "success") {
        setSubmissions(subRes.data);
      }

      // 5. Load notifications
      const notifRes = await apiCall("/api/notifications");
      if (notifRes.status === "success") {
        setNotifications(notifRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load employee portal dataset.");
    } finally {
      setLoading(false);
    }
  }

  // Handle personnel request submission
  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload: any = { requestType: reqType };
      if (reqType === RequestType.LEAVE) {
        payload.leaveType = leaveType;
        payload.startDate = startDate;
        payload.endDate = endDate;
        payload.reason = reason;
      } else if (reqType === RequestType.ZOOM) {
        payload.meetingTitle = zoomTitle;
        payload.meetingDate = startDate;
        payload.startTime = "09:00 AM";
        payload.endTime = "10:00 AM";
        payload.reason = reason;
      } else if (reqType === RequestType.SERVICE_RECORD) {
        payload.purpose = reason || "For official reference / records check";
        payload.copies = copies;
      } else if (reqType === RequestType.VEHICLE) {
        payload.destination = destination;
        payload.passengers = passengers || "Self";
        payload.dateNeeded = startDate;
        payload.purpose = reason;
      }

      const res = await apiCall("/api/requests", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (res.status === "success") {
        setSuccess("Personnel request successfully filed and routed to HR for validation.");
        setReason("");
        setZoomTitle("");
        setDestination("");
        setPassengers("");
        fetchPortalData();
        onRefresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
    }
  }

  // Handle Liquidation submission
  async function handleLiquidationSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedActivityId) {
      setError("Please choose a valid Assigned Activity reference.");
      return;
    }

    try {
      const res = await apiCall("/api/liquidation-submissions", {
        method: "POST",
        body: JSON.stringify({
          activityId: selectedActivityId,
          totalReleased,
          totalSpent,
          remarks: liqRemarks,
          supportingDocs: attachedFiles
        })
      });

      if (res.status === "success") {
        setSuccess("Liquidation report filed. Forwarded to HR relationship and activity verification desk.");
        setLiqRemarks("");
        setAttachedFiles([]);
        setTotalSpent(0);
        fetchPortalData();
        onRefresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit liquidation.");
    }
  }

  function handleAddMockDoc() {
    if (!newFileName) return;
    const doc = {
      id: `doc-${Date.now()}`,
      name: newFileName,
      type: newFileType,
      filename: `${newFileName.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      uploadedAt: new Date().toISOString()
    };
    setAttachedFiles(prev => [...prev, doc]);
    setNewFileName("");
  }

  function handleRemoveAttached(id: string) {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* SIDEBAR SUB-MENU CONTROL UNIT */}
      <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2 shrink-0">
        <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider px-2 mb-3">Personnel Desk</p>
        
        <button
          onClick={() => setActiveSubMenu("profile")}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all cursor-pointer ${
            activeSubMenu === "profile" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <UserIcon size={14} />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => setActiveSubMenu("requests")}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all {activeSubMenu === 'requests' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'} ${
            activeSubMenu === "requests" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Send size={14} />
          <span>Personnel Requests</span>
        </button>

        <button
          onClick={() => setActiveSubMenu("activities")}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
            activeSubMenu === "activities" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Backpack size={14} />
          <span>Assigned Activities</span>
        </button>

        <button
          onClick={() => setActiveSubMenu("liquidations")}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
            activeSubMenu === "liquidations" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText size={14} />
          <span>Liquidations Upload</span>
        </button>

        <button
          onClick={() => setActiveSubMenu("notifications")}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
            activeSubMenu === "notifications" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Bell size={14} />
          <span>Notifications & Alerts</span>
        </button>
      </div>

      {/* CORE FORM WORKSPACE DISPLAY */}
      <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative min-h-[460px]">
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border-l-2 border-rose-500 text-rose-700 text-xs font-mono rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border-l-2 border-emerald-500 text-emerald-700 text-xs font-sans rounded">
            {success}
          </div>
        )}

        {/* LOADING SHIM */}
        {loading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs text-slate-400 font-sans z-10">Syncing with Regional HQ files...</div>}

        {/* SUBMENU 1: MY PROFILE */}
        {activeSubMenu === "profile" && profile && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-base font-bold text-slate-800">My Personnel Profile</h1>
              <p className="text-xs text-slate-400">Review your authenticated employment credentials, division, and emergency contacts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="h-12 w-12 bg-slate-900 text-white text-base font-bold flex items-center justify-center rounded-full">
                    {profile.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-800">{profile.fullName}</h2>
                    <p className="text-[10px] text-slate-400 font-mono">Employee ID: {profile.employeeId}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-sans text-slate-600">
                  <p><strong>Division / Unit:</strong> {profile.division}</p>
                  <p><strong>Official Designation:</strong> {profile.position}</p>
                  <p><strong>Employment Status:</strong> {profile.employmentStatus}</p>
                  <p><strong>Date Hired:</strong> {profile.dateHired}</p>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 space-y-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">Contact & Safety Details</h3>
                <div className="space-y-2 text-xs text-slate-600">
                  <p><strong>Personal Email:</strong> {profile.email}</p>
                  <p><strong>Contact number:</strong> {profile.contactNumber}</p>
                  <p><strong>Emergency Contact Person:</strong> {profile.emergencyContactName}</p>
                  <p><strong>Emergency Contact Phone:</strong> {profile.emergencyContactPhone}</p>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px] text-slate-600">
                  <p className="font-semibold text-blue-700">Personal Data Sheet (PDS):</p>
                  <p className="text-slate-500 mt-1">✓ EMP006_Bonifacio_PDS_2026.pdf verified (RA 10173 compliant)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMENU 2: PERSONNEL REQUESTS */}
        {activeSubMenu === "requests" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-base font-bold text-slate-800">Personnel Requests Desk</h1>
              <p className="text-xs text-slate-400">File digitized travel requests, leave forms, Zoom requests, or supply allocation requests.</p>
            </div>

            {/* NEW REQUEST FORM */}
            <form onSubmit={handleRequestSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border border-slate-200 rounded-xl bg-slate-50/30">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Request Option</label>
                  <select
                    value={reqType}
                    onChange={e => setReqType(e.target.value as RequestType)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-semibold text-slate-700"
                  >
                    <option value={RequestType.LEAVE}>Leave Request</option>
                    <option value={RequestType.SERVICE_RECORD}>Service Record Request</option>
                    <option value={RequestType.VEHICLE}>Vehicle Request</option>
                    <option value={RequestType.ZOOM}>Zoom Access Request</option>
                  </select>
                </div>

                {reqType === RequestType.LEAVE && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Leave Category</label>
                    <select
                      value={leaveType}
                      onChange={e => setLeaveType(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700"
                    >
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Vacation Leave">Vacation Leave</option>
                      <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
                      <option value="Special Privilege">Special Privilege</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Date Needed / Scheduled</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono text-slate-700"
                  />
                </div>

                {reqType === RequestType.LEAVE && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">End Period</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono text-slate-700"
                    />
                  </div>
                )}

                {reqType === RequestType.VEHICLE && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Destination Office</label>
                    <input
                      type="text"
                      placeholder="e.g. Vigan, Ilocos Sur"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Purpose / Supporting details</label>
                  <textarea
                    required
                    placeholder="Specify target dates, reason or validation details..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs h-16"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm text-center"
                >
                  File Digitized Request
                </button>
              </div>
            </form>

            {/* PAST REQUESTS VIEW */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">My Filed Requests Ledger</h2>
              {requests.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No filed personnel requests found.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {requests.map((r: any) => (
                    <div key={r.id} className="p-3.5 border border-slate-100 rounded-lg flex items-center justify-between text-xs bg-slate-50/20">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-800">{r.requestType}</span>
                          <span className="text-[9px] text-slate-400 font-mono">Submitted: {r.dateRequested}</span>
                        </div>
                        <p className="text-slate-500 italic mt-0.5">"{r.reason || r.purpose || 'No purpose declared'}"</p>
                        
                        {/* REMARKS DISPLAY ZONE */}
                        {r.remarks && (
                          <div className="mt-1.5 bg-slate-100 p-2 rounded text-[10px] text-slate-600 border border-slate-200/50">
                            <strong>System Remarks:</strong> "{r.remarks}"
                          </div>
                        )}
                      </div>

                      <div>
                        <span className={`text-[9px] font-semibold font-mono px-2 py-0.5 rounded-full ${
                          r.status === "Approved" 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : r.status === "Rejected"
                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                            : r.status === "Returned by HR" || r.status === "Returned by Division Chief"
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBMENU 3: ASSIGNED ACTIVITIES */}
        {activeSubMenu === "activities" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-base font-bold text-slate-800">My Assigned Activities</h1>
              <p className="text-xs text-slate-400">Review official mediation hearings and administrative trips assigned to you for execution.</p>
            </div>

            {activities.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs italic">
                No active assigned travel activities registered in the database.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.map((act: any) => (
                  <div key={act.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/20 block space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">
                        {act.activityNo}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{act.dateScheduled}</span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-800">{act.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-1">"{act.description}"</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Disbursement Budget</span>
                      <strong className="text-xs text-blue-600">₱{act.allottedBudget.toLocaleString()}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBMENU 4: LIQUIDATIONS */}
        {activeSubMenu === "liquidations" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-base font-bold text-slate-800">Liquidation Reports Submission Portal</h1>
              <p className="text-xs text-slate-400">Upload liquidation vouchers, invoice files, and Receipts to clear cash advances with HR and Finance.</p>
            </div>

            {/* CREATE SUBMISSION FORM */}
            <form onSubmit={handleLiquidationSubmit} className="space-y-4 p-5 border border-slate-200 rounded-xl bg-slate-50/30">
              <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">File Liquidation Voucher Report</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Assigned Activity</label>
                  <select
                    value={selectedActivityId}
                    onChange={e => {
                      setSelectedActivityId(e.target.value);
                      const found = activities.find(a => a.id === e.target.value);
                      if (found) setTotalReleased(found.allottedBudget);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold"
                  >
                    <option value="">-- Choose Assigned Activity --</option>
                    {activities.map(a => (
                      <option key={a.id} value={a.id}>{a.activityNo} - {a.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Cash Advanced (₱)</label>
                  <input
                    type="number"
                    disabled
                    value={totalReleased}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Actual Spent Amount (₱)</label>
                  <input
                    type="number"
                    required
                    value={totalSpent || ""}
                    onChange={e => setTotalSpent(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* MOCK ATTACHMENT UPLOADER */}
              <div className="p-3.5 bg-white border border-slate-150 rounded-lg space-y-3 max-w-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400 font-mono">Upload Receipts & Invoices Vouchers</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Voucher Name (e.g. Fuel receipt Petron)"
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <select
                    value={newFileType}
                    onChange={e => setNewFileType(e.target.value)}
                    className="px-2 border border-slate-200 rounded-lg text-xs text-slate-600"
                  >
                    <option value="Invoice">Invoice</option>
                    <option value="Liquidation Report">Liquidation Report</option>
                    <option value="Disbursement Voucher">Disbursement Voucher</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddMockDoc}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Attach
                  </button>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="space-y-1 border-t border-slate-100 pt-2.5">
                    {attachedFiles.map((file, i) => (
                      <div key={file.id} className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-100 text-[11px] text-slate-600">
                        <span className="font-mono">📎 {file.name} (PDF)</span>
                        <button type="button" onClick={() => handleRemoveAttached(file.id)} className="text-rose-500 hover:text-rose-700">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Evaluation Remarks / Travel notes</label>
                <textarea
                  placeholder="Review or ledger statements for HR & Finance check..."
                  value={liqRemarks}
                  onChange={e => setLiqRemarks(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs h-16 max-w-xl"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer transition-all"
              >
                Submit Liquidation to HR
              </button>
            </form>

            {/* PAST REPORT ENTRIES LIQUIADTION LEDGER */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">My Settlement Log Entries</h2>
              {submissions.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No settlement reports logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub: any) => (
                    <div key={sub.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/10 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-800">{sub.submissionNo}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Released: ₱{sub.totalReleased} | Spent: ₱{sub.totalSpent}</span>
                        </div>
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                          sub.status === "Approved" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : sub.status === "Returned"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          {sub.status}
                        </span>
                      </div>

                      {/* REMARKS AND TRIAL CORRECTION VIEWS */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10px] font-sans">
                        <div className="p-2 bg-white rounded border border-slate-100">
                          <span className="text-blue-700 font-bold uppercase font-mono">HR Verification:</span>
                          <p className="text-slate-500 class-italic mt-0.5">"{sub.hrRemarks || 'Pending review'}"</p>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-100">
                          <span className="text-emerald-700 font-bold uppercase font-mono">Finance Check:</span>
                          <p className="text-slate-500 class-italic mt-0.5">"{sub.financeRemarks || 'Awaiting HR forward'}"</p>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-100 font-sans">
                          <span className="text-purple-700 font-bold uppercase font-mono">Chief Approval:</span>
                          <p className="text-slate-500 class-italic mt-0.5">"{sub.divisionChiefRemarks || 'Pending endorsements'}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBMENU 5: NOTIFICATIONS */}
        {activeSubMenu === "notifications" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-base font-bold text-slate-800">My System Notifications</h1>
              <p className="text-xs text-slate-400">View responsive real-time notifications track files validation states from HR and Finance.</p>
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No alerts found.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n: any) => (
                  <div key={n.id} className="p-3 border border-slate-100 rounded-lg text-xs bg-slate-50/20 flex items-start space-x-2">
                    <Clock size={12} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <p className="text-slate-500 mt-0.5">{n.message}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">{n.timestamp.split("T").join(" ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
