import { useState } from "react";
import { Filter, X, RotateCcw, Check, Calendar, SlidersHorizontal } from "lucide-react";

export interface ReportFilterDrawerProps {
  from: string;
  to: string;
  status: string;
  invoiceType: string;
  paymentMode: string;
  setFrom: (val: string) => void;
  setTo: (val: string) => void;
  setStatus: (val: string) => void;
  setInvoiceType: (val: string) => void;
  setPaymentMode: (val: string) => void;
  preset: (val: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function ReportFilterDrawer({
  from,
  to,
  status,
  invoiceType,
  paymentMode,
  setFrom,
  setTo,
  setStatus,
  setInvoiceType,
  setPaymentMode,
  preset,
  onApply,
  onReset,
}: ReportFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = [from, to, status, invoiceType, paymentMode].filter(Boolean).length;

  const handleApply = () => {
    onApply();
    setIsOpen(false);
  };

  const handleReset = () => {
    onReset();
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-border bg-card px-4 text-xs font-extrabold text-foreground shadow-xs hover:bg-muted dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-orange-600" />
          <span>Filters</span>
        </div>

        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 text-[10px] font-black text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-orange-600" />
                <h3 className="font-extrabold text-foreground text-sm tracking-tight dark:text-slate-100">
                  Report Filters
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-slate-200 dark:bg-slate-800 dark:text-muted-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Inputs Grid */}
            <div className="space-y-3.5 text-xs font-semibold">
              {/* Date Presets */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground block">Date Quick Preset</label>
                <select
                  aria-label="Date preset"
                  onChange={(e) => preset(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-border bg-card px-3 text-xs font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Custom Date Range</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="fy">Financial Year (Apr-Mar)</option>
                </select>
              </div>

              {/* From & To Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground block">From Date</label>
                  <input
                    aria-label="From date"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-border bg-card px-3 text-xs font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground block">To Date</label>
                  <input
                    aria-label="To date"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-border bg-card px-3 text-xs font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground block">Status Filter</label>
                <input
                  aria-label="Status filter"
                  value={status}
                  onChange={(e) => setStatus(e.target.value.toUpperCase())}
                  placeholder="e.g. PAID, PENDING, OVERDUE"
                  className="min-h-[44px] w-full rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-muted-foreground dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Invoice Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground block">Invoice Bill Type</label>
                <select
                  aria-label="Invoice type"
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">All Bill Types (GST & Non-GST)</option>
                  <option value="GST">GST Tax Invoice Only</option>
                  <option value="NON_GST">Non-GST Bill Only</option>
                </select>
              </div>

              {/* Payment Mode */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground block">Payment Mode</label>
                <select
                  aria-label="Payment mode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">All Payment Modes</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border text-xs font-extrabold text-muted-foreground hover:bg-muted dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw size={14} />
                Reset
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-orange-600 text-xs font-extrabold text-white shadow-sm hover:bg-orange-700 cursor-pointer"
              >
                <Check size={16} />
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ReportFilterDrawer;
