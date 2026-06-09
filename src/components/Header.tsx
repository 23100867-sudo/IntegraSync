import React, { useState, useEffect } from "react";
import { User } from "../types";
import { 
  Bell, 
  Clock, 
  HelpCircle, 
  ShieldAlert,
  Server
} from "lucide-react";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time beautifully in UTC/Local format
  const formattedTime = time.toLocaleTimeString("en-US", { hour12: true });
  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <header id="ipfms-header" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
      {/* LEFT SECTION (PORTAL TITLE CARD) */}
      <div className="flex items-center space-x-3">
        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider font-mono">
          RAB No. 1
        </span>
        <h2 className="text-sm font-semibold text-slate-800 tracking-tight hidden md:inline-block">
          HSAC Integrated Personnel & Financial Management Portal
        </h2>
      </div>

      {/* RIGHT SECTION (SYSTEM METADATA & PROFILE) */}
      <div className="flex items-center space-x-5">
        {/* GMT TIME AND DATA CLOCK CONTAINER */}
        <div className="flex items-center space-x-2 text-slate-500 font-mono text-xs border border-slate-200 px-3 py-1 bg-slate-50 rounded-lg">
          <Clock size={13} className="text-slate-400" />
          <span className="font-semibold text-slate-700">{formattedTime}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 text-[11px]">{formattedDate}</span>
        </div>

        {/* DATA PRIVACY SECURITY FLAGGER */}
        <div className="flex items-center text-[10px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
          <Server size={11} className="mr-1 text-emerald-500 animate-pulse" />
          <span>RA 10173 SECURE</span>
        </div>

        {/* UTILITY NOTIFIER */}
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
          <button 
            id="btn-help-dialog" 
            title="System Documentation Guidelines"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => alert("HSAC RAB 1 IPFMS Guide:\n\n- Manage Employee Profiles and Personal Data Sheets (PDS)\n- Log expenditure receipts and attach digital liquidation scopes\n- Monitor accountability indexes and supply quotas\n- File and approve leaves, service queries, and Zoom licenses\n- Audit actions via administrative telemetry log structures.")}
          >
            <HelpCircle size={18} />
          </button>
          
          <button 
            id="btn-alert-notif" 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg relative transition-colors"
            onClick={() => alert("System Notice: All digital filings must contain authorized support vouchers in PDF formats to satisfy Commission Internal Audit Regulations.")}
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border border-white"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
