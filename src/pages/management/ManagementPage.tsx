import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Building2, Users, LogOut, ChevronRight, User, Settings } from "lucide-react";
import { toast } from "sonner";

import { C } from "../../constants/colors";
import { SectionLabel } from "../../app/components/common/SectionLabel";
import { Divider } from "../../app/components/common/Divider";
import { Card } from "../../app/components/common/Card";

import { useAuth } from "../../hooks/useAuth";
import { businessApi } from "../../api/business.api";
import { hasPermission } from "../../utils/permissions";
import { TeamPage } from "../team/TeamPage";

export const ManagementPage = () => {
  const navigate = useNavigate();
  const { user, business, logout, refreshSession } = useAuth();
  
  const canManageTeam = hasPermission(user, "team:manage");
  const canEditBusiness = hasPermission(user, "business:manage");

  // Tab State
  const [activeTab, setActiveTab] = useState<"profile" | "team">("profile");

  // Edit Business Profile Modal State
  const [showEditBusiness, setShowEditBusiness] = useState(false);
  const [bName, setBName] = useState("");
  const [bGst, setBGst] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bAddress, setBAddress] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (showEditBusiness) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showEditBusiness]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEditBusiness(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const handleEditBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await businessApi.updateBusiness({
        name: bName,
        gstNumber: bGst,
        phone: bPhone,
        address: bAddress,
      });
      await refreshSession();
      toast.success("Business profile updated successfully");
      setShowEditBusiness(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update business profile");
    } finally {
      setEditLoading(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "RK";

  return (
    <div className="flex flex-col gap-0 pb-4 min-h-screen">
      {/* Mobile Page Header */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/60 text-[11px] uppercase tracking-wider font-semibold">Settings</div>
            <div className="text-white text-lg font-bold">Management</div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ background: "rgba(255,255,255,0.2)" }}
            className="p-2 rounded-lg text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="px-1 md:px-0 py-4 flex flex-col gap-4 flex-1">
        {/* Desktop Toolbar */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-2">
          <div>
            <h1 style={{ color: C.ink }} className="text-lg font-bold">Business Management</h1>
            <p style={{ color: C.muted }} className="text-xs">Configure your business profile, staff members, and personal credentials.</p>
          </div>
          <button
            onClick={handleLogout}
            style={{ border: `1.5px solid ${C.error}30`, color: C.error }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg cursor-pointer text-xs font-semibold hover:bg-red-50"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>

        {/* Tab Controls */}
        {canManageTeam && (
          <div className="flex gap-2 border-b border-[rgba(20,18,14,0.06)] pb-2 mb-2">
            <button
              onClick={() => setActiveTab("profile")}
              style={{
                color: activeTab === "profile" ? C.blue : C.muted,
                borderBottom: activeTab === "profile" ? `2.5px solid ${C.blue}` : "none",
                fontWeight: activeTab === "profile" ? 700 : 500
              }}
              className="px-4 py-2 text-xs md:text-sm transition-all cursor-pointer rounded-t-lg hover:bg-black/[0.01]"
            >
              Profile & Account
            </button>
            <button
              onClick={() => setActiveTab("team")}
              style={{
                color: activeTab === "team" ? C.blue : C.muted,
                borderBottom: activeTab === "team" ? `2.5px solid ${C.blue}` : "none",
                fontWeight: activeTab === "team" ? 700 : 500
              }}
              className="px-4 py-2 text-xs md:text-sm transition-all cursor-pointer rounded-t-lg hover:bg-black/[0.01]"
            >
              Team Directory
            </button>
          </div>
        )}

        {/* Render Tab Content */}
        {activeTab === "profile" || !canManageTeam ? (
          <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
            {/* Header info */}
            <div className="flex items-center gap-4 bg-white border border-[rgba(20,18,14,0.1)] rounded-xl p-5 shadow-sm">
              <div style={{ background: "rgba(42,76,214,0.08)" }} className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0">
                <span style={{ color: C.blue }} className="text-lg font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 style={{ color: C.ink }} className="text-base font-bold truncate">{user?.name || "Ramesh Kumar"}</h3>
                <div style={{ color: C.muted }} className="text-xs mt-0.5">{user?.role} · {user?.email}</div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Business Unit</span>
                <div style={{ color: C.ink }} className="text-xs font-bold truncate max-w-[150px]">{business?.name || "Shri Krishna Traders"}</div>
              </div>
            </div>

            {/* Business Profile Details Card */}
            <div>
              <SectionLabel>Business Profile</SectionLabel>
              <Card className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 style={{ color: C.ink }} className="text-sm font-bold">{business?.name || "No Business Connected"}</h3>
                    <p style={{ color: C.muted }} className="text-[11px] mt-0.5">Physical and trade identification details.</p>
                  </div>
                  {canEditBusiness && (
                    <button
                      onClick={() => {
                        setBName(business?.name || "");
                        setBGst(business?.gstNumber || "");
                        setBPhone(business?.phone || "");
                        setBAddress(business?.address || "");
                        setShowEditBusiness(true);
                      }}
                      style={{ color: C.blue, border: `1.5px solid ${C.blue}20` }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                <Divider />

                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <span style={{ color: C.muted }} className="block text-[10px] uppercase font-semibold mb-0.5">GST Registration</span>
                    <span style={{ color: C.ink }} className="font-bold">{business?.gstNumber || "Not Provided"}</span>
                  </div>
                  <div>
                    <span style={{ color: C.muted }} className="block text-[10px] uppercase font-semibold mb-0.5">Business Contact</span>
                    <span style={{ color: C.ink }} className="font-bold">{business?.phone || "Not Provided"}</span>
                  </div>
                  <div className="col-span-2">
                    <span style={{ color: C.muted }} className="block text-[10px] uppercase font-semibold mb-0.5">Operating Address</span>
                    <span style={{ color: C.ink }} className="font-bold">{business?.address || "Not Provided"}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Account Details */}
            <div>
              <SectionLabel>Account Settings</SectionLabel>
              <Card className="p-5 flex flex-col gap-3 text-xs font-medium">
                <div className="flex justify-between py-1">
                  <span style={{ color: C.muted }}>User Identifier</span>
                  <span style={{ color: C.ink }} className="font-bold">{user?.id}</span>
                </div>
                <Divider />
                <div className="flex justify-between py-1">
                  <span style={{ color: C.muted }}>Staff Name</span>
                  <span style={{ color: C.ink }} className="font-bold">{user?.name}</span>
                </div>
                <Divider />
                <div className="flex justify-between py-1">
                  <span style={{ color: C.muted }}>Email Address</span>
                  <span style={{ color: C.ink }} className="font-bold">{user?.email}</span>
                </div>
                <Divider />
                <div className="flex justify-between py-1">
                  <span style={{ color: C.muted }}>System Permissions</span>
                  <span style={{ color: C.blue }} className="font-bold uppercase tracking-wider text-[10px] bg-blue-50 px-2 py-0.5 rounded">
                    {user?.role}
                  </span>
                </div>
              </Card>
            </div>

            {/* Mobile Sign Out Button */}
            <div className="md:hidden mt-2">
              <button
                onClick={handleLogout}
                style={{ border: `1.5px solid ${C.error}30`, background: "#FEF2F2" }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer hover:bg-red-100/50"
              >
                <LogOut size={16} color={C.error} />
                <span style={{ color: C.error }} className="text-xs font-bold">Sign Out from Device</span>
              </button>
            </div>
            
            <div style={{ color: C.muted }} className="text-center text-[10px] mt-4">Apni Estate v2.5.0 · Clean Build</div>
          </div>
        ) : (
          <div className="w-full">
            {/* Embed active team directory directly */}
            <TeamPage />
          </div>
        )}
      </div>

      {/* Edit Business Profile Dialog */}
      {showEditBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" style={{ zIndex: 100 }}>
          <div style={{ background: C.white, borderRadius: 16 }} className="w-full max-w-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span style={{ color: C.ink }} className="text-base font-bold">Edit Business Profile</span>
              <button onClick={() => setShowEditBusiness(false)} className="text-gray-500 hover:text-gray-700 text-lg font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleEditBusinessSubmit} className="flex flex-col gap-3.5 text-xs font-medium">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shri Krishna Traders"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">GSTIN (Registration No.)</label>
                <input
                  type="text"
                  placeholder="e.g. 27AABFR5987M1ZP"
                  value={bGst}
                  onChange={(e) => setBGst(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Business Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 00001"
                  value={bPhone}
                  onChange={(e) => setBPhone(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Office Address</label>
                <textarea
                  placeholder="e.g. Plot 14, Bhosari MIDC, Pune 411026"
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-16"
                />
              </div>

              <button
                type="submit"
                disabled={editLoading}
                style={{ background: C.blue }}
                className="w-full mt-2 py-3 rounded-xl text-white font-bold cursor-pointer hover:opacity-95 disabled:opacity-50"
              >
                {editLoading ? "Saving Changes..." : "Save Business Profile"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ManagementPage;
