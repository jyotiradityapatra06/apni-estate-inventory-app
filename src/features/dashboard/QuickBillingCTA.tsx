import React, { useState } from "react";
import { useNavigate } from "react-router";
import { FilePlus, Receipt, ArrowRight, ShieldCheck, FileText, AlertTriangle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const QuickBillingCTA: React.FC = () => {
  const navigate = useNavigate();
  const { business } = useAuth();
  const [showGstWarning, setShowGstWarning] = useState(false);

  const handleGstInvoiceClick = () => {
    if (business?.gstNumber) {
      navigate("/invoices/new?mode=DIRECT&type=GST");
    } else {
      setShowGstWarning(true);
    }
  };

  return (
    <>
      <div className="w-full rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 p-4 sm:p-6 text-white shadow-lg shadow-orange-500/15">
        <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Left Text Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white backdrop-blur-md">
                <ShieldCheck size={12} /> Primary ERP Workflow
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Create New Bill
            </h2>
            <p className="hidden text-xs sm:block sm:text-sm font-medium text-orange-100 leading-relaxed max-w-xl">
              One-click bill creation for construction material sales. Generate GST Tax Invoices or Non-GST Bills instantly.
            </p>
          </div>

          {/* Action Buttons: min-h-[48px] touch targets */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* GST Invoice Button */}
            <button
              onClick={handleGstInvoiceClick}
              className="flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-black text-orange-600 shadow-md hover:bg-orange-50 active:scale-98 transition-all cursor-pointer group"
            >
              <FilePlus size={18} className="text-orange-600 group-hover:scale-110 transition-transform" />
              <span>Direct GST Invoice</span>
              <ArrowRight size={16} className="text-orange-500 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Non-GST Bill Button */}
            <button
              onClick={() => navigate("/invoices/new?mode=DIRECT&type=NON_GST")}
              className="flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-white/20 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-md active:scale-98 transition-all cursor-pointer group"
            >
              <Receipt size={18} className="text-orange-400 group-hover:scale-110 transition-transform" />
              <span>Direct Non-GST Bill</span>
              <FileText size={16} className="text-orange-300 opacity-80" />
            </button>

            <button
              onClick={() => navigate("/invoices/new?mode=SALES_ORDER")}
              className="flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-xs font-black text-white transition-all hover:bg-white/20 sm:text-sm"
            >
              <FileText size={18} />
              <span>From Sales Order</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>

      {/* GST Warning Modal for Non-GST Businesses */}
      {showGstWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5 text-foreground">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">GST Details Required</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  GST details are not configured for your business. Add GST information in your profile or create a Non-GST bill.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowGstWarning(false);
                  navigate("/management");
                }}
                className="flex-1 min-h-[42px] py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-bold text-xs cursor-pointer transition-all shadow-sm"
              >
                Complete Business Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGstWarning(false);
                  navigate("/invoices/new?mode=DIRECT&type=NON_GST");
                }}
                className="flex-1 min-h-[42px] py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted active:scale-[0.98] font-bold text-xs text-foreground cursor-pointer transition-all"
              >
                Create Non-GST Bill
              </button>
            </div>
            
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => setShowGstWarning(false)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickBillingCTA;
