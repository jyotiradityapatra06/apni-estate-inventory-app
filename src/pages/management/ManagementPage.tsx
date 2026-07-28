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
  const [bState, setBState] = useState("");
  const [bStateCode, setBStateCode] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bAddress, setBAddress] = useState("");
  const [bPrefix, setBPrefix] = useState(localStorage.getItem("invoice_prefix") || "INV-");
  const [bNext, setBNext] = useState(localStorage.getItem("invoice_next") || "1001");
  const [bFy, setBFy] = useState(localStorage.getItem("fy_active") || "FY 2026 - 2027");
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
    if (bStateCode && !/^[0-9]{2}$/.test(bStateCode)) {
      toast.error("GST State Code must be exactly 2 numeric digits (e.g., 27).");
      return;
    }
    setEditLoading(true);
    try {
      await businessApi.updateBusiness({
        name: bName,
        gstNumber: bGst,
        state: bState,
        stateCode: bStateCode,
        phone: bPhone,
        address: bAddress,
      });
      localStorage.setItem("invoice_prefix", bPrefix);
      localStorage.setItem("invoice_next", bNext);
      localStorage.setItem("fy_active", bFy);
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
    <div className="flex flex-col gap-6 pb-8 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-[34px] font-bold text-foreground tracking-tight">
            Management & Settings
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            Configure your business profile, invoice formats, financial settings, and staff credentials.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 cursor-pointer text-sm font-semibold hover:bg-red-100/60 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {/* Tab Controls */}
        {canManageTeam && (
          <div className="flex gap-2 border-b border-border pb-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer rounded-t-xl ${
                activeTab === "profile"
                  ? "border-b-2 border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50/40 dark:bg-orange-950/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Business & Account Profile
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer rounded-t-xl ${
                activeTab === "team"
                  ? "border-b-2 border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50/40 dark:bg-orange-950/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Team Directory
            </button>
          </div>
        )}

        {/* Render Tab Content */}
        {activeTab === "profile" || !canManageTeam ? (
          <div className="space-y-6 w-full">
            {/* Header info card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{initials}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{user?.name || "Owner User"}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{user?.role} · {user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Connected Business</span>
                  <div className="text-sm font-bold text-foreground truncate max-w-[220px]">{business?.name || "Shri Krishna Traders"}</div>
                </div>
                {canEditBusiness && (
                  <button
                    onClick={() => navigate("/management/business-profile")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-sm transition-colors cursor-pointer"
                  >
                    Manage Profile
                  </button>
                )}
              </div>
            </div>

            {/* 2-Column Responsive Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Business Profile Details Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-foreground">Business Information</h2>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">Physical operating and GST tax details.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground mb-1">Business Name</span>
                    <span className="text-sm font-bold text-foreground">{business?.name || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground mb-1">GST Registration No.</span>
                    <span className="text-sm font-bold text-foreground font-mono">{business?.gstNumber || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground mb-1">GST State / State Code</span>
                    <span className="text-sm font-bold text-foreground">
                      {business?.state || "Unspecified"} {business?.stateCode ? `(${business.stateCode})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground mb-1">Business Contact Phone</span>
                    <span className="text-sm font-bold text-foreground">{business?.phone || "Not Provided"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-medium text-muted-foreground mb-1">Operating Address</span>
                    <span className="text-sm font-bold text-foreground leading-relaxed">{business?.address || "Not Provided"}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 grid grid-cols-2 gap-5">
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground mb-1">Invoice Prefix & Start No.</span>
                    <span className="text-sm font-bold text-foreground">{localStorage.getItem("invoice_prefix") || "INV-"} (Next: {localStorage.getItem("invoice_next") || "1001"})</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground mb-1">Active Financial Year</span>
                    <span className="text-sm font-bold text-foreground">{localStorage.getItem("fy_active") || "FY 2026 - 2027"}</span>
                  </div>
                </div>
              </div>

              {/* Personal Account & Security Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                <div className="border-b border-border pb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">Account & Access Settings</h2>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">System credentials and assigned staff role.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/60">
                    <span className="text-xs font-medium text-muted-foreground">User ID</span>
                    <span className="text-sm font-bold text-foreground font-mono">{user?.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/60">
                    <span className="text-xs font-medium text-muted-foreground">Staff Member Name</span>
                    <span className="text-sm font-bold text-foreground">{user?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/60">
                    <span className="text-xs font-medium text-muted-foreground">Email Address</span>
                    <span className="text-sm font-bold text-foreground">{user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-medium text-muted-foreground">Assigned Role</span>
                    <span className="font-bold uppercase tracking-wider text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4">APNI ESTATE ERP v3.1.4 · Enterprise Build</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 flex flex-col gap-5 rounded-2xl bg-card border border-border shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold text-foreground">Edit Business Profile</h3>
              <button onClick={() => setShowEditBusiness(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleEditBusinessSubmit} className="flex flex-col gap-4 text-xs font-medium">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shri Krishna Traders"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GSTIN (Registration No.)</label>
                <input
                  type="text"
                  placeholder="e.g. 27AABFR5987M1ZP"
                  value={bGst}
                  onChange={(e) => setBGst(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 w-2/3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">State Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={bState}
                    onChange={(e) => setBState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-1/3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">State Code</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="e.g. 27"
                    value={bStateCode}
                    onChange={(e) => setBStateCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 00001"
                  value={bPhone}
                  onChange={(e) => setBPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Office Address</label>
                <textarea
                  placeholder="e.g. Plot 14, Bhosari MIDC, Pune 411026"
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none h-18"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice Settings (Prefix & Start No.)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="e.g. INV-"
                    value={bPrefix}
                    onChange={(e) => setBPrefix(e.target.value)}
                    className="w-1/2 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="e.g. 1001"
                    value={bNext}
                    onChange={(e) => setBNext(e.target.value)}
                    className="w-1/2 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Year</label>
                <select
                  value={bFy}
                  onChange={(e) => setBFy(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option>FY 2025 - 2026</option>
                  <option>FY 2026 - 2027</option>
                  <option>FY 2027 - 2028</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="w-full mt-2 h-11 rounded-xl bg-orange-500 text-white font-bold text-sm cursor-pointer hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm"
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

