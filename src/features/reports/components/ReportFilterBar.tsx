import React, { useEffect, useState } from "react";
import { Filter, Printer, FileDown, RotateCcw, Calendar, Building2, Boxes, ShoppingBag, Landmark } from "lucide-react";
import { supplierApi } from "../../../api/supplier.api";
import { godownApi } from "../../../api/godown.api";
import { inventoryApi } from "../../../api/inventory.api";

interface ReportFilterBarProps {
  from: string;
  to: string;
  status: string;
  invoiceType: string;
  paymentMode: string;
  materialId?: string;
  categoryId?: string;
  supplierId?: string;
  godownId?: string;
  hsnCode?: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  setStatus: (v: string) => void;
  setInvoiceType: (v: string) => void;
  setPaymentMode: (v: string) => void;
  setMaterialId?: (v: string) => void;
  setCategoryId?: (v: string) => void;
  setSupplierId?: (v: string) => void;
  setGodownId?: (v: string) => void;
  setHsnCode?: (v: string) => void;
  preset: (value: string) => void;
  onReset: () => void;
  onPrint: () => void;
  onExportCsv: () => void;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  from,
  to,
  status,
  invoiceType,
  paymentMode,
  materialId = "",
  categoryId = "",
  supplierId = "",
  godownId = "",
  hsnCode = "",
  setFrom,
  setTo,
  setStatus,
  setInvoiceType,
  setPaymentMode,
  setMaterialId,
  setCategoryId,
  setSupplierId,
  setGodownId,
  setHsnCode,
  preset,
  onReset,
  onPrint,
  onExportCsv,
}) => {
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [godowns, setGodowns] = useState<Array<{ id: string; name: string }>>([]);
  const [materials, setMaterials] = useState<Array<{ id: string; materialName: string; category: string }>>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    supplierApi.getAll().then((res) => {
      if (res?.data) setSuppliers(res.data.map((s) => ({ id: s.id, name: s.name })));
    }).catch(() => {});

    godownApi.getAll().then((res) => {
      if (res?.data) setGodowns(res.data.map((g) => ({ id: g.id, name: g.name })));
    }).catch(() => {});

    inventoryApi.getItems().then((res) => {
      if (res?.data) {
        setMaterials(res.data.map((m) => ({ id: m.id, materialName: m.materialName, category: m.category })));
        const cats = Array.from(new Set(res.data.map((m) => m.category).filter(Boolean)));
        setCategories(cats);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="report-actions space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      {/* Header & Quick Action Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-orange-600 dark:text-orange-500 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Interactive Report Filters & Export
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            onClick={onPrint}
            className="flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Printer size={13} />
            Export PDF
          </button>
          <button
            onClick={onExportCsv}
            className="flex min-h-9 items-center gap-1.5 rounded-xl bg-orange-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-orange-700 transition-colors cursor-pointer dark:bg-orange-600 dark:hover:bg-orange-500"
          >
            <FileDown size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Row 1: Date Range Preset & Custom Pickers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
            Date Preset
          </label>
          <select
            aria-label="Date preset"
            onChange={(e) => preset(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Custom Date Range</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="fy">Financial Year (Apr-Mar)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
            From Date
          </label>
          <input
            aria-label="From date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
            To Date
          </label>
          <input
            aria-label="To date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
            Status
          </label>
          <input
            aria-label="Status filter"
            value={status}
            onChange={(e) => setStatus(e.target.value.toUpperCase())}
            placeholder="Status (e.g. PAID)"
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
            Invoice Type
          </label>
          <select
            aria-label="Invoice type"
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All Bill Types</option>
            <option value="GST">GST Tax Invoice</option>
            <option value="NON_GST">Non-GST Bill</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
            Payment Mode
          </label>
          <select
            aria-label="Payment Mode"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All Payment Modes</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
            <option value="UPI">UPI</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
      </div>

      {/* Row 2: Advanced Entity Filters (Material, Category, Supplier, Godown, HSN) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 pt-1 border-t border-slate-100 dark:border-slate-800">
        {setMaterialId && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
              Material Item
            </label>
            <select
              aria-label="Material filter"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All Materials</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.materialName}</option>
              ))}
            </select>
          </div>
        )}

        {setCategoryId && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
              Material Category
            </label>
            <select
              aria-label="Category filter"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {setSupplierId && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
              Supplier / Vendor
            </label>
            <select
              aria-label="Supplier filter"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {setGodownId && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
              Warehouse / Godown
            </label>
            <select
              aria-label="Godown filter"
              value={godownId}
              onChange={(e) => setGodownId(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All Warehouses</option>
              {godowns.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {setHsnCode && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
              HSN Code
            </label>
            <input
              aria-label="HSN Code filter"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              placeholder="e.g. 7214"
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportFilterBar;
