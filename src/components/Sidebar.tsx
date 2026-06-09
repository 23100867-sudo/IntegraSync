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
  UserCheck
} from "lucide-react";
import { User, UserRole } from "../types";

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }: SidebarProps) {
  const role = user.role;

  // Determine which navigation links are shown based on roles
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    
    // HR or ADMIN
    { 
      id: "employees", 
      label: "Personnel Information", 
      icon: Users,
      visible: [UserRole.SUPER_ADMIN, UserRole.HR_OFFICER, UserRole.DEPARTMENT_HEAD].includes(role)
    },
    
    // FINANCE or ADMIN
    { 
      id: "finance", 
      label: "Financial Tracking", 
      icon: FileText,
      visible: [UserRole.SUPER_ADMIN, UserRole.FINANCE_OFFICER, UserRole.DEPARTMENT_HEAD].includes(role)
    },
    
    // CUSTODIAN or ADMIN
    { 
      id: "assets", 
      label: "Assets & Supplies", 
      icon: Package,
      visible: [UserRole.SUPER_ADMIN, UserRole.PROPERTY_CUSTODIAN, UserRole.DEPARTMENT_HEAD, UserRole.EMPLOYEE].includes(role)
    },
    
    // ALL USERS CAN SUBMIT REQUESTS OR APPROVE REQUESTS
    { 
      id: "requests", 
      label: "Request Management", 
      icon: Clock,
      visible: true 
    },
    
    // REPORTS (ALL EXCEPT BASIC EMPLOYEES)
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
    <aside id="ipfms-sidebar" className="w-68 bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between border-r border-slate-200 shrink-0">
      <div className="flex flex-col">
        {/* LOGO AND BRAND IDENTIFIER */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-100">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-lg font-bold flex items-center justify-center">
            <Building size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-800 line-clamp-1">HSAC RAB 1</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">IPFMS Portal</p>
          </div>
        </div>

        {/* LOGGED IN USER PROFILE MINI-TILE */}
        <div className="p-4 border-b border-slate-200 bg-slate-100/60">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-200 font-bold text-lg shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-semibold text-slate-800 truncate">{user.fullName}</h2>
              <div className="flex items-center space-x-1 mt-0.5">
                <UserCheck size={10} className="text-amber-650" />
                <span className="text-[10px] text-slate-500 font-medium truncate shrink-0 max-w-[120px]" title={role}>
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
              <button
                key={item.id}
                id={`btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive 
                    ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/10 cursor-pointer" 
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                }`}
              >
                <IconComponent size={16} className={isActive ? "text-slate-950" : "text-slate-500"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* FOOTER SIGNOUT ACTION */}
      <div className="p-3 border-t border-slate-200 bg-slate-100/40">
        <button
          id="btn-signout"
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          <span>Exit Secure Session</span>
        </button>
        <div className="text-center text-[9px] text-slate-400 font-mono mt-3">
          RAB No. 1 Philippines &copy; 2026
        </div>
      </div>
    </aside>
  );
}
