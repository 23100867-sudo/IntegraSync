import React, { useState, useEffect } from "react";
import { Employee, User, UserRole, Training, EmploymentHistory } from "../types";
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  FileDown, 
  BookOpen, 
  FolderMinus, 
  Calendar, 
  Smartphone, 
  MapPin, 
  Mail, 
  FileText,
  UserPlus,
  RefreshCw,
  Clock,
  X,
  FileCheck
} from "lucide-react";
import { apiCall, formatDate } from "../utils";

interface EmployeesViewProps {
  user: User;
  employees: Employee[];
  fetchSummary: () => void;
  onRefresh: () => void;
}

export default function EmployeesView({ user, employees, fetchSummary, onRefresh }: EmployeesViewProps) {
  const [employeesList, setEmployeesList] = useState<Employee[]>(employees);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  // Selected Profile Drawer states
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [empTrainings, setEmpTrainings] = useState<Training[]>([]);
  const [empHistory, setEmpHistory] = useState<EmploymentHistory[]>([]);
  
  // Registration and updates Modals
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  
  // Form values
  const [formData, setFormData] = useState({
    employeeId: "",
    fullName: "",
    position: "",
    division: "Adjudication Division",
    employmentStatus: "Permanent",
    email: "",
    address: "",
    dateHired: "",
    contactNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: ""
  });

  const [trainingData, setTrainingData] = useState({
    title: "",
    organizer: "",
    dateConducted: "",
    hours: 8,
    certName: ""
  });

  const isHrOrAdmin = [UserRole.SUPER_ADMIN, UserRole.HR_OFFICER].includes(user.role);

  useEffect(() => {
    setEmployeesList(employees);
  }, [employees]);

  useEffect(() => {
    if (selectedEmp) {
      loadEmployeeDetails(selectedEmp.employeeId);
    }
  }, [selectedEmp]);

  async function loadEmployeeDetails(employeeId: string) {
    try {
      const trainRes = await apiCall(`/api/employees/${employeeId}/trainings`);
      const histRes = await apiCall(`/api/employees/${employeeId}/history`);
      if (trainRes.status === "success") setEmpTrainings(trainRes.data);
      if (histRes.status === "success") setEmpHistory(histRes.data);
    } catch (err) {
      console.error("Error retrieving secondary profiles", err);
    }
  }

  // Handle personnel registration
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiCall("/api/employees", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (res.status === "success") {
        alert("Personnel file recorded under structural indexes successfully!");
        setIsRegModalOpen(false);
        onRefresh();
        fetchSummary();
        // Reset form
        setFormData({
          employeeId: "",
          fullName: "",
          position: "",
          division: "Adjudication Division",
          employmentStatus: "Permanent",
          email: "",
          address: "",
          dateHired: "",
          contactNumber: "",
          emergencyContactName: "",
          emergencyContactPhone: ""
        });
      }
    } catch (err: any) {
      alert(err.message || "An error occurred during registration");
    }
  }

  // Add training credit
  async function handleAddTraining(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      const res = await apiCall(`/api/employees/${selectedEmp.employeeId}/trainings`, {
        method: "POST",
        body: JSON.stringify({
          title: trainingData.title,
          organizer: trainingData.organizer,
          dateConducted: trainingData.dateConducted,
          trainingHours: trainingData.hours,
          certificateFilename: trainingData.certName || "certificate_signed.pdf"
        })
      });
      if (res.status === "success") {
        alert("Seminar / Training hours credited successfully!");
        setIsTrainingModalOpen(false);
        loadEmployeeDetails(selectedEmp.employeeId);
        // Reset form
        setTrainingData({
          title: "",
          organizer: "",
          dateConducted: "",
          hours: 8,
          certName: ""
        });
      }
    } catch (err: any) {
      alert(err.message || "An error occurred writing training record");
    }
  }

  // Delete employee record
  async function handleDelete(id: string) {
    if (!window.confirm("Danger: Deleting this personnel file will clear matching service logs. Complete?")) return;
    try {
      const res = await apiCall(`/api/employees/${id}`, { method: "DELETE" });
      if (res.status === "success") {
        setSelectedEmp(null);
        onRefresh();
        fetchSummary();
        alert("Personnel file deleted from databases.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Mock Uploading PDS document
  function handleUploadPDSMock() {
    if (!selectedEmp) return;
    const filename = `${selectedEmp.employeeId}_PDS_Form_2026.pdf`;
    apiCall(`/api/employees/${selectedEmp.employeeId}/pds`, {
      method: "POST",
      body: JSON.stringify({ filename })
    }).then(res => {
      if (res.status === "success") {
        alert("Personal Data Sheet uploaded/configured successfully in cloud run memory!");
        setSelectedEmp(res.data);
        onRefresh();
      }
    }).catch(err => alert(err.message));
  }

  // Live filter matching
  const filteredEmployees = employeesList.filter((emp) => {
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivision = filterDivision ? emp.division === filterDivision : true;
    const matchesStatus = filterStatus ? emp.employmentStatus === filterStatus : true;
    return matchesSearch && matchesDivision && matchesStatus;
  });

  return (
    <div id="employees-view-container" className="flex-1 flex overflow-hidden bg-slate-50">
      
      {/* LEFT SECTION: MAIN SEARCH & COLLATIVE DIRECTORY */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-md font-bold text-slate-800">HR Personnel Master Directory</h1>
            <p className="text-[11px] text-slate-500">Coordinate plantillas, professional files, PDS, and credits logs.</p>
          </div>
          {isHrOrAdmin && (
            <button
              id="btn-reg-employee"
              onClick={() => setIsRegModalOpen(true)}
              className="bg-slate-900 text-white hover:bg-slate-800 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center shadow"
            >
              <UserPlus size={14} className="mr-1.5" />
              <span>Add Employee Profile</span>
            </button>
          )}
        </div>

        {/* SEARCH AND FILTERS TOOLBAR */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Full Name, position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-3 text-xs focus:ring-1 text-slate-600 font-medium"
            >
              <option value="">All Divisions</option>
              <option value="Adjudication Division">Adjudication Division</option>
              <option value="Administrative and Finance Division">Admin & Finance</option>
              <option value="Legal Division">Legal Division</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-3 text-xs focus:ring-1 text-slate-600 font-medium"
            >
              <option value="">All Status</option>
              <option value="Permanent">Permanent</option>
              <option value="Temporary">Temporary</option>
              <option value="Co-terminus">Co-terminus</option>
              <option value="Contractual">Contractual</option>
            </select>
          </div>
        </div>

        {/* INTERACTIVE DATA TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px] select-none">
                  <th className="p-4 w-28">Employee ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Division</th>
                  <th className="p-4">Official Designation</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">PDS File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmp(emp)}
                      className={`cursor-pointer transition-colors ${
                        selectedEmp?.id === emp.id ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="p-4 font-mono font-semibold text-slate-700">{emp.employeeId}</td>
                      <td className="p-4 text-slate-900 font-medium">{emp.fullName}</td>
                      <td className="p-4 text-slate-600">{emp.division}</td>
                      <td className="p-4 text-slate-500">{emp.position}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          emp.employmentStatus === "Permanent" 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : emp.employmentStatus === "Contractual"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}>
                          {emp.employmentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {emp.pdsFieldName ? (
                          <span className="text-emerald-600 font-semibold flex items-center justify-center text-[10px] gap-1">
                            <FileCheck size={12} />
                            <span>Attached</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">None</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-mono">
                      No matching regional personnel files found on records folder.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>Roster metrics: {filteredEmployees.length} profiles displayed</span>
            <span>HSAC Regional Adjudication Branch I</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: EXHAUSTIVE RECORD INSPECTION FILE DRAWER */}
      {selectedEmp && (
        <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto flex flex-col shrink-0">
          {/* DRAWER HEADER */}
          <div className="p-4 bg-slate-100 text-slate-800 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center space-x-2">
              <BookOpen size={16} className="text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Service Record Inspection</h3>
            </div>
            <button 
              onClick={() => setSelectedEmp(null)} 
              className="text-slate-500 hover:text-slate-800 transition-colors p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* CORE DETAILS CARD */}
          <div className="p-5 space-y-6">
            <div className="text-center border-b border-slate-100 pb-5">
              <div className="h-16 w-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-800 border-2 border-slate-200 font-bold text-2xl mb-2">
                {selectedEmp.fullName.charAt(0)}
              </div>
              <h2 className="text-sm font-bold text-slate-800">{selectedEmp.fullName}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{selectedEmp.position}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-1 select-all">{selectedEmp.employeeId}</p>
            </div>

            {/* DIRECT INFORMATION KEY VALUES */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
                Contact & Core Records
              </h4>
              <div className="space-y-3 text-[11px]">
                <div className="flex items-start">
                  <MapPin size={14} className="text-slate-400 mr-2.5 shrink-0 mt-0.5" />
                  <span className="text-slate-600">{selectedEmp.address || "No address logged."}</span>
                </div>
                <div className="flex items-center">
                  <Mail size={14} className="text-slate-400 mr-2.5 shrink-0" />
                  <span className="text-slate-600 font-medium select-all">{selectedEmp.email}</span>
                </div>
                <div className="flex items-center">
                  <Smartphone size={14} className="text-slate-400 mr-2.5 shrink-0" />
                  <span className="text-slate-600">{selectedEmp.contactNumber || "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={14} className="text-slate-400 mr-2.5 shrink-0" />
                  <div className="text-slate-600">
                    <span>Date Hired: </span>
                    <span className="font-semibold">{formatDate(selectedEmp.dateHired)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* EMERGENCY CONTACT INFORMATION BOX */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
              <span className="font-bold text-slate-700 block text-[10px] uppercase font-mono tracking-wider">
                Emergency Nexus
              </span>
              <div>
                <p className="font-semibold text-slate-800">{selectedEmp.emergencyContactName || "N/A"}</p>
                <p className="text-slate-500 font-mono text-[10px] mt-0.5">{selectedEmp.emergencyContactPhone || "N/A"}</p>
              </div>
            </div>

            {/* PERSONAL DATA SHEET (PDS) MODULE */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
                Personal Data Sheet (PDS)
              </h4>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-3">
                {selectedEmp.pdsFieldName ? (
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-slate-500" />
                      <span className="font-mono text-slate-700 truncate max-w-[120px]" title={selectedEmp.pdsFieldName}>
                        {selectedEmp.pdsFieldName}
                      </span>
                    </div>
                    {/* DOWNLOAD LINK SIMULATION */}
                    <button 
                      onClick={() => alert(`Triggering download of PDS PDF Form: ${selectedEmp.pdsFieldName}`)}
                      className="text-amber-600 hover:underline font-semibold"
                    >
                      Retrieve File
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">No formal CSV or PDF Civil Service Personal Data Sheet attached.</p>
                )}
                {isHrOrAdmin && (
                  <button
                    onClick={handleUploadPDSMock}
                    className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>{selectedEmp.pdsFieldName ? "Replace / Upgrade PDS Sheet" : "Upload Digital PDS Form"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* TRAINING & SEMINAR LISTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Trainings & Seminars Conducted
                </h4>
                {isHrOrAdmin && (
                  <button 
                    onClick={() => setIsTrainingModalOpen(true)}
                    className="text-[10px] text-amber-600 hover:underline font-semibold"
                  >
                    Add Entry
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {empTrainings && empTrainings.length > 0 ? (
                  empTrainings.map((trn) => (
                    <div key={trn.id} className="p-2.5 border border-slate-100 hover:border-slate-200 rounded-lg text-[11px] leading-relaxed">
                      <p className="font-semibold text-slate-800">{trn.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{trn.organizer} • {formatDate(trn.dateConducted)}</p>
                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-50 text-[10px] font-mono">
                        <span className="text-amber-600 font-bold">{trn.trainingHours} Credit Hours</span>
                        {trn.certificateFilename && <span className="text-slate-400 hover:underline cursor-pointer" onClick={() => alert(`Loading document file ${trn.certificateFilename}`)}>View Certificate</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 italic py-2">No educational seminar credits recorded on file index.</p>
                )}
              </div>
            </div>

            {/* PROMOTIONS & SERVICE RECORDS HIST */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
                Adjudicated Employment History
              </h4>
              <div className="relative border-l border-slate-100 pl-3.5 space-y-4">
                {empHistory && empHistory.length > 0 ? (
                  empHistory.map((hist) => (
                    <div key={hist.id} className="relative text-[11px] leading-relaxed">
                      {/* Circle indicator */}
                      <span className="absolute -left-[19px] top-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                      <p className="font-bold text-slate-800">{hist.action}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{formatDate(hist.effectiveDate)} • {hist.updatedBy}</p>
                      <div className="mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-[10px]">
                        <strong>Change: </strong> {hist.newDetails}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Service record trace is empty.</p>
                )}
              </div>
            </div>

            {/* ADMINISTRATION DESTRUCTIVE ACTIONS */}
            {user.role === UserRole.SUPER_ADMIN && (
              <div className="pt-6 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => handleDelete(selectedEmp.id)}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Declassify Personnel Record</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECORD REGISTRATION FORM (MODAL) */}
      {isRegModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider">HSAC Regional Personnel Registration Form</h3>
              <button onClick={() => setIsRegModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleRegister} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ID AND NAME */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Employee ID (Must Be Unique) *</label>
                  <input
                    required
                    type="text"
                    placeholder="EMP001"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="Maria Clara V. Santos"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>

                {/* POSITION AND DIVISION */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Title / Position *</label>
                  <input
                    required
                    type="text"
                    placeholder="Administrative Officer IV"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Division *</label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  >
                    <option value="Adjudication Division">Adjudication Division</option>
                    <option value="Administrative and Finance Division">Administrative and Finance Division</option>
                    <option value="Legal Division">Legal Division</option>
                  </select>
                </div>

                {/* STATUS AND EMAIL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Employment Status *</label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  >
                    <option value="Permanent">Permanent (Regular Platilla)</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Co-terminus">Co-terminus</option>
                    <option value="Contractual">Contractual (JO / COS)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Official Corporate Email *</label>
                  <input
                    required
                    type="email"
                    placeholder="name@hsac.gov.ph"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>

                {/* DATE HIRED AND PHONE */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Date Hired *</label>
                  <input
                    required
                    type="date"
                    value={formData.dateHired}
                    onChange={(e) => setFormData({ ...formData, dateHired: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Contact Number</label>
                  <input
                    type="text"
                    placeholder="0917-123-4567"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>

                {/* EMERGENCY */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Emergency Contact Name</label>
                  <input
                    type="text"
                    placeholder="Deified Guardian"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Emergency Phone</label>
                  <input
                    type="text"
                    placeholder="0915-111-2222"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Primary Residence Address</label>
                <textarea
                  placeholder="Street and City subdivision, Region 1"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs h-16"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="bg-slate-150 hover:bg-slate-250 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 border border-slate-850 text-white hover:bg-slate-800 font-semibold px-5 py-2 rounded-lg text-xs shadow-md"
                >
                  Save Personnel File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRAINING CREDIT MODAL */}
      {isTrainingModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider">Credit Seminar / Training Attendance</h3>
              <button onClick={() => setIsTrainingModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddTraining} className="p-5 space-y-4">
              <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-150 leading-relaxed">
                Adding professional hours to: <strong className="text-slate-700">{selectedEmp.fullName} ({selectedEmp.employeeId})</strong>
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Training Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Constitutional Adjudicative Formulations"
                  value={trainingData.title}
                  onChange={(e) => setTrainingData({ ...trainingData, title: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Organizing Agency *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Civil Service Commission Region 1"
                  value={trainingData.organizer}
                  onChange={(e) => setTrainingData({ ...trainingData, organizer: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Date Conducted *</label>
                  <input
                    required
                    type="date"
                    value={trainingData.dateConducted}
                    onChange={(e) => setTrainingData({ ...trainingData, dateConducted: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Training Hours *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="16"
                    value={trainingData.hours}
                    onChange={(e) => setTrainingData({ ...trainingData, hours: Number(e.target.value) })}
                    className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Digital Certificate Filename</label>
                <input
                  type="text"
                  placeholder="CSC_Cert_2910.pdf"
                  value={trainingData.certName}
                  onChange={(e) => setTrainingData({ ...trainingData, certName: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 p-2 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsTrainingModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 border border-slate-850 text-white hover:bg-slate-850 font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm"
                >
                  Write Training Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
