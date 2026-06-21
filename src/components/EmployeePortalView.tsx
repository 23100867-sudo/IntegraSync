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
  Bell,
  Package
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
  const [resubmittingItem, setResubmittingItem] = useState<any | null>(null);

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
      const url = resubmittingItem 
        ? `/api/liquidation-submissions/${resubmittingItem.id}/resubmit`
        : "/api/liquidation-submissions";
      const method = resubmittingItem ? "PUT" : "POST";

      const res = await apiCall(url, {
        method,
        body: JSON.stringify({
          activityId: selectedActivityId,
          totalReleased,
          totalSpent,
          remarks: liqRemarks,
          supportingDocs: attachedFiles
        })
      });

      if (res.status === "success") {
        setSuccess(resubmittingItem 
          ? `Settlement revision report ${resubmittingItem.submissionNo} corrected and resubmitted successfully to HR desk.`
          : "Liquidation report filed. Forwarded to HR relationship and activity verification desk.");
        setLiqRemarks("");
        setAttachedFiles([]);
        setTotalSpent(0);
        setSelectedActivityId("");
        setTotalReleased(0);
        setResubmittingItem(null);
        fetchPortalData();
        onRefresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit liquidation.");
    }
  }

  const [isDragging, setIsDragging] = useState(false);

  // Read file as base64
  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const formattedSize = (file.size / 1024).toFixed(1) + " KB";
      const newDoc = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: file.name,
        size: formattedSize,
        type: file.type || "application/octet-stream",
        content: base64Data, // Save actual base64
        uploadedAt: new Date().toISOString()
      };
      setAttachedFiles(prev => [...prev, newDoc]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        handleFileRead(e.target.files[i]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        handleFileRead(e.dataTransfer.files[i]);
      }
    }
  };

  const downloadBase64File = (name: string, content: string) => {
    if (!content) {
      alert("No printable file attachments scanned for this mock metadata row.");
      return;
    }
    const link = document.createElement("a");
    link.href = content;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider flex items-center justify-between">
                <span>{resubmittingItem ? `Correct & Resubmit Report: ${resubmittingItem.submissionNo}` : "File Liquidation Voucher Report"}</span>
                {resubmittingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setResubmittingItem(null);
                      setSelectedActivityId("");
                      setTotalReleased(0);
                      setTotalSpent(0);
                      setLiqRemarks("");
                      setAttachedFiles([]);
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 bg-white border px-2 py-0.5 rounded font-mono uppercase cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </h2>

              {resubmittingItem && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-850 space-y-2">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-amber-900 font-mono">⚠️ CORRECTIONS REQUIRED & FEEDBACK FROM AUDITING</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <strong>HR Verification:</strong>
                      <p className="text-slate-600 italic mt-0.5">"{resubmittingItem.hrRemarks || 'Returned by HR'}"</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <strong>Finance Validation:</strong>
                      <p className="text-slate-600 italic mt-0.5">"{resubmittingItem.financeRemarks || 'Awaiting Finance evaluation'}"</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <strong>Division Chief Decision:</strong>
                      <p className="text-slate-600 italic mt-0.5">"{resubmittingItem.divisionChiefRemarks || 'Returned by Chief'}"</p>
                    </div>
                  </div>
                  
                  <p className="text-[10px] font-sans font-medium text-slate-600 leading-normal">
                    Please audit your bills and receipts, edit the <strong>Actual Spent Amount</strong>, attach any missing Receipts/Invoices, and click <strong>"Resubmit Corrected Report"</strong> below to refresh active evaluation queues.
                  </p>
                </div>
              )}
              
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

              {/* REAL DRAG & DROP ATTACHMENT UPLOADER */}
              <div className="p-4 bg-white border border-slate-150 rounded-xl space-y-3 max-w-xl">
                <p className="text-[10px] font-bold uppercase text-slate-500 font-mono tracking-wider">Upload Receipts & Invoices Vouchers</p>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                    isDragging 
                      ? "border-blue-500 bg-blue-50/50" 
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                  }`}
                  onClick={() => document.getElementById("receipt-input")?.click()}
                >
                  <input
                    id="receipt-input"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Package className="text-slate-400" size={24} />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 font-sans">Drag and drop receipts here, or <span className="text-blue-600 underline">browse</span></p>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">Supports PDF, Images or documents up to 5MB (Real base64 persisted file load)</p>
                  </div>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <p className="text-[9px] font-bold uppercase text-slate-400 font-mono tracking-wider">Loaded Documents Queue</p>
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-150 text-[11px] text-slate-600">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">📎 {file.name}</span>
                          {file.size && <span className="text-[9px] bg-slate-200 text-slate-600 font-bold font-mono px-1.5 rounded">{file.size}</span>}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {file.content && (
                            <button
                              type="button"
                              onClick={() => downloadBase64File(file.name, file.content)}
                              className="text-blue-600 hover:text-blue-800 text-[10px] font-bold font-mono uppercase cursor-pointer"
                            >
                              Download
                            </button>
                          )}
                          <button type="button" onClick={() => handleRemoveAttached(file.id)} className="text-rose-500 hover:text-rose-700 text-[10px] font-bold font-mono uppercase cursor-pointer">
                            Remove
                          </button>
                        </div>
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
                className={`px-6 py-2 rounded-lg shadow-sm font-semibold text-xs cursor-pointer transition-all ${
                  resubmittingItem 
                    ? "bg-amber-600 hover:bg-amber-700 text-white" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {resubmittingItem ? "Resubmit Corrected Report" : "Submit Liquidation to HR"}
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
                        <div className="flex items-center space-x-2">
                          {sub.status === "Returned" && (
                            <button
                              type="button"
                              onClick={() => {
                                setResubmittingItem(sub);
                                setSelectedActivityId(sub.activityId);
                                setTotalReleased(sub.totalReleased);
                                setTotalSpent(sub.totalSpent);
                                setLiqRemarks(sub.remarks || "");
                                setAttachedFiles(sub.supportingDocs || []);
                              }}
                              className="px-2 py-0.5 bg-amber-650 hover:bg-amber-700 text-amber-900 border border-amber-300 font-bold rounded text-[9px] uppercase tracking-wider cursor-pointer font-mono"
                            >
                              Fix & Resubmit
                            </button>
                          )}
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                            sub.status === "Approved" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : sub.status === "Returned"
                              ? "bg-amber-50 text-amber-700 border border-amber-105"
                              : "bg-blue-50 text-blue-700 border border-blue-101"
                          }`}>
                            {sub.status}
                          </span>
                        </div>
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

                      {/* ATTACHED DOCUMENTS VIEW AND DOWNLOAD */}
                      {sub.supportingDocs && sub.supportingDocs.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Receipt Ledger:</span>
                          {sub.supportingDocs.map((doc: any, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => downloadBase64File(doc.name, doc.content)}
                              className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[10px] text-blue-600 font-mono font-medium inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <span>📎 {doc.name}</span>
                              {doc.size && <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded">{doc.size}</span>}
                            </button>
                          ))}
                        </div>
                      )}
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
