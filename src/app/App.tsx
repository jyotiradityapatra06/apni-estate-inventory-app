import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Home, TrendingUp, Package, Truck, User,
  Bell, Search, Wifi, WifiOff, AlertTriangle,
  CheckCircle, Clock, ChevronRight, Phone, MessageSquare,
  Plus, Filter, ArrowUpRight, ArrowDownRight,
  MapPin, Navigation, X, Check, ChevronDown, ChevronUp,
  FileText, Download, Share2, Edit3, Layers,
  Users, Shield, Settings, HelpCircle, LogOut,
  RefreshCw, Camera, Paperclip, Star, MoreVertical,
  ArrowLeft, IndianRupee, BarChart2, Zap, Eye,
  Building2, Warehouse, Route, ClipboardList,
  AlertCircle, Info, TrendingDown
} from "lucide-react";

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmt = (n: number) => {
  const s = n.toFixed(0);
  const [int, dec] = s.split(".");
  let result = int;
  if (int.length > 3) {
    const last3 = int.slice(-3);
    const rest = int.slice(0, -3);
    const groups = [];
    for (let i = rest.length; i > 0; i -= 2) groups.unshift(rest.slice(Math.max(0, i - 2), i));
    result = groups.join(",") + "," + last3;
  }
  return "₹" + result + (dec ? "." + dec : "");
};

const fmtK = (n: number) => {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(0) + "K";
  return fmt(n);
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  blue: "#2A4CD6",
  navy: "#1F3BB3",
  bg: "#EEECE3",
  white: "#FFFFFF",
  success: "#10B981",
  error: "#EF4444",
  warning: "#FFB300",
  ink: "#14120E",
  muted: "#6B6558",
  border: "rgba(20,18,14,0.1)",
  card: "#FFFFFF",
  surface: "#F5F3EC",
  dark: "#0E1823",
  darkCard: "#162130",
  darkBorder: "rgba(255,255,255,0.08)",
};

// ─── Shared components ────────────────────────────────────────────────────────

const Badge = ({ label, color }: { label: string; color: "success" | "error" | "warning" | "blue" | "neutral" }) => {
  const map = {
    success: { bg: "#ECFDF5", text: "#065F46", dot: C.success },
    error: { bg: "#FEF2F2", text: "#991B1B", dot: C.error },
    warning: { bg: "#FFFBEB", text: "#92400E", dot: C.warning },
    blue: { bg: "#EFF4FF", text: "#1E3A8A", dot: C.blue },
    neutral: { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  };
  const t = map[color];
  return (
    <span style={{ background: t.bg, color: t.text }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none">
      <span style={{ background: t.dot }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
      {label}
    </span>
  );
};

const Card = ({ children, className = "", dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) => (
  <div
    style={{ background: dark ? C.darkCard : C.white, border: `1px solid ${dark ? C.darkBorder : C.border}` }}
    className={`rounded-xl ${className}`}
  >
    {children}
  </div>
);

const SectionLabel = ({ children, action, onAction }: { children: React.ReactNode; action?: string; onAction?: () => void }) => (
  <div className="flex items-center justify-between mb-3">
    <span style={{ color: C.muted }} className="text-[11px] font-semibold uppercase tracking-wider">{children}</span>
    {action && <button onClick={onAction} style={{ color: C.blue }} className="text-xs font-semibold">{action}</button>}
  </div>
);

const StatChip = ({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: "up" | "down" | null }) => (
  <div style={{ background: C.white, border: `1px solid ${C.border}` }} className="rounded-xl p-3 flex-1 min-w-0">
    <div style={{ color: C.muted }} className="text-[10px] font-medium uppercase tracking-wide mb-1 truncate">{label}</div>
    <div style={{ fontFamily: "'Space Grotesk', monospace", color: C.ink }} className="text-base font-bold leading-none truncate">{value}</div>
    {sub && (
      <div className="flex items-center gap-1 mt-1">
        {trend === "up" && <ArrowUpRight size={10} color={C.success} />}
        {trend === "down" && <ArrowDownRight size={10} color={C.error} />}
        <span style={{ color: trend === "up" ? C.success : trend === "down" ? C.error : C.muted }} className="text-[10px] font-medium">{sub}</span>
      </div>
    )}
  </div>
);

const Divider = ({ dark = false }) => (
  <div style={{ background: dark ? C.darkBorder : C.border }} className="h-px" />
);

// ─── Home Tab ─────────────────────────────────────────────────────────────────

const weekData = [
  { day: "Mon", sales: 1240000, col: 980000 },
  { day: "Tue", sales: 890000, col: 1120000 },
  { day: "Wed", sales: 1560000, col: 740000 },
  { day: "Thu", sales: 2100000, col: 1380000 },
  { day: "Fri", sales: 1780000, col: 1650000 },
  { day: "Sat", sales: 980000, col: 820000 },
  { day: "Today", sales: 1450000, col: 610000 },
];

const invData = [
  { name: "Cement", value: 42, color: "#2A4CD6" },
  { name: "TMT Bars", value: 26, color: "#10B981" },
  { name: "Sand", value: 17, color: "#FFB300" },
  { name: "Bricks & Agg.", value: 15, color: "#EF4444" },
];

const alerts = [
  {
    id: 1, severity: "error", icon: Package,
    title: "8 items below reorder level",
    impact: "Risk of stockout in 2-3 days",
    action: "Review Stock",
    tag: "CRITICAL",
  },
  {
    id: 2, severity: "warning", icon: Truck,
    title: "3 delivery runs unassigned",
    impact: "₹4,20,000 orders pending dispatch",
    action: "Assign Drivers",
    tag: "URGENT",
  },
  {
    id: 3, severity: "warning", icon: IndianRupee,
    title: "2 accounts overdue >15 days",
    impact: "₹2,87,500 at collection risk",
    action: "Call Customers",
    tag: "FOLLOW-UP",
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: C.ink, border: "none" }} className="rounded-lg px-3 py-2 text-white text-xs">
        <div className="font-semibold mb-1">{label}</div>
        <div className="flex gap-3">
          <span style={{ color: "#93C5FD" }}>Sales: {fmtK(payload[0]?.value || 0)}</span>
          <span style={{ color: "#6EE7B7" }}>Coll: {fmtK(payload[1]?.value || 0)}</span>
        </div>
      </div>
    );
  }
  return null;
};

function HomeTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5 -mx-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/60 text-[11px] font-medium uppercase tracking-wider">Operating System</div>
            <div className="text-white text-lg font-bold leading-tight">Shri Krishna Traders</div>
          </div>
          <div className="flex items-center gap-2">
            <button style={{ background: "rgba(255,255,255,0.15)" }} className="w-9 h-9 rounded-full flex items-center justify-center relative">
              <Bell size={17} color="white" />
              <span style={{ background: C.error }} className="absolute top-1 right-1 w-2 h-2 rounded-full" />
            </button>
            <button style={{ background: "rgba(255,255,255,0.15)" }} className="w-9 h-9 rounded-full flex items-center justify-center">
              <Search size={17} color="white" />
            </button>
          </div>
        </div>
        {/* Sync status */}
        <div className="flex items-center gap-1.5">
          <div style={{ background: C.success }} className="w-1.5 h-1.5 rounded-full" />
          <span className="text-white/70 text-[11px] font-medium">Live · Last sync 2 min ago</span>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* KPI row 1 */}
        <div>
          <SectionLabel>Today, 10 Jul 2025</SectionLabel>
          <div className="flex gap-2">
            <StatChip label="Today's Sales" value="₹14.5L" sub="+12% vs yesterday" trend="up" />
            <StatChip label="Collected" value="₹6.1L" sub="₹8.4L pending" trend={null} />
          </div>
        </div>
        <div className="flex gap-2">
          <StatChip label="Outstanding" value="₹38.2L" sub="-₹2.3L this week" trend="down" />
          <StatChip label="Orders Open" value="11" sub="3 unassigned" trend={null} />
        </div>

        {/* Weekly chart */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: C.ink }} className="text-sm font-semibold">Weekly Sales vs Collections</span>
            <div className="flex items-center gap-3 text-[10px] font-medium">
              <span className="flex items-center gap-1"><span style={{ background: C.blue }} className="w-2 h-2 rounded-sm inline-block" />Sales</span>
              <span className="flex items-center gap-1"><span style={{ background: C.success }} className="w-2 h-2 rounded-sm inline-block" />Collections</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weekData} barGap={2} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: C.muted, fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: C.muted, fontFamily: "Space Grotesk" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtK(v).replace("₹", "")} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(42,76,214,0.05)" }} />
              <Bar dataKey="sales" fill={C.blue} radius={[3, 3, 0, 0]} maxBarSize={14} />
              <Bar dataKey="col" fill={C.success} radius={[3, 3, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ background: C.surface, borderRadius: 8 }} className="px-3 py-2 mt-2">
            <p style={{ color: C.muted }} className="text-[11px]">
              This week: <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">₹99.0L</span> sales vs <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">₹73.0L</span> collected. Collection rate 73.7%.
            </p>
          </div>
        </Card>

        {/* Inventory allocation */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: C.ink }} className="text-sm font-semibold">Inventory Allocation</span>
            <span style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="text-sm font-bold">₹1,24,50,000</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 110, height: 110, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={invData} cx="50%" cy="50%" innerRadius={32} outerRadius={48} dataKey="value" strokeWidth={0}>
                    {invData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              {invData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span style={{ background: item.color }} className="w-2 h-2 rounded-sm flex-shrink-0" />
                    <span style={{ color: C.muted }} className="text-[11px]">{item.name}</span>
                  </div>
                  <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-[11px] font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: C.surface, borderRadius: 8 }} className="px-3 py-2 mt-3">
            <p style={{ color: C.muted }} className="text-[11px]">Cement dominates at 42%. TMT Bar stock estimated 6 days at current rate.</p>
          </div>
        </Card>

        {/* Action Required */}
        <div>
          <SectionLabel action="See all">Action Required</SectionLabel>
          <div className="flex flex-col gap-3">
            {alerts.map((a) => {
              const Icon = a.icon;
              const sev = a.severity as "error" | "warning";
              const color = sev === "error" ? C.error : C.warning;
              const bgColor = sev === "error" ? "#FEF2F2" : "#FFFBEB";
              const isOpen = expanded === a.id;
              return (
                <Card key={a.id} className="overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-3 flex items-start gap-3"
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                  >
                    <div style={{ background: bgColor, borderRadius: 8 }} className="w-9 h-9 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={16} color={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge label={a.tag} color={sev === "error" ? "error" : "warning"} />
                      </div>
                      <div style={{ color: C.ink }} className="text-[13px] font-semibold leading-snug">{a.title}</div>
                      <div style={{ color: C.muted }} className="text-[11px] mt-0.5">{a.impact}</div>
                    </div>
                    <div style={{ color: C.muted }} className="flex-shrink-0 mt-1">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>
                  {isOpen && (
                    <>
                      <Divider />
                      <div className="px-4 py-3">
                        <button
                          onClick={() => { setExpanded(null); if (a.id === 1) onNavigate("stock"); else if (a.id === 2) onNavigate("delivery"); else onNavigate("finance"); }}
                          style={{ background: C.blue }}
                          className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          {a.action} <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────

const receivables = [
  { id: 1, name: "Ram Traders", gstin: "27AABFR5987M1ZP", terms: "30-day Credit", total: 485000, paid: 200000, due: "2025-07-18", overdue: 0, risk: "low" },
  { id: 2, name: "Shyam Hardware", gstin: "27AADCS2341K1ZR", terms: "15-day Credit", total: 320000, paid: 120000, due: "2025-07-05", overdue: 5, risk: "medium" },
  { id: 3, name: "Patel Cement Store", gstin: "27AAHFP6219N1ZK", terms: "Cash on Delivery", total: 287500, paid: 50000, due: "2025-06-25", overdue: 15, risk: "high" },
  { id: 4, name: "Mehta Construction", gstin: "27AADCM4719L1ZS", terms: "30-day Credit", total: 640000, paid: 400000, due: "2025-07-22", overdue: 0, risk: "low" },
  { id: 5, name: "Suresh Infra Pvt Ltd", gstin: "27AACFS8891B1ZC", terms: "15-day Credit", total: 195000, paid: 80000, due: "2025-07-08", overdue: 2, risk: "medium" },
];

const payables = [
  { id: 1, name: "UltraTech Cement Ltd", terms: "30-day Credit", total: 890000, paid: 500000, due: "2025-07-20", overdue: 0, risk: "low" },
  { id: 2, name: "TATA Steel (TMT)", terms: "15-day Credit", total: 1240000, paid: 900000, due: "2025-07-12", overdue: 0, risk: "low" },
  { id: 3, name: "Mahavir Sand Suppliers", terms: "Cash on Delivery", total: 156000, paid: 156000, due: "2025-07-01", overdue: 0, risk: "low" },
];

// Invoice creation steps
const invoiceItems = [
  { material: "OPC 53 Grade Cement", unit: "Bags", qty: 200, rate: 385, discount: 5, loading: 2000, total: 73150 },
  { material: "Fe500 TMT Bar 12mm", unit: "Tonnes", qty: 2.5, rate: 68000, discount: 0, loading: 1500, total: 171500 },
];

type InvoiceStep = 0 | 1 | 2 | 3;

function FinanceTab() {
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
      {/* Header */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white/60 text-[11px] font-medium uppercase tracking-wider">Finance</div>
            <div className="text-white text-lg font-bold">Ledger & Invoicing</div>
          </div>
          <button
            onClick={() => setShowInvoice(true)}
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.25)" }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
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
              className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all"
            >
              {s === "recv" ? "Receivables" : "Payables"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Summary row */}
        <div className="flex gap-2">
          <StatChip label="Total Outstanding" value={fmtK(totalOut)} sub={null} trend={null} />
          <StatChip label="Overdue" value={fmtK(overdue)} sub={overdue > 0 ? "Requires action" : "All clear"} trend={overdue > 0 ? "down" : null} />
        </div>
        <div className="flex gap-2">
          <StatChip label="Due This Week" value={fmtK(thisWeek)} sub={null} trend={null} />
          <StatChip label={seg === "recv" ? "Collected (Jul)" : "Paid (Jul)"} value={fmtK(list.reduce((a, r) => a + r.paid, 0))} sub="+8% vs Jun" trend="up" />
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div style={{ background: C.white, border: `1px solid ${C.border}` }} className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1">
            <Search size={14} color={C.muted} />
            <span style={{ color: C.muted }} className="text-sm">Search parties...</span>
          </div>
          <button style={{ background: C.white, border: `1px solid ${C.border}` }} className="w-10 h-10 rounded-xl flex items-center justify-center">
            <Filter size={15} color={C.muted} />
          </button>
        </div>

        {/* Ledger rows */}
        <div>
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
                    className="w-full text-left px-4 py-3"
                    onClick={() => setSelected(isSel ? null : r.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ color: C.ink }} className="text-[13px] font-semibold truncate">{r.name}</span>
                          {isHigh && <Badge label="HIGH RISK" color="error" />}
                          {r.overdue > 0 && !isHigh && <Badge label={`${r.overdue}d overdue`} color="warning" />}
                        </div>
                        <div style={{ color: C.muted }} className="text-[11px]">{r.terms} · {r.gstin}</div>
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
                      <div className="mt-3 grid grid-cols-3 gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPaymentSheet(true); }}
                          style={{ background: C.blue }}
                          className="col-span-3 py-2.5 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Plus size={13} /> Record Payment
                        </button>
                        <button style={{ background: C.surface, border: `1px solid ${C.border}` }} className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          <Share2 size={12} color={C.muted} />
                          <span style={{ color: C.ink }}>Statement</span>
                        </button>
                        <button style={{ background: C.surface, border: `1px solid ${C.border}` }} className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          <Phone size={12} color={C.muted} />
                          <span style={{ color: C.ink }}>Call</span>
                        </button>
                        <button style={{ background: C.surface, border: `1px solid ${C.border}` }} className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
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
      </div>

      {/* Payment bottom sheet */}
      {paymentSheet && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: C.white }} className="rounded-t-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: C.ink }} className="text-base font-bold">{payConfirmed ? "Payment Recorded" : "Record Payment"}</span>
              <button onClick={() => { setPaymentSheet(false); setPayConfirmed(false); }}>
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
                    <button key={v} onClick={() => setPayAmount(v)} style={{ background: payAmount === v ? C.blue : C.surface, color: payAmount === v ? "white" : C.ink, border: `1px solid ${payAmount === v ? C.blue : C.border}` }} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold">
                      {fmtK(Number(v))}
                    </button>
                  ))}
                </div>
                <div style={{ color: C.muted }} className="text-xs font-medium mb-1">Mode</div>
                <div className="flex gap-2 mb-5">
                  {["UPI", "NEFT", "Cash", "Cheque"].map(m => (
                    <button key={m} style={{ background: m === "UPI" ? "#EFF4FF" : C.surface, color: m === "UPI" ? C.blue : C.ink, border: `1px solid ${m === "UPI" ? C.blue : C.border}` }} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold">
                      {m}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPayConfirmed(true)}
                  style={{ background: C.blue }}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm"
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
                <button onClick={() => { setPaymentSheet(false); setPayConfirmed(false); }} style={{ background: C.blue }} className="w-full py-3 rounded-xl text-white font-semibold text-sm">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invoice Flow ─────────────────────────────────────────────────────────────

function InvoiceFlow({ step, setStep, onClose }: { step: InvoiceStep; setStep: (s: InvoiceStep) => void; onClose: () => void }) {
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
          <button onClick={step === 0 ? onClose : () => setStep((step - 1) as InvoiceStep)}>
            <ArrowLeft size={20} color="white" />
          </button>
          <div className="flex-1">
            <div className="text-white/60 text-[11px] uppercase tracking-wider">New Invoice</div>
            <div className="text-white text-base font-bold">Step {step + 1}: {steps[step]}</div>
          </div>
          <button onClick={onClose}><X size={18} color="rgba(255,255,255,0.6)" /></button>
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
                    className="w-full flex items-center justify-between px-1 py-3"
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
            <button style={{ background: C.surface, border: `1.5px dashed ${C.border}` }} className="w-full py-3 rounded-xl flex items-center justify-center gap-2">
              <Plus size={16} color={C.muted} />
              <span style={{ color: C.muted }} className="text-sm font-medium">Add Material</span>
            </button>
            <button onClick={() => setStep(2)} style={{ background: C.blue }} className="w-full py-3.5 rounded-xl text-white font-bold">
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
              <button style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }} className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
                <Edit3 size={13} color={C.muted} /> <span style={{ color: C.ink }}>Edit</span>
              </button>
              <button style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }} className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
                <Eye size={13} color={C.muted} /> <span style={{ color: C.ink }}>Preview</span>
              </button>
            </div>
            <button onClick={() => setStep(3)} style={{ background: C.blue }} className="w-full py-3.5 rounded-xl text-white font-bold">
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
                    className="w-full py-3.5 rounded-xl text-white font-bold"
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
                  <button style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }} className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
                    <Download size={14} color={C.muted} /> <span style={{ color: C.ink }}>Download</span>
                  </button>
                  <button style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }} className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
                    <Share2 size={14} color={C.muted} /> <span style={{ color: C.ink }}>Share</span>
                  </button>
                </div>
                <button onClick={onClose} style={{ background: C.blue }} className="w-full mt-3 py-3.5 rounded-xl text-white font-bold">
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stock Tab ────────────────────────────────────────────────────────────────

const stockItems = [
  { id: 1, material: "OPC 53 Grade Cement", grade: "Premium", qty: 840, reserved: 200, reorder: 500, unit: "Bags", location: "Godown A", daysLeft: 3, trend: "down", updated: "2h ago" },
  { id: 2, material: "Fe500 TMT Bar 12mm", grade: "IS:1786", qty: 18.5, reserved: 5, reorder: 10, unit: "Tonnes", location: "Main Yard", daysLeft: 6, trend: "stable", updated: "4h ago" },
  { id: 3, material: "M-Sand (Zone II)", grade: "Zone II", qty: 320, reserved: 80, reorder: 400, unit: "Cu.Ft", location: "Main Yard", daysLeft: 2, trend: "down", updated: "1h ago" },
  { id: 4, material: "Red Bricks (Wire Cut)", grade: "Class A", qty: 45000, reserved: 10000, reorder: 20000, unit: "Pcs", location: "Godown B", daysLeft: 8, trend: "stable", updated: "6h ago" },
  { id: 5, material: "20mm Aggregate", grade: "Crushed", qty: 85, reserved: 20, reorder: 60, unit: "Tonnes", location: "Main Yard", daysLeft: 5, trend: "up", updated: "3h ago" },
];

function StockTab() {
  const [showReconcile, setShowReconcile] = useState(false);
  const [reconcileStep, setReconcileStep] = useState(0);
  const [shortage, setShortage] = useState(false);
  const [reconciled, setReconciled] = useState(false);

  const lowStock = stockItems.filter(s => s.qty - s.reserved < s.reorder);

  if (showReconcile) {
    return (
      <div className="flex flex-col h-full">
        <div style={{ background: C.blue }} className="px-4 pt-12 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => { setShowReconcile(false); setReconcileStep(0); setReconciled(false); }}>
              <ArrowLeft size={20} color="white" />
            </button>
            <div>
              <div className="text-white/60 text-[11px] uppercase tracking-wider">Supplier Verification</div>
              <div className="text-white text-base font-bold">Incoming Shipment</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {!reconciled ? (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: C.ink }} className="text-sm font-bold">PO Reference</span>
                  <span style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="text-sm font-bold">PO-2025-0192</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span style={{ color: C.muted }} className="text-xs">Supplier</span>
                  <span style={{ color: C.ink }} className="text-xs font-semibold">UltraTech Cement Ltd</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span style={{ color: C.muted }} className="text-xs">Vehicle</span>
                  <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-xs font-semibold">MH-12 CD 4521</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: C.muted }} className="text-xs">Challan No.</span>
                  <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-xs font-semibold">CH-47821</span>
                </div>
              </Card>
              <SectionLabel>Quantity Verification</SectionLabel>
              <Card className="p-4">
                <div style={{ color: C.ink }} className="text-sm font-semibold mb-3">OPC 53 Grade Cement</div>
                <div className="flex gap-3 mb-3">
                  <div style={{ background: C.surface }} className="flex-1 rounded-xl p-3">
                    <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-wide mb-1">Expected</div>
                    <div style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-xl font-bold">1,000</div>
                    <div style={{ color: C.muted }} className="text-[11px]">Bags</div>
                  </div>
                  <div style={{ background: shortage ? "#FEF2F2" : "#ECFDF5", border: `1.5px solid ${shortage ? C.error : C.success}` }} className="flex-1 rounded-xl p-3">
                    <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-wide mb-1">Received</div>
                    <div style={{ color: shortage ? C.error : C.success, fontFamily: "'Space Grotesk'" }} className="text-xl font-bold">{shortage ? "960" : "1,000"}</div>
                    <div style={{ color: C.muted }} className="text-[11px]">Bags</div>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.muted }} className="text-[11px] mb-1">Accepted</div>
                    <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">{shortage ? "940" : "1,000"}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.muted }} className="text-[11px] mb-1">Damaged</div>
                    <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ color: shortage ? C.warning : C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">{shortage ? "20" : "0"}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.muted }} className="text-[11px] mb-1">Short</div>
                    <div style={{ background: shortage ? "#FEF2F2" : C.surface, borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ color: shortage ? C.error : C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">{shortage ? "40" : "0"}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShortage(!shortage)}
                  style={{ background: shortage ? "#FEF2F2" : "#ECFDF5", border: `1px solid ${shortage ? C.error : C.success}`, color: shortage ? C.error : C.success }}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold"
                >
                  {shortage ? "Shortage recorded — Tap to clear" : "Simulate shortage scenario"}
                </button>
              </Card>
              {shortage && (
                <div style={{ background: "#FEF2F2", border: `1px solid ${C.error}20` }} className="rounded-xl px-4 py-3 flex gap-3">
                  <AlertTriangle size={16} color={C.error} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div style={{ color: "#991B1B" }} className="text-xs font-semibold mb-0.5">Discrepancy Detected</div>
                    <p style={{ color: "#991B1B" }} className="text-[11px]">40 bags short. Dispute note will be raised with UltraTech Cement Ltd. Credit note of ₹15,400 will be requested.</p>
                  </div>
                </div>
              )}
              <Card className="p-4">
                <div style={{ color: C.muted }} className="text-[11px] font-semibold uppercase tracking-wide mb-2">Attachments</div>
                <button style={{ background: C.surface, border: `1.5px dashed ${C.border}` }} className="w-full py-3 rounded-xl flex items-center justify-center gap-2 mb-2">
                  <Camera size={15} color={C.muted} />
                  <span style={{ color: C.muted }} className="text-sm">Take Photo</span>
                </button>
                <button style={{ background: C.surface, border: `1.5px dashed ${C.border}` }} className="w-full py-3 rounded-xl flex items-center justify-center gap-2">
                  <Paperclip size={15} color={C.muted} />
                  <span style={{ color: C.muted }} className="text-sm">Attach Document</span>
                </button>
              </Card>
              <button
                onClick={() => setReconciled(true)}
                style={{ background: C.blue }}
                className="w-full py-4 rounded-xl text-white font-bold"
              >
                {shortage ? "Save & Raise Dispute" : "Verify & Accept Shipment"}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-8">
              <div style={{ background: shortage ? "#FEF2F2" : "#ECFDF5" }} className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
                {shortage ? <AlertTriangle size={36} color={C.error} /> : <CheckCircle size={36} color={C.success} />}
              </div>
              <div style={{ color: C.ink }} className="text-lg font-bold mb-1">{shortage ? "Dispute Raised" : "Shipment Verified"}</div>
              <div style={{ color: C.muted }} className="text-sm mb-1">PO-2025-0192 · UltraTech Cement Ltd</div>
              <div style={{ color: C.muted }} className="text-xs mb-2">Verified by Suresh Patil · 10 Jul 2025, 11:15</div>
              {shortage && <div style={{ color: C.muted }} className="text-xs mb-5">Credit note request: ₹15,400 sent to supplier</div>}
              <div style={{ background: C.surface, borderRadius: 10 }} className="w-full px-4 py-3 mb-4">
                <div className="flex justify-between text-xs">
                  <span style={{ color: C.muted }}>Stock updated</span>
                  <span style={{ color: C.success, fontFamily: "'Space Grotesk'" }} className="font-semibold">+{shortage ? "940" : "1,000"} Bags</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: C.muted }}>Audit entry</span>
                  <span style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="font-semibold">#STK-2025-0391</span>
                </div>
              </div>
              <button onClick={() => { setShowReconcile(false); setReconcileStep(0); setReconciled(false); setShortage(false); }} style={{ background: C.blue }} className="w-full py-3.5 rounded-xl text-white font-bold">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 pb-4">
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/60 text-[11px] uppercase tracking-wider">Inventory</div>
            <div className="text-white text-lg font-bold">Stock Overview</div>
          </div>
          <button
            onClick={() => setShowReconcile(true)}
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.25)" }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
          >
            <ClipboardList size={14} color="white" />
            <span className="text-white text-xs font-semibold">Verify Shipment</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Alert banner */}
        {lowStock.length > 0 && (
          <div style={{ background: "#FEF2F2", border: `1px solid ${C.error}30` }} className="rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} color={C.error} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div style={{ color: "#991B1B" }} className="text-[12px] font-semibold">{lowStock.length} items below reorder threshold</div>
              <div style={{ color: "#B91C1C" }} className="text-[11px]">M-Sand and Cement require immediate reorder</div>
            </div>
            <button style={{ background: C.error }} className="px-3 py-1.5 rounded-lg text-white text-[11px] font-semibold flex-shrink-0">
              Reorder
            </button>
          </div>
        )}

        {/* Location filter */}
        <div className="flex gap-2">
          {["All", "Godown A", "Main Yard", "Godown B"].map(loc => (
            <button key={loc} style={{ background: loc === "All" ? C.blue : C.white, color: loc === "All" ? "white" : C.muted, border: `1px solid ${loc === "All" ? C.blue : C.border}` }} className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap">
              {loc}
            </button>
          ))}
        </div>

        {/* Stock items */}
        <div>
          <SectionLabel>{stockItems.length} materials tracked</SectionLabel>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }}>
            {stockItems.map((item, i) => {
              const available = item.qty - item.reserved;
              const isCritical = available < item.reorder;
              const pct = Math.min(100, (available / (item.reorder * 2)) * 100);
              return (
                <div key={item.id}>
                  {i > 0 && <Divider />}
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ color: C.ink }} className="text-[13px] font-semibold">{item.material}</span>
                          {isCritical && <Badge label="LOW" color="error" />}
                        </div>
                        <div style={{ color: C.muted }} className="text-[11px]">{item.grade} · {item.location} · Updated {item.updated}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div style={{ color: isCritical ? C.error : C.ink, fontFamily: "'Space Grotesk'" }} className="text-base font-bold">{available.toLocaleString("en-IN")}</div>
                        <div style={{ color: C.muted }} className="text-[10px]">{item.unit} avail.</div>
                      </div>
                    </div>
                    <div className="flex gap-3 text-[10px] mb-2">
                      <span style={{ color: C.muted }}>Reserved: <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">{item.reserved.toLocaleString("en-IN")} {item.unit}</span></span>
                      <span style={{ color: C.muted }}>Reorder at: <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">{item.reorder.toLocaleString("en-IN")}</span></span>
                    </div>
                    <div style={{ background: "#F0EEE6", borderRadius: 99, height: 5 }} className="mb-2">
                      <div style={{ background: isCritical ? C.error : pct > 60 ? C.success : C.warning, borderRadius: 99, width: `${pct}%`, height: "100%", transition: "width 0.3s" }} />
                    </div>
                    <div style={{ background: isCritical ? "#FEF2F2" : "#F0FDF4", borderRadius: 8 }} className="px-3 py-2">
                      <p style={{ color: isCritical ? "#991B1B" : "#065F46" }} className="text-[11px]">
                        ~{item.daysLeft} days remaining at current sales rate · <em>Estimate based on 7-day avg.</em>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delivery Tab ─────────────────────────────────────────────────────────────

const deliveries = [
  { id: 1, status: "on_way", customer: "Ram Traders", site: "Hadapsar Site, Pune", material: "OPC Cement 200 Bags", driver: "Prakash Yadav", vehicle: "MH-12 AB 7890", eta: "14:45", contact: "+91 98765 43210", exception: "8-min delay — NH16 traffic" },
  { id: 2, status: "loading", customer: "Mehta Construction", site: "Wakad Plot No. 47", material: "Fe500 TMT 2.5T + Sand 40 Cu.Ft", driver: "Ramesh Gawde", vehicle: "MH-14 GH 2341", eta: "16:20", contact: "+91 87654 32109", exception: null },
  { id: 3, status: "awaiting", customer: "Suresh Infra Pvt Ltd", site: "Pimpri Industrial Area", material: "Red Bricks 15,000 Pcs", driver: null, vehicle: null, eta: "18:00", contact: "+91 76543 21098", exception: null },
  { id: 4, status: "delivered", customer: "Shyam Hardware", site: "Kothrud Depot", material: "20mm Aggregate 5T", driver: "Vijay Kamble", vehicle: "MH-12 PQ 5512", eta: "11:30", contact: "+91 65432 10987", exception: null },
];

const statusMeta = {
  awaiting: { label: "Awaiting Assignment", color: C.muted, bg: "rgba(255,255,255,0.08)" },
  loading: { label: "Loading", color: C.warning, bg: "rgba(255,179,0,0.15)" },
  on_way: { label: "On the Way", color: C.blue, bg: "rgba(42,76,214,0.15)" },
  arrived: { label: "Arrived", color: C.success, bg: "rgba(16,185,129,0.15)" },
  delivered: { label: "Delivered", color: C.success, bg: "rgba(16,185,129,0.15)" },
  exception: { label: "Exception", color: C.error, bg: "rgba(239,68,68,0.15)" },
};

function DeliveryTab() {
  const [selected, setSelected] = useState<number>(1);
  const [showAssign, setShowAssign] = useState(false);
  const [showPOD, setShowPOD] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [podCaptured, setPodCaptured] = useState(false);

  const active = deliveries.find(d => d.id === selected)!;

  if (showAssign) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.dark }}>
        <div style={{ background: C.darkCard, borderBottom: `1px solid ${C.darkBorder}` }} className="px-4 pt-12 pb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowAssign(false); setAssigned(false); }}>
              <ArrowLeft size={20} color="white" />
            </button>
            <div>
              <div className="text-white/50 text-[11px] uppercase tracking-wider">Dispatch</div>
              <div className="text-white text-base font-bold">Assign Driver & Vehicle</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {!assigned ? (
            <>
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 12 }} className="p-4">
                <div className="text-white/50 text-[11px] mb-1">Trip for</div>
                <div className="text-white text-sm font-semibold">Suresh Infra Pvt Ltd</div>
                <div className="text-white/50 text-[11px]">Red Bricks 15,000 Pcs · Pimpri Industrial Area</div>
              </div>
              <div>
                <div className="text-white/50 text-[11px] font-semibold uppercase tracking-wider mb-2">Available Drivers</div>
                {[
                  { name: "Anil Sharma", trips: 0, avail: true },
                  { name: "Santosh More", trips: 1, avail: true },
                  { name: "Prakash Yadav", trips: 1, avail: false, note: "On MH-12 AB 7890 — ETA 15:30" },
                ].map((d, i) => (
                  <div key={i} style={{ background: C.darkCard, border: `1px solid ${d.avail ? C.darkBorder : C.error + "40"}`, borderRadius: 10, marginBottom: 8 }} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm font-semibold">{d.name}</div>
                      <div className="text-white/50 text-[11px]">{d.avail ? `${d.trips} active trip${d.trips !== 1 ? "s" : ""}` : d.note}</div>
                    </div>
                    {d.avail ? (
                      <Badge label="Available" color="success" />
                    ) : (
                      <Badge label="Busy" color="error" />
                    )}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-white/50 text-[11px] font-semibold uppercase tracking-wider mb-2">Available Vehicles</div>
                {[
                  { reg: "MH-12 XY 1122", cap: "10T", avail: true, load: "Empty" },
                  { reg: "MH-14 GH 2341", cap: "8T", avail: false, load: "Loading — ETA 16:00" },
                  { reg: "MH-09 ZZ 8890", cap: "12T", avail: true, load: "Empty" },
                ].map((v, i) => (
                  <div key={i} style={{ background: C.darkCard, border: `1px solid ${v.avail ? C.darkBorder : C.warning + "40"}`, borderRadius: 10, marginBottom: 8 }} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk'" }} className="text-white text-sm font-bold">{v.reg}</div>
                      <div className="text-white/50 text-[11px]">Capacity {v.cap} · {v.load}</div>
                    </div>
                    {v.avail ? <Badge label="Available" color="success" /> : <Badge label="Busy" color="warning" />}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setAssigned(true)}
                style={{ background: C.blue }}
                className="w-full py-4 rounded-xl text-white font-bold text-base"
              >
                Assign Anil Sharma · MH-12 XY 1122
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-8">
              <div style={{ background: "rgba(16,185,129,0.15)" }} className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={40} color={C.success} />
              </div>
              <div className="text-white text-lg font-bold mb-1">Driver Assigned</div>
              <div className="text-white/60 text-sm mb-1">Anil Sharma · MH-12 XY 1122</div>
              <div className="text-white/40 text-xs mb-6">Dispatched 10 Jul 2025, 14:52 · By Dispatch Team</div>
              <button onClick={() => { setShowAssign(false); setAssigned(false); }} style={{ background: C.blue }} className="w-full py-3.5 rounded-xl text-white font-bold">
                Back to Fleet
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: C.dark }}>
      {/* Dark map area */}
      <div style={{ height: 260, position: "relative", background: "#0E1823", overflow: "hidden", flexShrink: 0 }}>
        {/* Fake map SVG */}
        <svg width="100%" height="100%" viewBox="0 0 360 260" preserveAspectRatio="none">
          {/* Grid lines */}
          {[40, 80, 120, 160, 200, 240].map(y => <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
          {[60, 120, 180, 240, 300].map(x => <line key={x} x1={x} y1="0" x2={x} y2="260" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
          {/* Roads */}
          <path d="M0,140 Q80,130 160,145 Q240,158 360,150" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
          <path d="M0,90 Q90,85 180,100 Q270,115 360,105" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
          <path d="M120,0 Q125,65 130,130 Q135,190 140,260" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
          <path d="M240,0 Q245,65 250,130 Q255,190 255,260" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none" />
          {/* NH16 label */}
          <text x="50" y="133" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Space Grotesk">NH16</text>
          {/* Planned route */}
          <path d="M60,175 Q100,160 130,148 Q170,132 200,120 Q230,110 270,95" stroke={C.blue} strokeWidth="2.5" fill="none" strokeDasharray="5,3" opacity="0.6" />
          {/* Actual route */}
          <path d="M60,175 Q95,162 120,152" stroke={C.blue} strokeWidth="3" fill="none" />
          {/* Start marker */}
          <circle cx="60" cy="175" r="7" fill={C.success} />
          <text x="60" y="178" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">S</text>
          {/* Truck marker */}
          <circle cx="130" cy="150" r="10" fill={C.blue} />
          <text x="130" y="154" textAnchor="middle" fill="white" fontSize="10">🚚</text>
          {/* Destination */}
          <circle cx="270" cy="95" r="7" fill={C.error} />
          <text x="270" y="98" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">D</text>
          {/* Labels */}
          <text x="68" y="192" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Plus Jakarta Sans">Start Yard</text>
          <text x="248" y="112" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Plus Jakarta Sans">Ram Traders</text>
        </svg>

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-3" style={{ background: "linear-gradient(to bottom, rgba(14,24,35,0.95), transparent)" }}>
          <div>
            <div className="text-white/50 text-[11px] uppercase tracking-wider">Fleet</div>
            <div className="text-white text-base font-bold">Live Delivery</div>
          </div>
          <button style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${C.darkBorder}` }} className="w-9 h-9 rounded-full flex items-center justify-center">
            <Navigation size={15} color="white" />
          </button>
        </div>

        {/* Vehicle info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3" style={{ background: "linear-gradient(to top, rgba(14,24,35,0.95), transparent)" }}>
          <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}` }} className="rounded-xl px-3 py-2.5 flex items-center gap-3">
            <div style={{ background: "rgba(42,76,214,0.2)" }} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck size={15} color={C.blue} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span style={{ color: "white", fontFamily: "'Space Grotesk'" }} className="text-[12px] font-bold">MH-12 AB 7890</span>
                <Badge label="ON THE WAY" color="blue" />
              </div>
              <div className="text-white/50 text-[10px]">Prakash Yadav · 42 km/h · Updated 1m ago</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div style={{ color: C.success, fontFamily: "'Space Grotesk'" }} className="text-sm font-bold">14:45</div>
              <div className="text-white/40 text-[10px]">ETA</div>
            </div>
          </div>
          {/* Exception banner */}
          <div style={{ background: "rgba(255,179,0,0.15)", border: `1px solid rgba(255,179,0,0.3)` }} className="rounded-lg px-3 py-2 mt-2 flex items-center gap-2">
            <AlertTriangle size={13} color={C.warning} className="flex-shrink-0" />
            <span style={{ color: C.warning }} className="text-[11px] font-medium">8-minute delay — traffic obstruction on NH16</span>
          </div>
        </div>
      </div>

      {/* Delivery pipeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <SectionLabel>
          <span className="text-white/50">Delivery Pipeline — {deliveries.length} trips</span>
        </SectionLabel>
        {deliveries.map(d => {
          const meta = statusMeta[d.status as keyof typeof statusMeta];
          const isSel = selected === d.id;
          return (
            <div
              key={d.id}
              style={{ background: C.darkCard, border: `1px solid ${isSel ? C.blue : C.darkBorder}`, borderRadius: 12 }}
              className="overflow-hidden"
            >
              <button className="w-full text-left px-4 py-3" onClick={() => setSelected(isSel ? 0 : d.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ background: meta.bg, color: meta.color }} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-white text-[13px] font-semibold">{d.customer}</div>
                    <div className="text-white/50 text-[11px]">{d.material}</div>
                    <div className="text-white/40 text-[11px]">{d.site}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {d.eta && <div style={{ color: d.status === "delivered" ? C.success : "white", fontFamily: "'Space Grotesk'" }} className="text-sm font-bold">{d.eta}</div>}
                    <div className="text-white/40 text-[10px]">{d.status === "delivered" ? "Delivered" : "ETA"}</div>
                  </div>
                </div>
                {d.driver ? (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div style={{ background: "rgba(255,255,255,0.08)" }} className="w-5 h-5 rounded-full flex items-center justify-center">
                      <User size={10} color="rgba(255,255,255,0.5)" />
                    </div>
                    <span style={{ fontFamily: "'Space Grotesk'" }} className="text-white/50 text-[11px]">{d.driver} · {d.vehicle}</span>
                  </div>
                ) : (
                  <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 6 }} className="mt-2 px-2 py-1 inline-flex items-center gap-1">
                    <AlertCircle size={10} color={C.error} />
                    <span style={{ color: C.error }} className="text-[10px] font-semibold">No driver assigned</span>
                  </div>
                )}
              </button>
              {isSel && (
                <div style={{ borderTop: `1px solid ${C.darkBorder}` }} className="px-4 py-3 flex flex-col gap-2">
                  {d.status === "awaiting" && (
                    <button onClick={() => setShowAssign(true)} style={{ background: C.blue }} className="w-full py-2.5 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Users size={13} /> Assign Driver & Vehicle
                    </button>
                  )}
                  {d.status === "delivered" && (
                    <button onClick={() => setShowPOD(true)} style={{ background: "rgba(16,185,129,0.15)", border: `1px solid ${C.success}40` }} className="w-full py-2.5 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5" style2={{ color: C.success }}>
                      <Eye size={13} color={C.success} />
                      <span style={{ color: C.success }}>View Proof of Delivery</span>
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.darkBorder}`, flex: 1 }} className="py-2.5 rounded-lg flex items-center justify-center gap-1">
                      <Phone size={12} color="rgba(255,255,255,0.5)" />
                      <span className="text-white/60 text-[11px]">Call</span>
                    </button>
                    <button style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.darkBorder}`, flex: 1 }} className="py-2.5 rounded-lg flex items-center justify-center gap-1">
                      <MessageSquare size={12} color="rgba(255,255,255,0.5)" />
                      <span className="text-white/60 text-[11px]">Message</span>
                    </button>
                    <button style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`, flex: 1 }} className="py-2.5 rounded-lg flex items-center justify-center gap-1">
                      <AlertTriangle size={12} color={C.error} />
                      <span style={{ color: C.error }} className="text-[11px]">Escalate</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* POD sheet */}
      {showPOD && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div style={{ background: C.darkCard, borderTop: `1px solid ${C.darkBorder}` }} className="rounded-t-2xl p-5 max-h-[70%] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white text-base font-bold">Proof of Delivery</span>
              <button onClick={() => setShowPOD(false)}><X size={20} color="rgba(255,255,255,0.5)" /></button>
            </div>
            <div style={{ background: "rgba(16,185,129,0.1)", borderRadius: 10 }} className="p-3 mb-4 flex items-center gap-2">
              <CheckCircle size={16} color={C.success} />
              <span style={{ color: C.success }} className="text-sm font-semibold">Delivered Successfully</span>
            </div>
            {[
              { label: "Recipient", value: "Vikram Shyam (Store Manager)" },
              { label: "Timestamp", value: "10 Jul 2025, 11:28:45 IST" },
              { label: "GPS Location", value: "18.5089°N, 73.8122°E" },
              { label: "Qty Delivered", value: "5 Tonnes (as per PO)" },
              { label: "Audit Record", value: "#DEL-2025-1042" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${C.darkBorder}` }}>
                <span className="text-white/50 text-xs">{label}</span>
                <span style={{ color: "white", fontFamily: label === "Audit Record" || label === "Timestamp" ? "'Space Grotesk'" : undefined }} className="text-xs font-semibold text-right max-w-[55%]">{value}</span>
              </div>
            ))}
            <div className="mt-4 flex gap-2">
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, flex: 1, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="text-white/30 text-[11px]">Signature captured</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, flex: 1, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="text-white/30 text-[11px]">Photo on file</span>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8 }} className="px-3 py-2 mt-3">
              <span className="text-white/40 text-[10px]">Immutable record · Cannot be modified · Synced to audit log</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const [showDeactivate, setShowDeactivate] = useState(false);

  const sections = [
    {
      title: "BUSINESS",
      items: [
        { icon: Building2, label: "Business Profile", sub: "Shri Krishna Traders" },
        { icon: FileText, label: "Invoice Configuration", sub: "Letterhead, serial, terms" },
        { icon: IndianRupee, label: "Tax Settings", sub: "GSTIN, HSN codes, GST rates" },
        { icon: Star, label: "Payment Methods", sub: "UPI, NEFT, Cheque, Cash" },
        { icon: Warehouse, label: "Warehouses & Locations", sub: "Godown A, Main Yard, Godown B" },
      ],
    },
    {
      title: "TEAM",
      items: [
        { icon: Users, label: "Staff Directory", sub: "12 active members" },
        { icon: Shield, label: "Roles & Permissions", sub: "Owner, Accountant, Warehouse, Dispatch" },
        { icon: CheckCircle, label: "Approval Limits", sub: "Invoice: ₹5L · Payment: ₹2L" },
        { icon: Clock, label: "Pending Access Requests", sub: "2 pending", badge: "2" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { icon: Settings, label: "Device & Session", sub: "2 active sessions" },
        { icon: RefreshCw, label: "Sync History", sub: "Last synced 2 min ago" },
        { icon: Download, label: "Backup Status", sub: "Auto-backup ON · Daily 2 AM" },
        { icon: Bell, label: "Notification Preferences", sub: "Collections, Stock, Deliveries" },
        { icon: Eye, label: "Language", sub: "English (Marathi coming soon)" },
        { icon: Shield, label: "Security & Authentication", sub: "PIN + Biometric enabled" },
        { icon: Share2, label: "Data Export", sub: "Excel, PDF, Tally-compatible" },
        { icon: HelpCircle, label: "Help & Support", sub: "Chat, call, knowledge base" },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-0 pb-4">
      {/* Header */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 999 }} className="w-14 h-14 flex items-center justify-center">
            <span className="text-white text-xl font-bold">RK</span>
          </div>
          <div>
            <div className="text-white text-base font-bold">Ramesh Kumar</div>
            <div className="text-white/60 text-xs">Owner · Admin</div>
            <div className="text-white/50 text-[11px] mt-0.5">+91 98765 00001</div>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10 }} className="mt-4 px-4 py-3">
          <div className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Business</div>
          <div className="text-white text-[13px] font-semibold">Shri Krishna Traders</div>
          <div className="text-white/60 text-[11px]">GSTIN: 27AABFR5987M1ZP</div>
          <div className="text-white/50 text-[11px]">Plot 14, Bhosari MIDC, Pune 411026</div>
        </div>
      </div>

      {/* Subscription status */}
      <div className="px-4 py-3">
        <div style={{ background: "#ECFDF5", border: `1px solid ${C.success}30`, borderRadius: 12 }} className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} color={C.success} />
            <div>
              <div style={{ color: "#065F46" }} className="text-xs font-bold">Pro Plan · Active</div>
              <div style={{ color: "#6EE7B7" }} className="text-[10px]">Renews 10 Jan 2026</div>
            </div>
          </div>
          <button style={{ background: C.success }} className="px-3 py-1 rounded-lg text-white text-[11px] font-semibold">Manage</button>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {sections.map(section => (
          <div key={section.title}>
            <SectionLabel>{section.title}</SectionLabel>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }}>
              {section.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    {i > 0 && <Divider />}
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                      <div style={{ background: C.surface }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon size={15} color={C.muted} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ color: C.ink }} className="text-[13px] font-medium">{item.label}</div>
                        <div style={{ color: C.muted }} className="text-[11px]">{item.sub}</div>
                      </div>
                      {(item as any).badge && (
                        <span style={{ background: C.error }} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {(item as any).badge}
                        </span>
                      )}
                      <ChevronRight size={14} color={C.muted} className="flex-shrink-0" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Danger zone */}
        <div>
          <SectionLabel>ACCOUNT</SectionLabel>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }}>
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5"
              onClick={() => setShowDeactivate(true)}
            >
              <div style={{ background: "#FEF2F2" }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Users size={15} color={C.error} />
              </div>
              <div className="flex-1">
                <div style={{ color: C.error }} className="text-[13px] font-medium text-left">Deactivate User</div>
                <div style={{ color: C.muted }} className="text-[11px]">Remove access for a staff member</div>
              </div>
              <ChevronRight size={14} color={C.muted} />
            </button>
            <Divider />
            <button className="w-full flex items-center gap-3 px-4 py-3.5">
              <div style={{ background: "#FEF2F2" }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                <LogOut size={15} color={C.error} />
              </div>
              <div className="flex-1 text-left">
                <div style={{ color: C.error }} className="text-[13px] font-medium">Sign Out</div>
                <div style={{ color: C.muted }} className="text-[11px]">This device only</div>
              </div>
            </button>
          </div>
        </div>
        <div style={{ color: C.muted }} className="text-center text-[11px] pb-2">Apni Estate v2.4.1 · Build 20250710</div>
      </div>

      {/* Deactivate dialog */}
      {showDeactivate && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: C.white, borderRadius: 16 }} className="w-full p-5">
            <div style={{ background: "#FEF2F2" }} className="w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle size={22} color={C.error} />
            </div>
            <div style={{ color: C.ink }} className="text-base font-bold mb-1">Deactivate User?</div>
            <p style={{ color: C.muted }} className="text-sm mb-4">This will immediately revoke access for Suresh Patil (Warehouse). This action will appear in the audit log.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeactivate(false)} style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }} className="py-3 rounded-xl text-sm font-semibold" style2={{ color: C.ink }}>
                <span style={{ color: C.ink }}>Cancel</span>
              </button>
              <button onClick={() => setShowDeactivate(false)} style={{ background: C.error, flex: 1 }} className="py-3 rounded-xl text-white text-sm font-semibold">
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "finance", label: "Finance", icon: BarChart2 },
  { id: "stock", label: "Stock", icon: Package },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "profile", label: "Profile", icon: User },
];

const badges: Record<string, number> = { finance: 2, stock: 8, delivery: 3 };

// ─── App shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = activeTab === "delivery";

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#D4CFC0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Device frame */}
      <div
        style={{
          width: 360,
          height: 800,
          background: isDark ? C.dark : C.bg,
          borderRadius: 36,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 8px #1A1A1A, 0 0 0 10px #333",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Status bar */}
        <div
          style={{
            height: 44,
            background: isDark ? C.dark : C.bg,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: 20,
            paddingRight: 20,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          }}
        />

        {/* Content */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            position: "relative",
          }}
          className="flex flex-col"
        >
          {activeTab === "home" && <HomeTab onNavigate={handleNavigate} />}
          {activeTab === "finance" && <FinanceTab />}
          {activeTab === "stock" && <StockTab />}
          {activeTab === "delivery" && <DeliveryTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>

        {/* Bottom nav */}
        <div
          style={{
            background: isDark ? "#0E1823" : C.white,
            borderTop: `1px solid ${isDark ? C.darkBorder : C.border}`,
            flexShrink: 0,
            paddingBottom: 16,
          }}
        >
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const badge = badges[tab.id];
              const activeColor = isDark ? "#60A5FA" : C.blue;
              const inactiveColor = isDark ? "rgba(255,255,255,0.35)" : C.muted;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavigate(tab.id)}
                  className="flex-1 flex flex-col items-center gap-1 pt-3 pb-1 relative"
                >
                  <div className="relative">
                    <Icon size={20} color={isActive ? activeColor : inactiveColor} strokeWidth={isActive ? 2.5 : 1.8} />
                    {badge && !isActive && (
                      <span
                        style={{ background: C.error, fontSize: 9, minWidth: 16, height: 16, lineHeight: "16px" }}
                        className="absolute -top-1.5 -right-1.5 rounded-full text-white font-bold text-center px-0.5"
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? activeColor : inactiveColor,
                    }}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 32,
                        height: 3,
                        background: activeColor,
                        borderRadius: "0 0 4px 4px",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
