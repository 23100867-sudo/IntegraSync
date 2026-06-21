import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Package, 
  Clock, 
  ShieldAlert, 
  FileSpreadsheet, 
  LogOut,
  Building,
  UserCheck,
  BookOpen,
  Percent,
  History,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Settings
} from "lucide-react";
import { User, UserRole } from "../types";
import HsacLogo from "./HsacLogo";


interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  activeFinanceSubTab?: string;
  setActiveFinanceSubTab?: (tab: string) => void;
}

export default function Sidebar({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  activeFinanceSubTab = "dashboard", 
  setActiveFinanceSubTab 
}: SidebarProps) {
  const role = user.role;

  // Determine which navigation links are shown based on roles
  const menuItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      visible: role === UserRole.SUPER_ADMIN
    },
    
    // HR or ADMIN
    { 
      id: "employees", 
      label: "Personnel Information", 
      icon: Users,
      visible: [UserRole.SUPER_ADMIN, UserRole.HR_OFFICER].includes(role)
    },
    
    // FINANCE or ADMIN
    { 
      id: "finance", 
      label: "Financial Tracking", 
      icon: FileText,
      visible: [UserRole.SUPER_ADMIN, UserRole.FINANCE_OFFICER].includes(role)
    },

    // BUDGET or ADMIN
    {
      id: "budget",
      label: "Budget Monitoring",
      icon: Percent,
      visible: [UserRole.SUPER_ADMIN, UserRole.BUDGET_OFFICER].includes(role)
    },
    
    // ADMIN ONLY (ASSETS)
    { 
      id: "assets", 
      label: "Assets & Supplies", 
      icon: Package,
      visible: role === UserRole.SUPER_ADMIN
    },
    
    // ADMIN or HR (REQUESTS)
    { 
      id: "requests", 
      label: "Request Management", 
      icon: Clock,
      visible: [UserRole.SUPER_ADMIN, UserRole.HR_OFFICER].includes(role)
    },
    
    // EMPLOYEE DESK PORTAL (EMPLOYEE ONLY)
    {
      id: "employee_portal",
      label: "Employee Portal Desk",
      icon: UserCheck,
      visible: role === UserRole.EMPLOYEE
    },

    // DIVISION CHIEF (APPROVALS OFFICE COCKPIT)
    {
      id: "approvals",
      label: "Approval Office Cockpit",
      icon: ShieldCheck,
      visible: role === UserRole.SUPER_ADMIN
    },

    // DIVISION CHIEF (USER ACCOUNT & ROLE ALLOCATION)
    {
      id: "user-accounts",
      label: "User Accounts Desk",
      icon: Settings,
      visible: role === UserRole.SUPER_ADMIN
    },
    
    // REPORTS (ALL EXCEPT BASIC PERSONNELS)
    { 
      id: "reports", 
      label: "Generated Reports", 
      icon: FileSpreadsheet,
      visible: role !== UserRole.EMPLOYEE 
    },
    
    // ADMIN ONLY (AUDIT TRAIL)
    { 
      id: "audit", 
      label: "Security Audit Logs", 
      icon: ShieldAlert,
      visible: role === UserRole.SUPER_ADMIN 
    }
  ];

  return (
    <aside id="ipfms-sidebar" className="w-68 bg-slate-900 text-white min-h-screen flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div className="flex flex-col">
        {/* LOGO AND BRAND IDENTIFIER */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950">
          <HsacLogo size={36} className="shrink-0 bg-white rounded-full p-0.5 border border-blue-600/35" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white line-clamp-1">HSAC RAB 1</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">IPFMS Portal</p>
          </div>
        </div>

        {/* LOGGED IN USER PROFILE MINI-TILE */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-blue-400 border border-slate-600 font-medium text-lg shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-semibold text-slate-200 truncate">{user.fullName}</h2>
              <div className="flex items-center space-x-1 mt-0.5">
                <UserCheck size={10} className="text-blue-400" />
                <span className="text-[10px] text-slate-400 font-medium truncate shrink-0 max-w-[120px]" title={role}>
                  {role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION LIKS */}
        <nav className="p-3 space-y-1 flex-1 mt-2">
          {menuItems.map((item) => {
            if (item.visible === false) return null;

            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="flex flex-col space-y-1">
                <button
                  id={`btn-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === "finance" && setActiveFinanceSubTab) {
                      setActiveFinanceSubTab("dashboard");
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive 
                      ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10 cursor-pointer" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent size={16} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white"} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === "finance" && (
                    isActive ? <ChevronDown size={14} className="text-white shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  )}
                </button>

                {/* NESTED SUB-MENU ONLY FOR ACTIVE FINANCIAL TRACKING VIEW */}
                {item.id === "finance" && isActive && (
                  <div className="pl-6 pr-1.5 py-1.5 flex flex-col space-y-1 border-l border-slate-705 ml-5 mt-1 bg-slate-950/20 rounded-r-lg">
                    {[
                      { id: "dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
                      { id: "journal", label: "Transactions Journal", icon: FileText },
                      { id: "vault", label: "Documents Vault", icon: BookOpen },
                      { id: "liquidation", label: "Liquidation Desk", icon: Clock },
                      { id: "auditLogs", label: "Revisions Audit", icon: History },
                    ].map((subItem) => {
                      const isSubActive = activeFinanceSubTab === subItem.id;
                      const SubIcon = subItem.icon;
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            if (setActiveFinanceSubTab) {
                              setActiveFinanceSubTab(subItem.id);
                            }
                          }}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                            isSubActive 
                              ? "bg-slate-800 text-blue-400 font-bold border-l-2 border-blue-400 pl-1.5 cursor-pointer" 
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer"
                          }`}
                        >
                          <SubIcon size={12} className={isSubActive ? "text-blue-400 shrink-0" : "text-slate-500 shrink-0"} />
                          <span className="truncate">{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* FOOTER SIGNOUT ACTION */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <button
          id="btn-signout"
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          <span>Exit Secure Session</span>
        </button>
        <div className="text-center text-[9px] text-slate-500 font-mono mt-3">
          RAB No. 1 Philippines &copy; 2026
        </div>
      </div>
    </aside>
  );
}
