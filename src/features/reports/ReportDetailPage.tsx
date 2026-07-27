import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { reportApi, type ReportResponse } from "../../api/report.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { fmt } from "../../utils/currency";
import { reportConfigs, type ReportKey } from "./report.config";
import { ArrowLeft, Printer, FileDown, ShieldCheck, AlertCircle, Building2, HelpCircle } from "lucide-react";
import { ReportWarningBanner } from "../../components/reports/ReportWarningBanner";
import { ReportMobileCard } from "../../components/reports/ReportMobileCard";
import { ReportCharts } from "../../components/reports/ReportCharts";
import { ReportKpiSection } from "./components/ReportKpiSection";
import { ReportFilterBar } from "./components/ReportFilterBar";
import { ReportEmptyState } from "./components/ReportEmptyState";

const local = (d: Date) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};

const month = () => {
  const d = new Date();
  return {
    from: local(new Date(d.getFullYear(), d.getMonth(), 1)),
    to: local(d),
  };
};

const human = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, (x) => x.toUpperCase());
const number = (v: unknown) => (typeof v === "number" || !Number.isNaN(Number(v)) ? fmt(Number(v)) : String(v ?? "—"));

export function ReportDetailPage({ type }: { type: ReportKey | "itc-tracker" | "rcm" | "tds-tcs" }) {
  const isCustomSpecial = type === "itc-tracker" || type === "rcm" || type === "tds-tcs";
  const apiEndpoint = type === "itc-tracker" || type === "rcm" || type === "tds-tcs" ? "gst-summary" : type;
  
  const config = isCustomSpecial
    ? {
        title: type === "itc-tracker" ? "GST Inward Supply / ITC Tracker" : type === "rcm" ? "Reverse Charge Mechanism (RCM) Analytics" : "TDS / TCS Compliance Dashboard",
        description: type === "itc-tracker"
          ? "Input Tax Credit tracking on purchases and business expenses."
          : type === "rcm"
          ? "Reverse Charge Mechanism liability and supplier compliance tracking."
          : "Tax Deducted at Source (TDS) & Tax Collected at Source (TCS) ledger analytics.",
        source: undefined,
      }
    : reportConfigs[type as ReportKey];

  const initial = !isCustomSpecial && (config as any).currentState ? { from: "", to: "" } : month();
  const navigate = useNavigate();

  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [status, setStatus] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [godownId, setGodownId] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReportResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const q = new URLSearchParams({ page: String(page), limit: "20" });
    if (from) q.set("from", from);
    if (to) q.set("to", `${to}T23:59:59.999`);
    if (status) q.set("status", status);
    if (invoiceType) q.set("invoiceType", invoiceType);
    if (paymentMode) q.set("paymentMode", paymentMode);
    if (materialId) q.set("materialId", materialId);
    if (categoryId) q.set("categoryId", categoryId);
    if (supplierId) q.set("supplierId", supplierId);
    if (godownId) q.set("godownId", godownId);
    return q;
  }, [from, to, status, invoiceType, paymentMode, materialId, categoryId, supplierId, godownId, page]);

  const load = () => {
    setLoading(true);
    setError("");
    reportApi
      .get(apiEndpoint, query.toString())
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [apiEndpoint, query.toString()]);

  const preset = (value: string) => {
    const d = new Date();
    if (value === "month") {
      const x = month();
      setFrom(x.from);
      setTo(x.to);
    } else if (value === "today") {
      setFrom(local(d));
      setTo(local(d));
    } else if (value === "week") {
      const x = new Date(d);
      x.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      setFrom(local(x));
      setTo(local(d));
    } else if (value === "last-month") {
      setFrom(local(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
      setTo(local(new Date(d.getFullYear(), d.getMonth(), 0)));
    } else if (value === "fy") {
      const y = d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
      setFrom(`${y}-04-01`);
      setTo(local(d));
    }
    setPage(1);
  };

  const reset = () => {
    const x = !isCustomSpecial && (config as any).currentState ? { from: "", to: "" } : month();
    setFrom(x.from);
    setTo(x.to);
    setStatus("");
    setInvoiceType("");
    setPaymentMode("");
    setMaterialId("");
    setCategoryId("");
    setSupplierId("");
    setGodownId("");
    setHsnCode("");
    setPage(1);
  };

  const download = async () => {
    const q = new URLSearchParams(query);
    q.set("format", "csv");
    q.set("limit", "100");
    const base = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
    const response = await fetch(`${base}/reports/${apiEndpoint}?${q}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    if (!response.ok) throw new Error("CSV export failed.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const keys = data?.rows[0]
    ? Object.keys(data.rows[0])
        .filter((k) => k !== "id" && typeof data.rows[0][k] !== "object")
        .slice(0, 9)
    : [];

  return (
    <div className="report-print-root space-y-6 pb-12">
      {/* Back navigation button */}
      <button
        onClick={() => navigate("/reports")}
        className="flex min-h-9 items-center gap-2 text-xs font-bold text-muted-foreground hover:text-orange-600 cursor-pointer report-actions dark:text-slate-300 dark:hover:text-orange-400"
      >
        <ArrowLeft size={14} />
        Back to Reports
      </button>

      {/* Header */}
      <div className="report-actions">
        <PageHeader
          title={config.title}
          description={config.description}
          actions={
            <div className="flex gap-2.5">
              <button
                onClick={() => window.print()}
                className="flex min-h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground shadow-2xs hover:bg-muted transition-colors cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Printer size={14} className="mr-1.5" />
                Print Report
              </button>
              <button
                onClick={() => void download().catch((e) => setError(e.message))}
                className="flex min-h-10 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer dark:bg-orange-600 dark:hover:bg-orange-500"
              >
                <FileDown size={14} className="mr-1.5" />
                Download CSV
              </button>
            </div>
          }
        />
      </div>

      {/* 1. KPI SUMMARY SECTION */}
      {data && (
        <ReportKpiSection
          type={type}
          summary={data.summary}
          breakdowns={data.breakdowns}
        />
      )}

      {/* 2. ADVANCED FILTER BAR */}
      <ReportFilterBar
        from={from}
        to={to}
        status={status}
        invoiceType={invoiceType}
        paymentMode={paymentMode}
        materialId={materialId}
        categoryId={categoryId}
        supplierId={supplierId}
        godownId={godownId}
        hsnCode={hsnCode}
        setFrom={(v) => { setFrom(v); setPage(1); }}
        setTo={(v) => { setTo(v); setPage(1); }}
        setStatus={(v) => { setStatus(v); setPage(1); }}
        setInvoiceType={(v) => { setInvoiceType(v); setPage(1); }}
        setPaymentMode={(v) => { setPaymentMode(v); setPage(1); }}
        setMaterialId={(v) => { setMaterialId(v); setPage(1); }}
        setCategoryId={(v) => { setCategoryId(v); setPage(1); }}
        setSupplierId={(v) => { setSupplierId(v); setPage(1); }}
        setGodownId={(v) => { setGodownId(v); setPage(1); }}
        setHsnCode={(v) => { setHsnCode(v); setPage(1); }}
        preset={preset}
        onReset={reset}
        onPrint={() => window.print()}
        onExportCsv={() => void download().catch((e) => setError(e.message))}
      />

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-red-800 text-xs font-bold border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
          {error}
        </p>
      )}

      {loading ? (
        <div className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : data && (
        <div className="space-y-6">
          <ReportWarningBanner
            classification={data.metadata.reportClassification}
            warnings={data.metadata.warnings}
          />

          {/* 3. INTERACTIVE CHARTS / VISUAL ANALYTICS */}
          <ReportCharts type={type} breakdowns={data.breakdowns} summary={data.summary} />

          {/* Specialized Compliance Banners & Empty States */}
          {type === "itc-tracker" && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/50 dark:bg-blue-950/30 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                  <ShieldCheck size={16} className="text-blue-600" />
                  Eligible ITC Summary
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-300 font-semibold leading-relaxed">
                  Input tax credit available from verified purchase orders and claimable business expenses.
                </p>
              </div>

              <div className="md:col-span-2">
                <ReportEmptyState
                  title="Blocked & Utilised ITC Notice"
                  description="Blocked ITC under Section 17(5) and GSTR-3B utilised ITC require direct GSTR-2B automated reconciliation."
                  backendInfo="Blocked ITC tracking, GSTR-2B inward auto-population, and ITC ledger reconciliation require dedicated backend GST filing module integration."
                  actionText="Reset Filters"
                  onAction={reset}
                  icon={AlertCircle}
                />
              </div>
            </div>
          )}

          {type === "tds-tcs" && (
            <div className="space-y-4">
              <ReportEmptyState
                title="TDS / TCS Compliance Ledger Required"
                description="Tax Deducted at Source (Section 194C / 194Q) and Tax Collected at Source (Section 206C) tracking."
                backendInfo="TDS/TCS tracking requires tax deduction ledger support and vendor PAN deduction threshold configuration in backend."
                actionText="Reset Filters"
                onAction={reset}
                icon={Building2}
              />
            </div>
          )}

          {type === "rcm" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-900/50 dark:bg-amber-950/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                <AlertCircle size={16} className="text-amber-600" />
                Pending Liability & RCM Compliance Alert
              </div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 leading-relaxed">
                Reverse Charge Mechanism liabilities calculated for purchases from unregistered suppliers without GSTIN. Advanced RCM self-invoice generation requires explicit RCM flag configuration on purchase entries.
              </p>
            </div>
          )}

          {/* Breakdowns List */}
          {Object.entries(data.breakdowns).slice(0, 3).map(([name, items]) => items.length > 0 && (
            <section key={name} className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3 text-xs">
              <h3 className="font-black text-foreground text-sm uppercase tracking-wider border-b pb-3 dark:text-slate-100 dark:border-slate-800">{human(name)}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.slice(0, 10).map((x) => (
                  <div key={x.name} className="flex justify-between items-center gap-3 rounded-xl bg-muted p-3.5 border border-border/80 font-semibold dark:bg-slate-800 dark:border-slate-700">
                    <span className="text-muted-foreground font-extrabold text-xs dark:text-slate-200">{x.name}</span>
                    <strong className="text-foreground font-black text-sm dark:text-slate-100">{number(x.total)}</strong>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* 4. DETAILED DATA TABLE / MOBILE CARDS */}
          {data.rows.length ? (
            <div className="space-y-4">
              <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100">
                Detailed Itemized Report Logs
              </h3>

              {/* Desktop Table View (>=768px) */}
              <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground border-b border-border dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
                    <tr>
                      {keys.map((k) => (
                        <th key={k} className="px-4 py-3.5 font-black text-[11px] uppercase tracking-wider">
                          {human(k)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={String(row.id || i)} className="border-b last:border-0 border-border hover:bg-muted/60 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/50">
                        {keys.map((k) => (
                          <td key={k} className="px-4 py-3.5 text-muted-foreground font-semibold dark:text-slate-300">
                            {String(row[k] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (<768px) */}
              <div className="grid gap-3.5 md:hidden">
                {data.rows.map((row, i) => (
                  <ReportMobileCard
                    key={String(row.id || i)}
                    type={type === "itc-tracker" || type === "rcm" || type === "tds-tcs" ? "gst-summary" : type}
                    row={row}
                    source={(config as any).source}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="report-actions flex items-center justify-between pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((x) => x - 1)}
                  className="min-h-10 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-40 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground font-medium dark:text-muted-foreground">
                  Page {page} of {data.pagination.pages}
                </span>
                <button
                  disabled={page >= data.pagination.pages}
                  onClick={() => setPage((x) => x + 1)}
                  className="min-h-10 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-40 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <ReportEmptyState
              title="No Log Records Found"
              description="No itemized detail logs were returned matching your date range and filters."
              actionText="Reset Filters"
              onAction={reset}
            />
          )}

          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider dark:text-muted-foreground">
            Generated {new Date(data.metadata.generatedAt).toLocaleString("en-IN")}
          </p>
        </div>
      )}
    </div>
  );
}

export default ReportDetailPage;
