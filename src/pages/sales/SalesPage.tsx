import { useState } from "react";
import {
  Plus, Search, Filter, ChevronRight, Share2, Phone, FileText, X,
  CheckCircle, ArrowLeft, Edit3, Eye, AlertTriangle, Download
} from "lucide-react";

import { C } from "../../constants/colors";
import { fmt, fmtK } from "../../utils/currency";
import { receivables, payables, invoiceItems } from "../../data/sales.mock";
import { Badge } from "../../app/components/common/Badge";
import { Card } from "../../app/components/common/Card";
import { SectionLabel } from "../../app/components/common/SectionLabel";
import { StatChip } from "../../app/components/common/StatChip";
import { Divider } from "../../app/components/common/Divider";

type InvoiceStep = 0 | 1 | 2 | 3;

interface InvoiceFlowProps {
  step: InvoiceStep;
  setStep: (s: InvoiceStep) => void;
  onClose: () => void;
}

const InvoiceFlow = ({ step, setStep, onClose }: InvoiceFlowProps) => {
  const [authorized, setAuthorized] = useState(false);
  const steps = ["Customer", "Items", "Review", "Authorize"];

  const subtotal = invoiceItems.reduce((a, i) => a + i.total, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={step === 0 ? onClose : () => setStep((step - 1) as InvoiceStep)} className="cursor-pointer">
            <ArrowLeft size={20} color="white" />
          </button>
          <div className="flex-1">
            <div className="text-white/60 text-[11px] uppercase tracking-wider">New Invoice</div>
            <div className="text-white text-base font-bold">Step {step + 1}: {steps[step]}</div>
          </div>
          <button onClick={onClose} className="cursor-pointer">
            <X size={18} color="rgba(255,255,255,0.6)" />
          </button>
        </div>
        {/* Progress */}
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div key={s} style={{ background: i <= step ? C.white : "rgba(255,255,255,0.3)", flex: 1, height: 3, borderRadius: 99 }} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <SectionLabel>Select Customer</SectionLabel>
            <div style={{ background: C.white, border: `1px solid ${C.border}` }} className="flex items-center gap-2 px-3 py-2.5 rounded-xl">
              <Search size={15} color={C.muted} />
              <span style={{ color: C.muted }} className="text-sm">Search customer name or GSTIN...</span>
            </div>
            <div>
              <div style={{ color: C.muted }} className="text-[11px] font-semibold uppercase tracking-wide mb-2">Recent Customers</div>
              {receivables.map((r, i) => (
                <div key={r.id}>
                  {i > 0 && <Divider />}
                  <button
                    className="w-full flex items-center justify-between px-1 py-3 cursor-pointer text-left"
                    onClick={() => setStep(1)}
                  >
                    <div>
                      <div style={{ color: C.ink }} className="text-sm font-semibold text-left">{r.name}</div>
                      <div style={{ color: C.muted }} className="text-[11px]">{r.gstin} · {r.terms}</div>
                    </div>
                    <ChevronRight size={15} color={C.muted} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-xl px-4 py-3">
              <div style={{ color: C.muted }} className="text-[11px]">Invoice for</div>
              <div style={{ color: C.ink }} className="text-sm font-bold">Ram Traders</div>
              <div style={{ color: C.muted }} className="text-[11px]">27AABFR5987M1ZP · 30-day Credit</div>
            </div>
            <SectionLabel action="+ Add Item">Materials Added</SectionLabel>
            {invoiceItems.map((item, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div style={{ color: C.ink }} className="text-[13px] font-semibold">{item.material}</div>
                    <div style={{ color: C.muted }} className="text-[11px]">{item.qty} {item.unit} × ₹{item.rate.toLocaleString("en-IN")}</div>
                  </div>
                  <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-sm font-bold">₹{item.total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex gap-3 text-[11px]">
                  <span style={{ color: C.muted }}>Discount: {item.discount}%</span>
                  <span style={{ color: C.muted }}>Loading: ₹{item.loading.toLocaleString("en-IN")}</span>
                  <Badge label="GST 18%" color="blue" />
                </div>
              </Card>
            ))}
            <button style={{ background: C.surface, border: `1.5px dashed ${C.border}` }} className="w-full py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
              <Plus size={16} color={C.muted} />
              <span style={{ color: C.muted }} className="text-sm font-medium">Add Material</span>
            </button>
            <button onClick={() => setStep(2)} style={{ background: C.blue }} className="w-full py-3.5 rounded-xl text-white font-bold cursor-pointer">
              Continue to Review
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: C.ink }} className="text-sm font-bold">Invoice Preview</span>
                <Badge label="DRAFT" color="neutral" />
              </div>
              <div className="flex justify-between mb-1">
                <span style={{ color: C.muted }} className="text-[12px]">Invoice No.</span>
                <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-[12px] font-semibold">INV-2025-0284</span>
              </div>
              <div className="flex justify-between mb-1">
                <span style={{ color: C.muted }} className="text-[12px]">Date</span>
                <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-[12px]">10 Jul 2025</span>
              </div>
              <div className="flex justify-between mb-3">
                <span style={{ color: C.muted }} className="text-[12px]">Payment terms</span>
                <span style={{ color: C.ink }} className="text-[12px] font-medium">30-day Credit</span>
              </div>
              <Divider />
              <div className="py-3 flex flex-col gap-1.5">
                {invoiceItems.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span style={{ color: C.muted }} className="text-[11px] flex-1 mr-2">{item.material} ({item.qty} {item.unit})</span>
                    <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-[11px] font-medium flex-shrink-0">₹{item.total.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <Divider />
              <div className="pt-3 flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span style={{ color: C.muted }} className="text-[12px]">Subtotal</span>
                  <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-[12px]">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: C.muted }} className="text-[12px]">GST 18% (CGST 9% + SGST 9%)</span>
                  <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-[12px]">₹{gst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-1.5" style={{ borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                  <span style={{ color: C.ink }} className="text-sm font-bold">Grand Total</span>
                  <span style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="text-base font-bold">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </Card>
            <div className="flex gap-2">
              <button style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }} className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                <Edit3 size={13} color={C.muted} /> <span style={{ color: C.ink }}>Edit</span>
              </button>
              <button style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }} className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                <Eye size={13} color={C.muted} /> <span style={{ color: C.ink }}>Preview</span>
              </button>
            </div>
            <button onClick={() => setStep(3)} style={{ background: C.blue }} className="w-full py-3.5 rounded-xl text-white font-bold cursor-pointer">
              Proceed to Authorize
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            {!authorized ? (
              <>
                <Card className="p-4">
                  <div style={{ color: C.muted }} className="text-[11px] uppercase tracking-wide mb-2">Authorization Required</div>
                  <div style={{ color: C.ink }} className="text-sm font-semibold mb-1">Invoice INV-2025-0284</div>
                  <div style={{ color: C.muted }} className="text-xs mb-3">Grand Total: <span style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="font-bold">₹{total.toLocaleString("en-IN")}</span></div>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }} className="p-3 mb-4">
                    <div style={{ color: C.muted }} className="text-[11px] mb-1">Authorizing as</div>
                    <div style={{ color: C.ink }} className="text-sm font-semibold">Ramesh Kumar (Owner)</div>
                    <div style={{ color: C.muted }} className="text-[11px]">Admin · All approvals</div>
                  </div>
                  <div style={{ color: C.muted }} className="text-[11px] mb-2">Enter PIN to authorize</div>
                  <div className="flex gap-2 mb-4">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{ background: C.surface, border: `1.5px solid ${C.blue}`, flex: 1, height: 44, borderRadius: 10 }} className="flex items-center justify-center">
                        <div style={{ background: C.ink }} className="w-2.5 h-2.5 rounded-full" />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setAuthorized(true)}
                    style={{ background: C.blue }}
                    className="w-full py-3.5 rounded-xl text-white font-bold cursor-pointer"
                  >
                    Authorize & Dispatch
                  </button>
                </Card>
                <div style={{ background: "#FFFBEB", border: `1px solid ${C.warning}20` }} className="rounded-xl px-4 py-3 flex gap-3">
                  <AlertTriangle size={16} color={C.warning} className="flex-shrink-0 mt-0.5" />
                  <p style={{ color: "#92400E" }} className="text-[12px]">Authorization creates an immutable audit record. Ensure all items and tax values are correct before proceeding.</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-6">
                <div style={{ background: "#ECFDF5" }} className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={40} color={C.success} />
                </div>
                <div style={{ color: C.ink }} className="text-lg font-bold mb-1">Invoice Authorized</div>
                <div style={{ color: C.muted }} className="text-sm mb-1">INV-2025-0284 · ₹{total.toLocaleString("en-IN")}</div>
                <div style={{ color: C.muted }} className="text-xs mb-6">Ramesh Kumar · 10 Jul 2025, 14:38:22 IST</div>
                <div className="flex gap-2 w-full">
                  <button style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }} className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                    <Download size={14} color={C.muted} /> <span style={{ color: C.ink }}>Download</span>
                  </button>
                  <button style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }} className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                    <Share2 size={14} color={C.muted} /> <span style={{ color: C.ink }}>Share</span>
                  </button>
                </div>
                <button onClick={onClose} style={{ background: C.blue }} className="w-full mt-3 py-3.5 rounded-xl text-white font-bold cursor-pointer">
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const SalesPage = () => {
  const [seg, setSeg] = useState<"recv" | "pay">("recv");
  const [selected, setSelected] = useState<number | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceStep, setInvoiceStep] = useState<InvoiceStep>(0);
  const [paymentSheet, setPaymentSheet] = useState(false);
  const [payAmount, setPayAmount] = useState("150000");
  const [payConfirmed, setPayConfirmed] = useState(false);

  const list = seg === "recv" ? receivables : payables;
  const totalOut = list.reduce((a, r) => a + r.total - r.paid, 0);
  const overdue = list.filter(r => r.overdue > 0).reduce((a, r) => a + (r.total - r.paid), 0);
  const thisWeek = list.filter(r => r.overdue === 0).reduce((a, r) => a + Math.round((r.total - r.paid) * 0.3), 0);

  const sel = list.find(r => r.id === selected);

  if (showInvoice) {
    return (
      <InvoiceFlow
        step={invoiceStep}
        setStep={setInvoiceStep}
        onClose={() => { setShowInvoice(false); setInvoiceStep(0); }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-0 pb-4">
      {/* Mobile Header - Hidden on md/lg desktop */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5 md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white/60 text-[11px] font-medium uppercase tracking-wider">Finance</div>
            <div className="text-white text-lg font-bold">Ledger & Invoicing</div>
          </div>
          <button
            onClick={() => setShowInvoice(true)}
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.25)" }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer"
          >
            <Plus size={14} color="white" />
            <span className="text-white text-xs font-semibold">New Invoice</span>
          </button>
        </div>
        {/* Segment */}
        <div style={{ background: "rgba(0,0,0,0.2)" }} className="flex rounded-lg p-1">
          {(["recv", "pay"] as const).map(s => (
            <button
              key={s}
              onClick={() => { setSeg(s); setSelected(null); }}
              style={{ background: seg === s ? C.white : "transparent", color: seg === s ? C.blue : "rgba(255,255,255,0.7)" }}
              className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer"
            >
              {s === "recv" ? "Receivables" : "Payables"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-1 md:px-0 py-4 flex flex-col gap-4">
        {/* Desktop Toolbar */}
        <div className="hidden md:flex items-center justify-between mb-2">
          <div style={{ background: "rgba(0,0,0,0.05)" }} className="flex rounded-lg p-1 w-64">
            {(["recv", "pay"] as const).map(s => (
              <button
                key={s}
                onClick={() => { setSeg(s); setSelected(null); }}
                style={{ background: seg === s ? C.white : "transparent", color: seg === s ? C.blue : C.muted }}
                className="flex-1 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
              >
                {s === "recv" ? "Receivables" : "Payables"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowInvoice(true)}
            style={{ background: C.blue }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg cursor-pointer text-white text-xs font-semibold"
          >
            <Plus size={14} color="white" />
            <span>New Invoice</span>
          </button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <StatChip label="Total Outstanding" value={fmtK(totalOut)} sub={null} trend={null} />
          <StatChip label="Overdue" value={fmtK(overdue)} sub={overdue > 0 ? "Requires action" : "All clear"} trend={overdue > 0 ? "down" : null} />
          <StatChip label="Due This Week" value={fmtK(thisWeek)} sub={null} trend={null} />
          <StatChip label={seg === "recv" ? "Collected (Jul)" : "Paid (Jul)"} value={fmtK(list.reduce((a, r) => a + r.paid, 0))} sub="+8% vs Jun" trend="up" />
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div style={{ background: C.white, border: `1px solid ${C.border}` }} className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1">
            <Search size={14} color={C.muted} />
            <span style={{ color: C.muted }} className="text-sm">Search parties...</span>
          </div>
          <button style={{ background: C.white, border: `1px solid ${C.border}` }} className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer">
            <Filter size={15} color={C.muted} />
          </button>
        </div>

        {/* Responsive Ledger Splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Party List Panel */}
          <div className="lg:col-span-1">
            <SectionLabel>{seg === "recv" ? "Receivables" : "Payables"} — {list.length} parties</SectionLabel>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }}>
              {list.map((r, i) => {
                const remaining = r.total - r.paid;
                const pct = (r.paid / r.total) * 100;
                const isHigh = r.risk === "high";
                const isSel = selected === r.id;
                return (
                  <div key={r.id}>
                    {i > 0 && <Divider />}
                    <button
                      className="w-full text-left px-4 py-3 cursor-pointer"
                      onClick={() => setSelected(isSel ? null : r.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span style={{ color: C.ink }} className="text-[13px] font-semibold truncate">{r.name}</span>
                            {isHigh && <Badge label="HIGH RISK" color="error" />}
                            {r.overdue > 0 && !isHigh && <Badge label={`${r.overdue}d overdue`} color="warning" />}
                          </div>
                          <div style={{ color: C.muted }} className="text-[11px]">{r.terms} · {r.gstin || "N/A"}</div>
                          <div className="mt-2">
                            <div className="flex justify-between mb-1">
                              <span style={{ color: C.muted }} className="text-[10px]">Paid {fmt(r.paid)}</span>
                              <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-[11px] font-semibold">{fmt(remaining)} remaining</span>
                            </div>
                            <div style={{ background: "#F0EEE6", borderRadius: 99, height: 4 }}>
                              <div style={{ background: isHigh ? C.error : C.success, borderRadius: 99, width: `${pct}%`, height: "100%" }} />
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={14} color={C.muted} className="mt-1 flex-shrink-0" />
                      </div>
                      {isSel && (
                        <div className="lg:hidden mt-3 grid grid-cols-3 gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPaymentSheet(true); }}
                            style={{ background: C.blue }}
                            className="col-span-3 py-2.5 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus size={13} /> Record Payment
                          </button>
                          <button style={{ background: C.surface, border: `1px solid ${C.border}` }} className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <Share2 size={12} color={C.muted} />
                            <span style={{ color: C.ink }}>Statement</span>
                          </button>
                          <button style={{ background: C.surface, border: `1px solid ${C.border}` }} className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <Phone size={12} color={C.muted} />
                            <span style={{ color: C.ink }}>Call</span>
                          </button>
                          <button style={{ background: C.surface, border: `1px solid ${C.border}` }} className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <FileText size={12} color={C.muted} />
                            <span style={{ color: C.ink }}>Ledger</span>
                          </button>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Detail Panel */}
          <div className="hidden lg:block lg:col-span-2">
            <SectionLabel>Party Details</SectionLabel>
            {sel ? (
              <Card className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 style={{ color: C.ink }} className="text-base font-bold">{sel.name}</h2>
                      {sel.risk === "high" && <Badge label="HIGH RISK" color="error" />}
                      {sel.overdue > 0 && <Badge label={`${sel.overdue}d overdue`} color="warning" />}
                    </div>
                    <div style={{ color: C.muted }} className="text-xs">{sel.terms} · {sel.gstin || "N/A"}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="text-xl font-bold">{fmt(sel.total - sel.paid)}</div>
                    <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-wider font-semibold">Remaining Balance</div>
                  </div>
                </div>
                <Divider />
                <div className="grid grid-cols-2 gap-4">
                  <div style={{ background: C.surface, borderRadius: 10 }} className="p-3">
                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-semibold mb-1">Total Invoiced</span>
                    <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-sm font-semibold">{fmt(sel.total)}</span>
                  </div>
                  <div style={{ background: C.surface, borderRadius: 10 }} className="p-3">
                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-semibold mb-1">Amount Paid</span>
                    <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-sm font-semibold">{fmt(sel.paid)}</span>
                  </div>
                </div>
                <Divider />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setPaymentSheet(true)}
                    style={{ background: C.blue }}
                    className="py-2.5 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={13} /> Record Payment
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <button style={{ background: C.surface, border: `1px solid ${C.border}` }} className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer">
                      <Share2 size={12} color={C.muted} />
                      <span style={{ color: C.ink }}>Statement</span>
                    </button>
                    <button style={{ background: C.surface, border: `1px solid ${C.border}` }} className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer">
                      <Phone size={12} color={C.muted} />
                      <span style={{ color: C.ink }}>Call</span>
                    </button>
                    <button style={{ background: C.surface, border: `1px solid ${C.border}` }} className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer">
                      <FileText size={12} color={C.muted} />
                      <span style={{ color: C.ink }}>Ledger</span>
                    </button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center flex flex-col items-center justify-center h-48 border-dashed">
                <span style={{ color: C.muted }} className="text-sm">Select a party from the list to view billing details and record payments.</span>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Payment bottom sheet */}
      {paymentSheet && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: C.white }} className="rounded-t-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: C.ink }} className="text-base font-bold">{payConfirmed ? "Payment Recorded" : "Record Payment"}</span>
              <button onClick={() => { setPaymentSheet(false); setPayConfirmed(false); }} className="cursor-pointer">
                <X size={20} color={C.muted} />
              </button>
            </div>
            {!payConfirmed ? (
              <>
                <div style={{ color: C.muted }} className="text-xs font-medium mb-1">Customer</div>
                <div style={{ color: C.ink }} className="text-sm font-semibold mb-4">{sel?.name || "Patel Cement Store"}</div>
                <div style={{ color: C.muted }} className="text-xs font-medium mb-1">Amount Received (₹)</div>
                <div style={{ background: C.surface, border: `1.5px solid ${C.blue}`, borderRadius: 10 }} className="px-4 py-3 mb-3">
                  <input
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    style={{ fontFamily: "'Space Grotesk'", fontSize: 22, fontWeight: 700, color: C.ink, background: "transparent", width: "100%", outline: "none", border: "none" }}
                  />
                </div>
                <div className="flex gap-2 mb-4">
                  {["50000", "100000", "150000", "200000"].map(v => (
                    <button key={v} onClick={() => setPayAmount(v)} style={{ background: payAmount === v ? C.blue : C.surface, color: payAmount === v ? "white" : C.ink, border: `1px solid ${payAmount === v ? C.blue : C.border}` }} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer">
                      {fmtK(Number(v))}
                    </button>
                  ))}
                </div>
                <div style={{ color: C.muted }} className="text-xs font-medium mb-1">Mode</div>
                <div className="flex gap-2 mb-5">
                  {["UPI", "NEFT", "Cash", "Cheque"].map(m => (
                    <button key={m} style={{ background: m === "UPI" ? "#EFF4FF" : C.surface, color: m === "UPI" ? C.blue : C.ink, border: `1px solid ${m === "UPI" ? C.blue : C.border}` }} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer">
                      {m}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPayConfirmed(true)}
                  style={{ background: C.blue }}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer"
                >
                  Confirm ₹{Number(payAmount).toLocaleString("en-IN")} Payment
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div style={{ background: "#ECFDF5" }} className="w-16 h-16 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle size={32} color={C.success} />
                </div>
                <div style={{ color: C.ink }} className="text-base font-bold mb-1">Payment Recorded</div>
                <div style={{ color: C.muted }} className="text-sm mb-1">₹{Number(payAmount).toLocaleString("en-IN")} · UPI</div>
                <div style={{ color: C.muted }} className="text-xs mb-5">Recorded by Ramesh Kumar · 10 Jul 2025, 14:32</div>
                <div style={{ background: C.surface, borderRadius: 10 }} className="w-full px-4 py-3 mb-4">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: C.muted }}>Audit entry</span>
                    <span style={{ color: C.success, fontFamily: "'Space Grotesk'" }} className="font-semibold">#PAY-2025-0847</span>
                  </div>
                </div>
                <button onClick={() => { setPaymentSheet(false); setPayConfirmed(false); }} style={{ background: C.blue }} className="w-full py-3 rounded-xl text-white font-semibold text-sm cursor-pointer">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SalesPage;
