import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Building2, Users, LogOut, ChevronRight } from "lucide-react";

import { C } from "../../constants/colors";
import { SectionLabel } from "../../app/components/common/SectionLabel";
import { Divider } from "../../app/components/common/Divider";

import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import { businessApi } from "../../api/business.api";

export const ProfilePage = () => {
  const [showEditBusiness, setShowEditBusiness] = useState(false);
  const navigate = useNavigate();
  const { user, business, logout, refreshSession } = useAuth();

  const [bName, setBName] = useState("");
  const [bGst, setBGst] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bAddress, setBAddress] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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
      toast.success("Business profile updated");
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
    <div className="flex flex-col gap-0 pb-4">
      {/* Mobile Profile Header - Hidden on md/lg desktop */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-6 md:hidden">
        <div className="flex items-center gap-4">
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 999 }} className="w-14 h-14 flex items-center justify-center">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div>
            <div className="text-white text-base font-bold">{user?.name || "Ramesh Kumar"}</div>
            <div className="text-white/60 text-xs">{user?.role || "Owner"}</div>
            <div className="text-white/50 text-[11px] mt-0.5">{business?.phone || ""}</div>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10 }} className="mt-4 px-4 py-3">
          <div className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Business</div>
          <div className="text-white text-[13px] font-semibold">{business?.name || "Shri Krishna Traders"}</div>
          {business?.gstNumber && <div className="text-white/60 text-[11px]">GSTIN: {business.gstNumber}</div>}
          {business?.address && <div className="text-white/50 text-[11px]">{business.address}</div>}
        </div>
      </div>

      {/* Desktop Profile Header */}
      <div className="hidden md:flex items-center justify-between bg-white border border-[rgba(20,18,14,0.1)] rounded-xl p-6 mb-4">
        <div className="flex items-center gap-4">
          <div style={{ background: "rgba(42,76,214,0.1)" }} className="w-14 h-14 rounded-full flex items-center justify-center">
            <span style={{ color: C.blue }} className="text-xl font-bold">{initials}</span>
          </div>
          <div>
            <h2 style={{ color: C.ink }} className="text-base font-bold">{user?.name || "Ramesh Kumar"}</h2>
            <div style={{ color: C.muted }} className="text-xs">{user?.role || "Owner"} · {business?.phone || ""}</div>
          </div>
        </div>
        <div className="text-right border-l border-[rgba(20,18,14,0.1)] pl-6">
          <div style={{ color: C.ink }} className="text-sm font-semibold">{business?.name || "Shri Krishna Traders"}</div>
          {business?.gstNumber && <div style={{ color: C.muted }} className="text-xs">GSTIN: {business.gstNumber}</div>}
        </div>
      </div>

      {/* Settings Layout container */}
      <div className="px-1 md:px-0 flex flex-col gap-4">
        {/* Business Settings */}
        <div>
          <SectionLabel>BUSINESS PROFILE</SectionLabel>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }}>
            <button
              onClick={() => {
                setBName(business?.name || "");
                setBGst(business?.gstNumber || "");
                setBPhone(business?.phone || "");
                setBAddress(business?.address || "");
                setShowEditBusiness(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors"
            >
              <div style={{ background: C.surface }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 size={15} color={C.muted} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: C.ink }} className="text-[13px] font-semibold">Business Profile</div>
                <div style={{ color: C.muted }} className="text-[11px]">{business?.name || "Click to configure profile"}</div>
              </div>
              <ChevronRight size={14} color={C.muted} className="flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Team Settings */}
        <div>
          <SectionLabel>TEAM</SectionLabel>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }}>
            <button
              onClick={() => navigate("/team")}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors"
            >
              <div style={{ background: C.surface }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users size={15} color={C.muted} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: C.ink }} className="text-[13px] font-semibold">Staff & Driver Directory</div>
                <div style={{ color: C.muted }} className="text-[11px]">Manage team members, roles and permissions</div>
              </div>
              <ChevronRight size={14} color={C.muted} className="flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Account & Profile (Read-only Info) */}
        <div>
          <SectionLabel>ACCOUNT INFORMATION</SectionLabel>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }} className="p-4 flex flex-col gap-3">
            <div className="flex justify-between text-xs">
              <span style={{ color: C.muted }}>User Name</span>
              <span style={{ color: C.ink }} className="font-bold">{user?.name}</span>
            </div>
            <Divider />
            <div className="flex justify-between text-xs">
              <span style={{ color: C.muted }}>Email Address</span>
              <span style={{ color: C.ink }} className="font-bold">{user?.email}</span>
            </div>
            <Divider />
            <div className="flex justify-between text-xs">
              <span style={{ color: C.muted }}>System Role</span>
              <span style={{ color: C.blue }} className="font-bold uppercase tracking-wider text-[10px] bg-blue-50 px-2 py-0.5 rounded">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Action */}
        <div className="mt-2">
          <button
            onClick={handleLogout}
            style={{ border: `1px solid ${C.error}30`, background: "#FEF2F2" }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl cursor-pointer hover:bg-red-100/50 active:scale-[0.99] transition-all"
          >
            <LogOut size={16} color={C.error} />
            <span style={{ color: C.error }} className="text-[13px] font-bold">Sign Out from Device</span>
          </button>
        </div>

        <div style={{ color: C.muted }} className="text-center text-[11px] mt-6 pb-2">Apni Estate v2.4.1 · Build 20250710</div>
      </div>

      {/* Edit Business Profile Dialog */}
      {showEditBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" style={{ zIndex: 100 }}>
          <div style={{ background: C.white, borderRadius: 16 }} className="w-full max-w-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span style={{ color: C.ink }} className="text-base font-bold">Edit Business Profile</span>
              <button onClick={() => setShowEditBusiness(false)} className="text-gray-500 hover:text-gray-700 text-lg font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleEditBusinessSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase font-semibold">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shri Krishna Traders"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase font-semibold">GSTIN</label>
                <input
                  type="text"
                  placeholder="e.g. 27AABFR5987M1ZP"
                  value={bGst}
                  onChange={(e) => setBGst(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase font-semibold">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 00001"
                  value={bPhone}
                  onChange={(e) => setBPhone(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase font-semibold">Address</label>
                <textarea
                  placeholder="e.g. Plot 14, Bhosari MIDC, Pune"
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-16"
                />
              </div>
              <button
                type="submit"
                disabled={editLoading}
                style={{ background: C.blue }}
                className="w-full mt-2 py-3 rounded-xl text-white font-bold cursor-pointer disabled:opacity-50 hover:opacity-95 transition-all"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;
