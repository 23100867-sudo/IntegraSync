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
import HsacLogo from "./components/HsacLogo";
import { 
  Building, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  Settings, 
  FolderLock, 
  Sparkles,
  Fingerprint,
  BookOpen,
  X
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [activeFinanceSubTab, setActiveFinanceSubTab] = useState<string>("dashboard");
  const [helpOpen, setHelpOpen] = useState(false);
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

  function getDefaultTabForRole(role: UserRole): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "dashboard";
      case UserRole.HR_OFFICER:
        return "employees";
      case UserRole.FINANCE_OFFICER:
        return "finance";
      case UserRole.BUDGET_OFFICER:
        return "budget";
      case UserRole.EMPLOYEE:
      default:
        return "assets";
    }
  }

  async function checkSession() {
    try {
      const res = await apiCall("/api/sessions/current");
      if (res.status === "success" && res.data) {
        const loggedUser = res.data;
        setUser(loggedUser);
        setActiveTab(getDefaultTabForRole(loggedUser.role));
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
    } catch (err: any) {
      if (err?.message === "Failed to fetch" || err?.message?.includes("fetch") || err?.toString()?.includes("Failed to fetch")) {
        console.warn("Server sync interrupted momentarily:", err?.message || err);
      } else {
        console.error("Grave: Server sync interrupted. Retrying connection...", err);
      }
    }
  }

  async function fetchSummary() {
    try {
      const res = await apiCall("/api/dashboard/summary");
      if (res.status === "success") {
        setSummary(res.data);
      }
    } catch (err: any) {
      if (err?.message === "Failed to fetch" || err?.message?.includes("fetch") || err?.toString()?.includes("Failed to fetch")) {
        console.warn("Central stats momentarily unreachable:", err?.message || err);
      } else {
        console.error("Failed to compile central stats", err);
      }
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
        const loggedUser = res.data?.user || res.user;
        setUser(loggedUser);
        setActiveTab(getDefaultTabForRole(loggedUser.role));
      }
    } catch (err: any) {
      setAuthError(err.message || "Invalid credentials. Please attempt again.");
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
        if (user.role !== UserRole.SUPER_ADMIN) {
          return (
            <div className="p-12 text-center space-y-4">
              <p className="text-slate-500 font-medium">Redirecting you to your authorized desk view...</p>
            </div>
          );
        }
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
            activeSubTab={activeFinanceSubTab}
            setActiveSubTab={setActiveFinanceSubTab}
          />
        );
      case "budget":
        return (
          <FinanceView 
            user={user} 
            transactions={transactions} 
            fetchSummary={fetchSummary}
            onRefresh={triggerRefresh}
            activeSubTab="budgets"
            setActiveSubTab={() => {}}
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
      <div id="login-gateway-container" className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        
        {/* LOGO TITLE SECTION */}
        <div className="text-center mb-6 max-w-lg select-none px-4">
          <div className="mb-4 flex justify-center">
            <HsacLogo size={96} className="bg-white rounded-full p-1.5 border-4 border-blue-600/30 shadow-2xl" />
          </div>
          <h1 className="text-base font-extrabold uppercase tracking-[0.2em] text-blue-400 font-mono">
            IntegraSync
          </h1>
          <p className="text-xl font-extrabold font-sans text-white tracking-tight mt-1.5">
            Integrated Personnel & Financial Management System
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono mt-2 flex items-center justify-center gap-2">
            <span>Regional Adjudication Branch I</span>
            <span className="text-slate-600">•</span>
            <span>San Fernando, La Union</span>
          </p>
        </div>

        {/* SECURE LOGIN CARD */}
        <div className="w-full max-w-md bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 flex flex-col justify-center space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Lock size={12} className="text-blue-500" />
                <span>Authorized Gateway</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Input formal Department credentials for secure database entry.</p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-xl text-[11px] text-rose-300 leading-relaxed font-semibold font-sans">
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
                  className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-mono"
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
                  className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold uppercase shadow-lg transition-all tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Fingerprint size={16} />
                <span>Verify & Sign In</span>
              </button>
            </form>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 font-mono mt-6 text-center select-none leading-relaxed">
          San Fernando Adjudication Branch No. 1 Portal • SEC-IS Security Enforced<br />
          Built in React, Tailwind, and Node.js Node Container
        </p>
      </div>
    );
  }

  // Gated System Workspace layout frame
  return (
    <div id="applet-viewport-frame" className="h-screen w-screen flex overflow-hidden bg-slate-950 text-slate-800 font-sans font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleSignOut}
        activeFinanceSubTab={activeFinanceSubTab}
        setActiveFinanceSubTab={setActiveFinanceSubTab}
      />

      {/* CORE WORKSPACE FRAME */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER BRAND AND CLOCK */}
        <Header 
          user={user} 
          onOpenHelp={() => setHelpOpen(true)}
        />

        {/* ACTIVE MODULE CONTAINER SCREEN */}
        <main className="flex-1 flex overflow-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* SYSTEM DOCUMENTATION MODAL OVERLAY */}
      {helpOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800">
                <BookOpen size={18} className="text-blue-600" />
                <h3 className="font-semibold text-sm tracking-tight">HSAC RAB 1 IPFMS Guide</h3>
              </div>
              <button 
                onClick={() => setHelpOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 font-sans text-xs text-slate-600 leading-relaxed max-h-[70vh] overflow-y-auto">
              <p className="text-slate-500">
                Welcome to the <strong>Integrated Personnel & Financial Management Portal (IntegraSync)</strong> of the Human Settlements Adjudication Commission (HSAC) Regional Adjudication Branch No. 1.
              </p>

              <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-blue-800 text-[11px] uppercase tracking-wider font-mono">System Guideline Checklist:</p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✦</span>
                    <span><strong>Employee Personal Data Sheets (PDS):</strong> Manage full personnel rosters, upload authorized documents, and track compliance certifications (Civil Service and TAM compliant).</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✦</span>
                    <span><strong>Financial Tracking & Vouchers:</strong> Log expenditure receipts, submit and audit digital liquidation scopes, and reconcile programs or financial transactions.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✦</span>
                    <span><strong>Treasury Budgets & FAR Compliance:</strong> Monitor budget allotments, track obligational liabilities, and export audit-ready SAAODB / FAR 1, FAR 1A and FAR 3 spreadsheet books.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✦</span>
                    <span><strong>Property & Supply Custody:</strong> Monitor accountability indexes, issue signature receipts (PAR), and track active inventories.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✦</span>
                    <span><strong>Adjudication & Services Desk:</strong> File leaves, request Zoom rooms, dispatch official vehicles, and receive equipment.</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                <span className="flex items-center text-emerald-600 font-semibold uppercase tracking-wider">
                  <ShieldCheck size={12} className="mr-1" />
                  RA 10173 Crypt-Secure
                </span>
                <span>Branch: San Fernando City, La Union</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setHelpOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                Dismiss Guideline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
