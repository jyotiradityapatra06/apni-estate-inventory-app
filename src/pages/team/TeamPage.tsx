import { useState, useEffect } from "react";
import { 
  Users, UserPlus, Search, Filter, Edit2, UserMinus, UserCheck, 
  Key, Trash2, Calendar, Clock, Mail, Phone, ShieldAlert, X, HelpCircle
} from "lucide-react";
import { C } from "../../constants/colors";
import { Card } from "../../app/components/common/Card";
import { Badge } from "../../app/components/common/Badge";
import { Divider } from "../../app/components/common/Divider";
import { StatChip } from "../../app/components/common/StatChip";
import { useAuth } from "../../hooks/useAuth";
import { teamApi, Worker } from "../../api/team.api";
import { toast } from "sonner";

export const TeamPage = () => {
  const { business } = useAuth();
  const seatLimit = business?.workerSeatLimit || 5;

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<"MANAGER" | "STAFF" | "DRIVER">("STAFF");
  const [formPassword, setFormPassword] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  // Password reset modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status toggle loading Map
  const [statusToggleLoading, setStatusToggleLoading] = useState<Record<string, boolean>>({});

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const response = await teamApi.getTeam({
        search,
        role: roleFilter,
        status: statusFilter,
      });
      if (response.success) {
        setWorkers(response.data.workers);
        setActiveCount(response.data.activeCount);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [search, roleFilter, statusFilter]);

  // Handle Add/Edit Open
  const openAddEditModal = (worker: Worker | null = null) => {
    setSelectedWorker(worker);
    if (worker) {
      setFormName(worker.name);
      setFormPhone(worker.phone || "");
      setFormEmail(worker.email);
      setFormRole(worker.role);
      setFormIsActive(worker.isActive);
      setFormPassword(""); // Password optional/ignored on edit
    } else {
      setFormName("");
      setFormPhone("");
      setFormEmail("");
      setFormRole("STAFF");
      setFormIsActive(true);
      setFormPassword("");
    }
    setShowAddEditModal(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formEmail || (!selectedWorker && !formPassword)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setFormLoading(true);
    try {
      if (selectedWorker) {
        // Edit Worker
        const response = await teamApi.updateWorker(selectedWorker.id, {
          name: formName,
          phone: formPhone,
          email: formEmail,
          role: formRole,
          isActive: formIsActive,
        });
        if (response.success) {
          toast.success("Worker details updated successfully.");
          setShowAddEditModal(false);
          fetchTeam();
        }
      } else {
        // Add Worker
        const response = await teamApi.createWorker({
          name: formName,
          phone: formPhone,
          email: formEmail,
          role: formRole,
          password: formPassword,
          isActive: formIsActive,
        });
        if (response.success) {
          toast.success("Worker added successfully.");
          setShowAddEditModal(false);
          fetchTeam();
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Operation failed.");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Status Toggle
  const handleStatusToggle = async (worker: Worker) => {
    const newStatus = !worker.isActive;
    
    setStatusToggleLoading(prev => ({ ...prev, [worker.id]: true }));
    try {
      const response = await teamApi.updateWorkerStatus(worker.id, newStatus);
      if (response.success) {
        toast.success(`Account for ${worker.name} has been ${newStatus ? "activated" : "deactivated"}.`);
        fetchTeam();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.");
    } finally {
      setStatusToggleLoading(prev => ({ ...prev, [worker.id]: false }));
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || !resetPassword) return;

    setResetLoading(true);
    try {
      const response = await teamApi.updateWorker(selectedWorker.id, {
        password: resetPassword,
      });
      if (response.success) {
        toast.success(`Password reset successfully for ${selectedWorker.name}.`);
        setShowResetModal(false);
        setResetPassword("");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  // Handle Delete Worker
  const handleDeleteWorker = async () => {
    if (!selectedWorker) return;

    setDeleteLoading(true);
    try {
      const response = await teamApi.deleteWorker(selectedWorker.id);
      if (response.success) {
        toast.success(`${selectedWorker.name} has been deleted from the system.`);
        setShowDeleteModal(false);
        fetchTeam();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete worker.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const managerCount = workers.filter(w => w.role === "MANAGER").length;
  const staffCount = workers.filter(w => w.role === "STAFF").length;
  const driverCount = workers.filter(w => w.role === "DRIVER").length;
  const activeWorkers = activeCount;
  const inactiveWorkers = workers.length - activeWorkers;
  const seatsRemaining = seatLimit - activeWorkers;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-6 select-none max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 style={{ color: C.ink }} className="text-xl font-bold flex items-center gap-2">
            <Users color={C.blue} size={24} />
            Team Management
          </h1>
          <p style={{ color: C.muted }} className="text-xs mt-1">
            Manage your managers, staff, and drivers and control seat allocation.
          </p>
        </div>
        <button
          onClick={() => openAddEditModal(null)}
          style={{ background: C.blue }}
          className="flex items-center justify-center gap-2 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-opacity-95 active:scale-95 transition-all cursor-pointer shadow-md"
        >
          <UserPlus size={16} />
          Add Team Member
        </button>
      </div>

      {/* Seat Warning Bar */}
      {seatsRemaining <= 1 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs font-semibold">
          <ShieldAlert size={16} className="text-amber-600 flex-shrink-0" />
          <span>
            {seatsRemaining === 0 
              ? "Worker seat limit reached! Deactivate existing workers before adding or activating new ones." 
              : "Warning: Only 1 seat remains under your current seat limit."}
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatChip 
          label="Active Seats Used" 
          value={`${activeWorkers} / ${seatLimit}`} 
          sub={`${seatsRemaining} remaining`} 
          trend={seatsRemaining <= 1 ? "down" : "up"} 
        />
        <StatChip 
          label="Total Workers" 
          value={String(workers.length)} 
          sub={`${activeWorkers} active · ${inactiveWorkers} inactive`} 
        />
        <StatChip 
          label="Managers & Staff" 
          value={`${managerCount} M · ${staffCount} S`} 
          sub="Operational personnel" 
        />
        <StatChip 
          label="Drivers Onboarded" 
          value={String(driverCount)} 
          sub="Logistics delivery team" 
        />
      </div>

      {/* Filters Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} style={{ color: C.muted }} className="absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ color: C.ink }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-slate-300 focus:bg-white transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex gap-2">
          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-xs outline-none cursor-pointer focus:bg-white focus:border-slate-300 transition-all font-semibold"
            >
              <option value="">All Roles</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
              <option value="DRIVER">Driver</option>
            </select>
            <Filter size={12} className="absolute right-3 top-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-xs outline-none cursor-pointer focus:bg-white focus:border-slate-300 transition-all font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <Filter size={12} className="absolute right-3 top-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </Card>

      {/* Directory Table / Card view */}
      {loading ? (
        <Card className="p-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          <span style={{ color: C.muted }} className="text-xs">Loading workers list...</span>
        </Card>
      ) : workers.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 border-dashed">
          <div className="p-3 bg-slate-100 rounded-full text-slate-400">
            <Users size={32} />
          </div>
          <div>
            <h3 style={{ color: C.ink }} className="text-sm font-bold">No workers found</h3>
            <p style={{ color: C.muted }} className="text-xs max-w-xs mt-1">
              {(search || roleFilter || statusFilter) 
                ? "Try clearing your search query or filters to show results."
                : "Get started by onboarding your first manager, staff, or driver."}
            </p>
            {(search || roleFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setStatusFilter("");
                }}
                style={{ color: C.blue }}
                className="text-xs font-semibold mt-3 hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block overflow-hidden border border-slate-200 shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Worker Profile</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Contact Detail</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {workers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Worker Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center">
                          {w.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: C.ink }} className="text-xs font-bold">{w.name}</div>
                          <div style={{ color: C.muted }} className="text-[10px] truncate max-w-[150px]">{w.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <Badge 
                        label={w.role} 
                        variant={w.role === "MANAGER" ? "warning" : w.role === "DRIVER" ? "info" : "default"} 
                      />
                    </td>

                    {/* Contact Detail */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-[10px]">
                        <span style={{ color: C.ink }} className="font-semibold">{w.phone || "N/A"}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <Badge 
                        label={w.isActive ? "ACTIVE" : "INACTIVE"} 
                        variant={w.isActive ? "success" : "neutral"} 
                      />
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(w.joiningDate)}
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDateTime(w.lastLogin)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Toggle */}
                        <button
                          onClick={() => handleStatusToggle(w)}
                          disabled={statusToggleLoading[w.id]}
                          title={w.isActive ? "Deactivate User" : "Activate User"}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer ${
                            w.isActive ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {w.isActive ? <UserMinus size={14} /> : <UserCheck size={14} />}
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setSelectedWorker(w);
                            setShowResetModal(true);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-600 transition-colors cursor-pointer"
                        >
                          <Key size={14} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openAddEditModal(w)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            setSelectedWorker(w);
                            setShowDeleteModal(true);
                          }}
                          title="Delete Account"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-3">
            {workers.map((w) => (
              <Card key={w.id} className="p-4 flex flex-col gap-3 border border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center">
                      {w.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: C.ink }} className="text-xs font-bold">{w.name}</div>
                      <div style={{ color: C.muted }} className="text-[10px] truncate max-w-[160px]">{w.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge 
                      label={w.role} 
                      variant={w.role === "MANAGER" ? "warning" : w.role === "DRIVER" ? "info" : "default"} 
                    />
                    <Badge 
                      label={w.isActive ? "ACTIVE" : "INACTIVE"} 
                      variant={w.isActive ? "success" : "neutral"} 
                    />
                  </div>
                </div>

                <Divider />

                <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 block uppercase">Phone Number</span>
                    <span style={{ color: C.ink }} className="font-semibold flex items-center gap-1 mt-0.5">
                      <Phone size={10} className="text-slate-400" />
                      {w.phone || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Joined Date</span>
                    <span style={{ color: C.ink }} className="font-semibold flex items-center gap-1 mt-0.5">
                      <Calendar size={10} className="text-slate-400" />
                      {formatDate(w.joiningDate)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block uppercase">Last Activity</span>
                    <span style={{ color: C.ink }} className="font-semibold flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-slate-400" />
                      {formatDateTime(w.lastLogin)}
                    </span>
                  </div>
                </div>

                <Divider />

                <div className="flex justify-end gap-2 bg-slate-50 -mx-4 -mb-4 p-2 rounded-b-xl border-t border-slate-100">
                  {/* Status Toggle */}
                  <button
                    onClick={() => handleStatusToggle(w)}
                    disabled={statusToggleLoading[w.id]}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all disabled:opacity-50 cursor-pointer ${
                      w.isActive 
                        ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50" 
                        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50"
                    }`}
                  >
                    {w.isActive ? (
                      <>
                        <UserMinus size={11} />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck size={11} />
                        Activate
                      </>
                    )}
                  </button>

                  {/* Reset Password */}
                  <button
                    onClick={() => {
                      setSelectedWorker(w);
                      setShowResetModal(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <Key size={11} className="text-slate-400" />
                    Reset Pin
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openAddEditModal(w)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <Edit2 size={11} className="text-slate-400" />
                    Edit
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      setSelectedWorker(w);
                      setShowDeleteModal(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100/50 transition-all cursor-pointer"
                  >
                    <Trash2 size={11} />
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Modal Overlay */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 style={{ color: C.ink }} className="text-sm font-bold flex items-center gap-2">
                <Users color={C.blue} size={18} />
                {selectedWorker ? "Edit Team Member" : "Add Team Member"}
              </h3>
              <button 
                onClick={() => setShowAddEditModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ color: C.ink }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white focus:border-slate-300 transition-all"
                />
              </div>

              {/* Contact Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  style={{ color: C.ink }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white focus:border-slate-300 transition-all"
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@apniestate.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  style={{ color: C.ink }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white focus:border-slate-300 transition-all"
                />
              </div>

              {/* Role Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">System Role *</label>
                <div className="relative">
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-2.5 text-xs outline-none cursor-pointer focus:bg-white focus:border-slate-300 transition-all"
                  >
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                    <option value="DRIVER">Driver</option>
                  </select>
                  <Filter size={12} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Password - Add only */}
              {!selectedWorker && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    style={{ color: C.ink }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white focus:border-slate-300 transition-all"
                  />
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span style={{ color: C.ink }} className="text-xs font-bold block">Account Status</span>
                  <span style={{ color: C.muted }} className="text-[10px]">Inactive accounts cannot log in or consume worker seats.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  style={{ background: formIsActive ? C.success : "#D1D5DB" }}
                  className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                >
                  <span
                    className={`${
                      formIsActive ? "translate-x-5" : "translate-x-0"
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{ background: C.blue }}
                  className="px-4 py-2 text-white text-xs font-semibold rounded-xl hover:bg-opacity-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {formLoading && <div className="w-3 h-3 rounded-full border-2 border-slate-200 border-t-transparent animate-spin" />}
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal Overlay */}
      {showResetModal && selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 style={{ color: C.ink }} className="text-sm font-bold flex items-center gap-2">
                <Key color={C.blue} size={16} />
                Reset Worker Password
              </h3>
              <button 
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePasswordReset} className="p-5 flex flex-col gap-4">
              <p style={{ color: C.muted }} className="text-xs">
                Enter a new temporary password for <strong>{selectedWorker.name}</strong>.
              </p>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  style={{ color: C.ink }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white focus:border-slate-300 transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{ background: C.blue }}
                  className="px-4 py-2 text-white text-xs font-semibold rounded-xl hover:bg-opacity-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {resetLoading && <div className="w-3 h-3 rounded-full border-2 border-slate-200 border-t-transparent animate-spin" />}
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteModal && selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 flex flex-col gap-4 text-center">
              <div className="mx-auto p-3 bg-red-50 text-red-600 rounded-full w-12 h-12 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              
              <div>
                <h3 style={{ color: C.ink }} className="text-sm font-bold">Delete Worker Profile?</h3>
                <p style={{ color: C.muted }} className="text-xs max-w-xs mx-auto mt-1.5">
                  Are you sure you want to delete <strong>{selectedWorker.name}</strong> from APNI ESTATE? This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWorker}
                  disabled={deleteLoading}
                  className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {deleteLoading && <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
                  Delete Worker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TeamPage;
