import React, { useState } from "react";
import { Truck, User, Phone, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { MobileStickyFooter } from "../../app/components/mobile/MobileStickyFooter";

interface VehicleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    vehicleType: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
  }) => Promise<void>;
  initialData?: {
    vehicleType?: string | null;
    vehicleNumber?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
  };
  actionTitle?: string;
}

const VEHICLE_TYPES = ["Tipper", "Dumper", "Tractor", "Pickup", "Truck", "Other"];

export const VehicleAssignmentModal: React.FC<VehicleAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  actionTitle = "Assign Vehicle & Transport"
}) => {
  if (!isOpen) return null;

  const [vehicleType, setVehicleType] = useState(initialData?.vehicleType || "Tipper");
  const [vehicleNumber, setVehicleNumber] = useState(initialData?.vehicleNumber || "");
  const [driverName, setDriverName] = useState(initialData?.driverName || "");
  const [driverPhone, setDriverPhone] = useState(initialData?.driverPhone || "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!vehicleNumber.trim()) {
      errs.vehicleNumber = "Vehicle registration number is required";
    }

    if (!driverName.trim()) {
      errs.driverName = "Driver name is required";
    }

    if (!driverPhone.trim()) {
      errs.driverPhone = "Driver phone number is required";
    } else if (driverPhone.trim().replace(/\D/g, "").length < 10) {
      errs.driverPhone = "Enter a valid 10-digit phone number";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim()
      });
      onClose();
    } catch (err) {
      // Error handling passed up
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-950/40 p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
              <Truck size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {actionTitle}
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                Logistics & Driver Assignment for Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form id="vehicle-form" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 flex-1">
          {/* Transport / Vehicle Type */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Transport Type *
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#F97316] focus:outline-none cursor-pointer"
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Registration Number */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Vehicle Registration Number *
            </label>
            <div className="relative">
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => {
                  setVehicleNumber(e.target.value.toUpperCase());
                  if (errors.vehicleNumber) setErrors({ ...errors, vehicleNumber: "" });
                }}
                placeholder="e.g. OD02AB1234 or MH12PQ9999"
                className={`min-h-[44px] w-full rounded-xl border px-3 text-xs font-bold tracking-wider uppercase focus:outline-none ${
                  errors.vehicleNumber
                    ? "border-red-500 bg-red-50/20 text-red-900 focus:border-red-500"
                    : "border-slate-200 bg-white text-slate-900 focus:border-[#F97316]"
                }`}
              />
            </div>
            {errors.vehicleNumber && (
              <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                <ShieldAlert size={12} />
                <span>{errors.vehicleNumber}</span>
              </p>
            )}
          </div>

          {/* Driver Name */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Driver Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={driverName}
                onChange={(e) => {
                  setDriverName(e.target.value);
                  if (errors.driverName) setErrors({ ...errors, driverName: "" });
                }}
                placeholder="e.g. Rajesh Kumar"
                className={`min-h-[44px] w-full rounded-xl border px-3 text-xs font-bold focus:outline-none ${
                  errors.driverName
                    ? "border-red-500 bg-red-50/20 text-red-900 focus:border-red-500"
                    : "border-slate-200 bg-white text-slate-900 focus:border-[#F97316]"
                }`}
              />
            </div>
            {errors.driverName && (
              <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                <ShieldAlert size={12} />
                <span>{errors.driverName}</span>
              </p>
            )}
          </div>

          {/* Driver Phone Number */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Driver Phone Number *
            </label>
            <div className="relative">
              <input
                type="tel"
                inputMode="tel"
                value={driverPhone}
                onChange={(e) => {
                  setDriverPhone(e.target.value);
                  if (errors.driverPhone) setErrors({ ...errors, driverPhone: "" });
                }}
                placeholder="e.g. 9876543210"
                className={`min-h-[44px] w-full rounded-xl border px-3 text-xs font-bold focus:outline-none ${
                  errors.driverPhone
                    ? "border-red-500 bg-red-50/20 text-red-900 focus:border-red-500"
                    : "border-slate-200 bg-white text-slate-900 focus:border-[#F97316]"
                }`}
              />
            </div>
            {errors.driverPhone && (
              <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                <ShieldAlert size={12} />
                <span>{errors.driverPhone}</span>
              </p>
            )}
          </div>
        </form>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="vehicle-form"
            disabled={submitting}
            className="min-h-[44px] flex-[2] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>{submitting ? "Assigning..." : "Assign Vehicle & Proceed"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
