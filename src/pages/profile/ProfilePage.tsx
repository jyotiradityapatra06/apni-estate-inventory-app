import { useState } from "react";
import {
  Building2, FileText, IndianRupee, Star, Warehouse, Users, Shield,
  CheckCircle, Clock, Settings, RefreshCw, Download, Bell, Eye, Share2,
  HelpCircle, LogOut, ChevronRight, AlertTriangle
} from "lucide-react";

import { C } from "../../constants/colors";
import { Badge } from "../../app/components/common/Badge";
import { SectionLabel } from "../../app/components/common/SectionLabel";
import { Divider } from "../../app/components/common/Divider";

export const ProfilePage = () => {
  const [showDeactivate, setShowDeactivate] = useState(false);

  const sections = [
    {
      title: "BUSINESS",
      items: [
        { icon: Building2, label: "Business Profile", sub: "Shri Krishna Traders" },
        { icon: FileText, label: "Invoice Configuration", sub: "Letterhead, serial, terms" },
        { icon: IndianRupee, label: "Tax Settings", sub: "GSTIN, HSN codes, GST rates" },
        { icon: Star, label: "Payment Methods", sub: "UPI, NEFT, Cheque, Cash" },
        { icon: Warehouse, label: "Warehouses & Locations", sub: "Godown A, Main Yard, Godown B" },
      ],
    },
    {
      title: "TEAM",
      items: [
        { icon: Users, label: "Staff Directory", sub: "12 active members" },
        { icon: Shield, label: "Roles & Permissions", sub: "Owner, Accountant, Warehouse, Dispatch" },
        { icon: CheckCircle, label: "Approval Limits", sub: "Invoice: ₹5L · Payment: ₹2L" },
        { icon: Clock, label: "Pending Access Requests", sub: "2 pending", badge: "2" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { icon: Settings, label: "Device & Session", sub: "2 active sessions" },
        { icon: RefreshCw, label: "Sync History", sub: "Last synced 2 min ago" },
        { icon: Download, label: "Backup Status", sub: "Auto-backup ON · Daily 2 AM" },
        { icon: Bell, label: "Notification Preferences", sub: "Collections, Stock, Deliveries" },
        { icon: Eye, label: "Language", sub: "English (Marathi coming soon)" },
        { icon: Shield, label: "Security & Authentication", sub: "PIN + Biometric enabled" },
        { icon: Share2, label: "Data Export", sub: "Excel, PDF, Tally-compatible" },
        { icon: HelpCircle, label: "Help & Support", sub: "Chat, call, knowledge base" },
      ],
    },
  ];

  const [activeSection, setActiveSection] = useState("BUSINESS");

  return (
    <div className="flex flex-col gap-0 pb-4">
      {/* Mobile Profile Header - Hidden on md/lg desktop */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-6 md:hidden">
        <div className="flex items-center gap-4">
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 999 }} className="w-14 h-14 flex items-center justify-center">
            <span className="text-white text-xl font-bold">RK</span>
          </div>
          <div>
            <div className="text-white text-base font-bold">Ramesh Kumar</div>
            <div className="text-white/60 text-xs">Owner · Admin</div>
            <div className="text-white/50 text-[11px] mt-0.5">+91 98765 00001</div>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10 }} className="mt-4 px-4 py-3">
          <div className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Business</div>
          <div className="text-white text-[13px] font-semibold">Shri Krishna Traders</div>
          <div className="text-white/60 text-[11px]">GSTIN: 27AABFR5987M1ZP</div>
          <div className="text-white/50 text-[11px]">Plot 14, Bhosari MIDC, Pune 411026</div>
        </div>
      </div>

      {/* Desktop Profile Header */}
      <div className="hidden md:flex items-center justify-between bg-white border border-[rgba(20,18,14,0.1)] rounded-xl p-6 mb-4">
        <div className="flex items-center gap-4">
          <div style={{ background: "rgba(42,76,214,0.1)" }} className="w-14 h-14 rounded-full flex items-center justify-center">
            <span style={{ color: C.blue }} className="text-xl font-bold">RK</span>
          </div>
          <div>
            <h2 style={{ color: C.ink }} className="text-base font-bold">Ramesh Kumar</h2>
            <div style={{ color: C.muted }} className="text-xs">Owner · Admin · +91 98765 00001</div>
          </div>
        </div>
        <div className="text-right border-l border-[rgba(20,18,14,0.1)] pl-6">
          <div style={{ color: C.ink }} className="text-sm font-semibold">Shri Krishna Traders</div>
          <div style={{ color: C.muted }} className="text-xs">GSTIN: 27AABFR5987M1ZP</div>
        </div>
      </div>

      {/* Subscription status */}
      <div className="px-1 md:px-0 py-3">
        <div style={{ background: "#ECFDF5", border: `1px solid ${C.success}30`, borderRadius: 12 }} className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} color={C.success} />
            <div>
              <div style={{ color: "#065F46" }} className="text-xs font-bold">Pro Plan · Active</div>
              <div style={{ color: "#6EE7B7" }} className="text-[10px]">Renews 10 Jan 2026</div>
            </div>
          </div>
          <button style={{ background: C.success }} className="px-3 py-1 rounded-lg text-white text-[11px] font-semibold cursor-pointer">Manage</button>
        </div>
      </div>

      {/* Settings Layout container */}
      <div className="px-1 md:px-0">
        {/* Mobile Settings List (Stacked) */}
        <div className="flex flex-col gap-4 lg:hidden">
          {sections.map(section => (
            <div key={section.title}>
              <SectionLabel>{section.title}</SectionLabel>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }}>
                {section.items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      {i > 0 && <Divider />}
                      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer animate-none">
                        <div style={{ background: C.surface }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon size={15} color={C.muted} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ color: C.ink }} className="text-[13px] font-medium">{item.label}</div>
                          <div style={{ color: C.muted }} className="text-[11px]">{item.sub}</div>
                        </div>
                        {item.badge && (
                          <span style={{ background: C.error }} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight size={14} color={C.muted} className="flex-shrink-0" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Danger zone (Mobile) */}
          <div>
            <SectionLabel>ACCOUNT</SectionLabel>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }}>
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer animate-none"
                onClick={() => setShowDeactivate(true)}
              >
                <div style={{ background: "#FEF2F2" }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <Users size={15} color={C.error} />
                </div>
                <div className="flex-1">
                  <div style={{ color: C.error }} className="text-[13px] font-medium text-left font-semibold">Deactivate User</div>
                  <div style={{ color: C.muted }} className="text-[11px] text-left">Remove access for a staff member</div>
                </div>
                <ChevronRight size={14} color={C.muted} />
              </button>
              <Divider />
              <button className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer animate-none">
                <div style={{ background: "#FEF2F2" }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <LogOut size={15} color={C.error} />
                </div>
                <div className="flex-1 text-left">
                  <div style={{ color: C.error }} className="text-[13px] font-medium font-semibold">Sign Out</div>
                  <div style={{ color: C.muted }} className="text-[11px]">This device only</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Split View Settings Layout */}
        <div className="hidden lg:grid grid-cols-12 gap-6">
          {/* Left pane vertical tab selectors */}
          <div className="col-span-4 flex flex-col gap-1">
            <SectionLabel>SETTINGS INDEX</SectionLabel>
            {["BUSINESS", "TEAM", "SYSTEM", "ACCOUNT"].map(s => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                style={{
                  background: activeSection === s ? "rgba(42,76,214,0.08)" : "transparent",
                  color: activeSection === s ? C.blue : C.ink,
                }}
                className="w-full text-left px-4 py-3 rounded-lg text-xs font-semibold hover:bg-black/5 cursor-pointer transition-all flex items-center justify-between"
              >
                <span>{s}</span>
                <ChevronRight size={14} style={{ opacity: activeSection === s ? 1 : 0.3 }} />
              </button>
            ))}
          </div>

          {/* Right pane settings details list */}
          <div className="col-span-8">
            <SectionLabel>{activeSection} DETAILS</SectionLabel>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }}>
              {activeSection !== "ACCOUNT" ? (
                sections
                  .find(sec => sec.title === activeSection)
                  ?.items.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label}>
                        {i > 0 && <Divider />}
                        <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-black/5 animate-none">
                          <div style={{ background: C.surface }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon size={15} color={C.muted} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div style={{ color: C.ink }} className="text-[13px] font-medium">{item.label}</div>
                            <div style={{ color: C.muted }} className="text-[11px]">{item.sub}</div>
                          </div>
                          {item.badge && (
                            <span style={{ background: C.error }} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight size={14} color={C.muted} className="flex-shrink-0" />
                        </button>
                      </div>
                    );
                  })
              ) : (
                <div>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-black/5 animate-none"
                    onClick={() => setShowDeactivate(true)}
                  >
                    <div style={{ background: "#FEF2F2" }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <Users size={15} color={C.error} />
                    </div>
                    <div className="flex-1">
                      <div style={{ color: C.error }} className="text-[13px] font-medium text-left font-semibold">Deactivate User</div>
                      <div style={{ color: C.muted }} className="text-[11px] text-left font-normal">Remove access for a staff member</div>
                    </div>
                    <ChevronRight size={14} color={C.muted} />
                  </button>
                  <Divider />
                  <button className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-black/5 animate-none">
                    <div style={{ background: "#FEF2F2" }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <LogOut size={15} color={C.error} />
                    </div>
                    <div className="flex-1 text-left">
                      <div style={{ color: C.error }} className="text-[13px] font-medium font-semibold">Sign Out</div>
                      <div style={{ color: C.muted }} className="text-[11px] font-normal">This device only</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ color: C.muted }} className="text-center text-[11px] mt-6 pb-2">Apni Estate v2.4.1 · Build 20250710</div>
      </div>

      {/* Deactivate dialog */}
      {showDeactivate && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: C.white, borderRadius: 16 }} className="w-full p-5">
            <div style={{ background: "#FEF2F2" }} className="w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle size={22} color={C.error} />
            </div>
            <div style={{ color: C.ink }} className="text-base font-bold mb-1">Deactivate User?</div>
            <p style={{ color: C.muted }} className="text-sm mb-4">This will immediately revoke access for Suresh Patil (Warehouse). This action will appear in the audit log.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeactivate(false)} style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }} className="py-3 rounded-xl text-sm font-semibold cursor-pointer">
                <span style={{ color: C.ink }}>Cancel</span>
              </button>
              <button onClick={() => setShowDeactivate(false)} style={{ background: C.error, flex: 1 }} className="py-3 rounded-xl text-white text-sm font-semibold cursor-pointer">
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;
