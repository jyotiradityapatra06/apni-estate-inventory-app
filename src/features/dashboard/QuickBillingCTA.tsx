import React from "react";
import { useNavigate } from "react-router";
import { FilePlus, Receipt, ArrowRight, ShieldCheck, FileText } from "lucide-react";

export const QuickBillingCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
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
            onClick={() => navigate("/invoices/new?mode=DIRECT&type=GST")}
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
  );
};

export default QuickBillingCTA;
