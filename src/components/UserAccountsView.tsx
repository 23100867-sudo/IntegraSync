import React, { useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { apiCall } from "../utils";
import { Plus, Edit2, Trash2, Key, ShieldCheck, Mail, UserCheck, Search, X } from "lucide-react";

interface UserAccountsViewProps {
  currentUser: User;
}

export default function UserAccountsView({ currentUser }: UserAccountsViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [accountStatus, setAccountStatus] = useState<"Active" | "Deactivated">("Active");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await apiCall("/api/admin/users");
      if (res.status === "success") {
        setUsers(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch user accounts directory.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingUser(null);
    setUsername("");
    setEmail("");
    setFullName("");
    setSelectedRole(UserRole.EMPLOYEE);
    setAccountStatus("Active");
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(usr: User) {
    setEditingUser(usr);
    setUsername(usr.username);
    setEmail(usr.email);
    setFullName(usr.fullName);
    setSelectedRole(usr.role);
    setAccountStatus(usr.status || "Active");
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !email || !fullName) {
      setError("Please fill out all mandatory credentials fields.");
      return;
    }

    try {
      if (editingUser) {
        // Edit User
        const res = await apiCall(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify({ username, email, fullName, role: selectedRole, status: accountStatus })
        });
        if (res.status === "success") {
          setSuccess("User account details calibrated successfully.");
          fetchUsers();
          setTimeout(() => setModalOpen(false), 800);
        }
      } else {
        // Create User
        const res = await apiCall("/api/admin/users", {
          method: "POST",
          body: JSON.stringify({ username, email, fullName, role: selectedRole, status: accountStatus })
        });
        if (res.status === "success") {
          setSuccess("Brand new user account successfully registered and activated.");
          fetchUsers();
          setTimeout(() => setModalOpen(false), 800);
        }
      }
    } catch (err: any) {
      setError(err.message || "An exception occurred while persisting security settings.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you absolutely sure you want to permanently delete this user account credential?")) {
      return;
    }
    setError("");
    try {
      const res = await apiCall(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.status === "success") {
        setSuccess("User account safely removed from local directory.");
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message || "Could not delete user account.");
    }
  }

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-sans text-slate-800 tracking-tight">User Account & Credentials Deck</h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Define access categories, audit clearances, and provision active user logons.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus size={15} />
          <span>Provision New Account</span>
        </button>
      </div>

      {search || filteredUsers.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* SEARCH BAR */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center space-x-3">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search user profile credentials, roles, usernames..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs text-slate-700 placeholder-slate-400 w-full"
            />
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase font-mono">Profile and Name</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase font-mono">System Username</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase font-mono">Email Address</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase font-mono">Access Level Role</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase font-mono">Employee ID</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase font-mono">Status</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase font-mono text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-xs text-slate-400 font-sans">
                      Loading local user credential ledger directories...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-xs text-slate-400 font-sans">
                      No matching registered accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(usr => (
                    <tr key={usr.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs text-uppercase border border-slate-200">
                            {usr.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{usr.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {usr.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {usr.username}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-sans text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <Mail size={12} className="text-slate-400" />
                          <span>{usr.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold font-mono tracking-wider ${
                          usr.role === UserRole.SUPER_ADMIN 
                            ? "bg-purple-50 text-purple-600 border border-purple-100"
                            : usr.role === UserRole.HR_OFFICER
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : usr.role === UserRole.FINANCE_OFFICER
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : usr.role === UserRole.BUDGET_OFFICER
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {usr.employeeId || "None Assigned"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold font-mono tracking-wider border ${
                          (usr.status || "Active") === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {usr.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          {usr.username !== "admin" && usr.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={async () => {
                                const nextStatus = (usr.status || "Active") === "Active" ? "Deactivated" : "Active";
                                try {
                                  setLoading(true);
                                  const res = await apiCall(`/api/admin/users/${usr.id}`, {
                                    method: "PUT",
                                    body: JSON.stringify({ status: nextStatus })
                                  });
                                  if (res.status === "success") {
                                    fetchUsers();
                                  }
                                } catch (err: any) {
                                  setError(err.message || "Failed to alter status.");
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className={`p-1 px-2.5 py-1.5 rounded text-xs flex items-center space-x-1 cursor-pointer transition-colors ${
                                (usr.status || "Active") === "Active"
                                  ? "hover:bg-amber-50 text-amber-600 hover:text-amber-700"
                                  : "hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700"
                              }`}
                            >
                              <UserCheck size={12} />
                              <span>{(usr.status || "Active") === "Active" ? "Deactivate" : "Activate"}</span>
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(usr)}
                            className="p-1 px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          
                          {usr.username !== "admin" && usr.id !== currentUser.id && (
                            <button
                              onClick={() => handleDelete(usr.id)}
                              className="p-1 px-2.5 py-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-100 shadow-sm shrink-0">
          <Key size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Retrieving security parameters...</p>
        </div>
      )}

      {/* ACCOUNT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                {editingUser ? "Edit User Authority Settings" : "Provision New Identity logon"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border-l-2 border-rose-500 text-rose-700 text-xs font-mono">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border-l-2 border-emerald-500 text-emerald-700 text-xs font-sans">
                  {success}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Clara Santos"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">System Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. clara"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. clara@hsac.gov.ph"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Clearance & Role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                >
                  <option value={UserRole.SUPER_ADMIN}>Administrator / Division Chief</option>
                  <option value={UserRole.HR_OFFICER}>HR Officer</option>
                  <option value={UserRole.FINANCE_OFFICER}>Financial Officer</option>
                  <option value={UserRole.BUDGET_OFFICER}>Budget Officer</option>
                  <option value={UserRole.EMPLOYEE}>Employee / Personnel</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Logon Status</label>
                <select
                  value={accountStatus}
                  onChange={e => setAccountStatus(e.target.value as "Active" | "Deactivated")}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                >
                  <option value="Active">Active</option>
                  <option value="Deactivated">Deactivated</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  {editingUser ? "Seal Configuration" : "Provision logon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
