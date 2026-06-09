import React, { useState, useEffect } from "react";
import { User, UserRole, Employee, FinancialTransaction, Asset, SupplyItem, AnyRequest } from "./types";
import { apiCall } from "./utils";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import EmployeesView from "./components/EmployeesView";
import FinanceView from "./components/FinanceView";
import AssetsView from "./components/AssetsView";
import RequestsView from "./components/RequestsView";
import AuditView from "./components/AuditView";
import ReportsView from "./components/ReportsView";
import { 
  Building, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  Settings, 
  FolderLock, 
  Sparkles,
  Fingerprint
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Core Global States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [requests, setRequests] = useState<AnyRequest[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Authentication Fields
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Retrieve current session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Sync data whenever user logged state or manual trigger changes
  useEffect(() => {
    if (user) {
      syncDatabase();
    }
  }, [user, refreshTrigger]);

  function triggerRefresh() {
    setRefreshTrigger(prev => prev + 1);
  }

  async function checkSession() {
    try {
      const res = await apiCall("/api/sessions/current");
      if (res.status === "success" && res.data) {
        setUser(res.data);
      }
    } catch {
      // Normal: Not logged in
    }
  }

  async function syncDatabase() {
    try {
      const [empRes, finRes, astRes, supRes, reqRes] = await Promise.all([
        apiCall("/api/employees"),
        apiCall("/api/financial-transactions"),
        apiCall("/api/assets"),
        apiCall("/api/supplies"),
        apiCall("/api/requests")
      ]);

      if (empRes.status === "success") setEmployees(empRes.data);
      if (finRes.status === "success") setTransactions(finRes.data);
      if (astRes.status === "success") setAssets(astRes.data);
      if (supRes.status === "success") setSupplies(supRes.data);
      if (reqRes.status === "success") setRequests(reqRes.data);

      await fetchSummary();
    } catch (err) {
      console.error("Grave: Server sync interrupted. Retrying connection...", err);
    }
  }

  async function fetchSummary() {
    try {
      const res = await apiCall("/api/dashboard/summary");
      if (res.status === "success") {
        setSummary(res.data);
      }
    } catch (err) {
      console.error("Failed to compile central stats", err);
    }
  }

  // Handle formal credentials authentication
  async function handleFormLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      const res = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      if (res.status === "success") {
        const token = res.token || (res.data && res.data.token);
        if (token) {
          localStorage.setItem("ipfms_token", token);
        }
        setUser(res.data?.user || res.user);
        setActiveTab("dashboard");
      }
    } catch (err: any) {
      setAuthError(err.message || "Invalid credentials. Please attempt again.");
    } finally {
      setLoading(false);
    }
  }

  // Fast-track sandbox shortcut for easy validation of RBAC boundaries
  async function handleSandboxLogin(email: string) {
    setAuthError("");
    setLoading(true);
    try {
      const res = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "sandbox-master-pass" })
      });
      if (res.status === "success") {
        const token = res.token || (res.data && res.data.token);
        if (token) {
          localStorage.setItem("ipfms_token", token);
        }
        setUser(res.data?.user || res.user);
        setActiveTab("dashboard");
      }
    } catch (err: any) {
      setAuthError(err.message || "Sandbox authorization failure");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await apiCall("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem("ipfms_token");
      setUser(null);
      setActiveTab("dashboard");
    }
  }

  // Gated Page views dispatcher
  function renderActiveView() {
    if (!user) return null;

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView 
            user={user} 
            summaryData={summary} 
            loading={false}
            setActiveTab={setActiveTab}
          />
        );
      case "employees":
        return (
          <EmployeesView 
            user={user} 
            employees={employees} 
            fetchSummary={fetchSummary}
            onRefresh={triggerRefresh}
          />
        );
      case "finance":
        return (
          <FinanceView 
            user={user} 
            transactions={transactions} 
            fetchSummary={fetchSummary}
            onRefresh={triggerRefresh}
          />
        );
      case "assets":
        return (
          <AssetsView 
            user={user} 
            assets={assets} 
            supplies={supplies} 
            employees={employees}
            fetchSummary={fetchSummary}
            onRefresh={triggerRefresh}
          />
        );
      case "requests":
        return (
          <RequestsView 
            user={user} 
            requests={requests} 
            supplies={supplies}
            fetchSummary={fetchSummary}
            onRefresh={triggerRefresh}
          />
        );
      case "audit":
        if (user.role !== UserRole.SUPER_ADMIN) {
          return <div id="access-denied" className="p-6 text-xs text-rose-500 font-mono font-bold">Unauthenticated credentials path error [RA 10173 Security Block].</div>;
        }
        return <AuditView user={user} onRefresh={triggerRefresh} />;
      case "reports":
        return (
          <ReportsView 
            user={user} 
            employees={employees} 
            transactions={transactions} 
            assets={assets} 
            supplies={supplies} 
            requests={requests} 
          />
        );
      default:
        return <div className="p-6 text-slate-500">View formulation index not configured.</div>;
    }
  }

  // Gated Gateway frame
  if (!user) {
    return (
      <div id="login-gateway-container" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        
        {/* LOGO TITLE SECTION */}
        <div className="text-center mb-6 max-w-md select-none">
          <div className="h-14 w-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl border border-amber-350">
            <Building className="text-white" size={28} />
          </div>
          <h1 className="text-sm font-extrabold uppercase tracking-widest text-amber-600 font-mono">
            HSAC RAB I
          </h1>
          <p className="text-xl font-extrabold font-sans text-slate-800 tracking-tight mt-1">
            Integrated Personnel & Financial Management System
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mt-2">
            Regional Adjudication Branch I • San Fernando, La Union
          </p>
        </div>

        {/* COMBINED CREDENTIALS AND SANDBOX SHORTCUT CARD */}
        <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2">
          
          {/* LEFT: FORM LOGIN PORTAL */}
          <div className="p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 font-mono">Secure Access</h2>
              <p className="text-xs text-slate-500 mt-1">Input formal Department credentials authorized by SEC-IT division.</p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 leading-relaxed font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleFormLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">Account Email *</label>
                <input
                  required
                  type="email"
                  placeholder="name@hsac.gov.ph"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">Account Password *</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:bg-amber-600 py-3 rounded-xl text-xs font-bold uppercase shadow-lg transition-all tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Fingerprint size={16} />
                <span>Verify & Sign In</span>
              </button>
            </form>
          </div>

          {/* RIGHT: FAST-TRACK ROLE DESK GATEWAYS */}
          <div className="p-8 bg-slate-50 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Sandbox RBAC Testing Terminal</h2>
              <p className="text-xs text-slate-500 mt-1">Audit department privileges and workflows by fast-tracking sandbox logins.</p>
            </div>

            {/* QUICK LINK GATEWAYS */}
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { email: "super-admin@hsac.gov.ph", label: "Super Administrator Desk", desc: "Access immutable security audits and master declassifications.", role: "Admin Office" },
                { email: "hr@hsac.gov.ph", label: "HR Management Office Desk", desc: "Rosters coordination, PDS form uploads, and training seminars credits.", role: "HR Office" },
                { email: "finance@hsac.gov.ph", label: "Finance & Budget Desk", desc: "Expense journals, vouchers auditing, and and liquidation checkmarks.", role: "Financial" },
                { email: "custodian@hsac.gov.ph", label: "Property & Asset Custody Desk", desc: "Acquisition registers, PAR signature receipt hand-offs, and supply shelf balances.", role: "Custodial" },
                { email: "employee@hsac.gov.ph", label: "Employee / Adjudication Desk", desc: "Submit leave, Zoom rooms, dispatch vehicles, and receive materials.", role: "Personnel" }
              ].map((pill, index) => (
                <button
                  key={index}
                  onClick={() => handleSandboxLogin(pill.email)}
                  type="button"
                  className="bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 p-3 rounded-xl text-left transition-all flex items-center justify-between group shadow-sm cursor-pointer"
                >
                  <div className="space-y-1 pr-4">
                    <span className="text-[10px] font-mono text-amber-600 font-extrabold uppercase tracking-wider block">
                      {pill.role}
                    </span>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-amber-700 transition-colors">{pill.label}</p>
                    <p className="text-[10px] text-slate-500 leading-normal">{pill.desc}</p>
                  </div>
                  <UserCheck size={16} className="text-slate-400 group-hover:text-amber-600 shrink-0 transition-colors" />
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-1">
              <ShieldCheck size={11} className="text-emerald-500 animate-pulse" />
              <span>Full-Stack Sandboxed Security Session Active</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-mono mt-6 text-center select-none leading-relaxed">
          San Fernando Adjudication Branch No. 1 Portal • SEC-IS Security Enforced<br />
          Built in React, Tailwind, and Node.js Node Container
        </p>
      </div>
    );
  }

  // Gated System Workspace layout frame
  return (
    <div id="applet-viewport-frame" className="h-screen w-screen flex overflow-hidden bg-slate-50 text-slate-800 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleSignOut}
      />

      {/* CORE WORKSPACE FRAME */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER BRAND AND CLOCK */}
        <Header 
          user={user} 
        />

        {/* ACTIVE MODULE CONTAINER SCREEN */}
        <main className="flex-1 flex overflow-hidden">
          {renderActiveView()}
        </main>
      </div>

    </div>
  );
}
