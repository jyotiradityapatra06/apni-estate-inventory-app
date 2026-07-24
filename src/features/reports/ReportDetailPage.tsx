import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { reportApi, type ReportResponse } from "../../api/report.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { fmt } from "../../utils/currency";
import { reportConfigs, type ReportKey } from "./report.config";
import { ArrowLeft, Printer, FileDown, Search, Filter, Calendar, Landmark } from "lucide-react";
import { StatCard } from "../../app/components/common/Card";

const local = (d: Date) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};

const month = () => {
  const d = new Date();
  return {
    from: local(new Date(d.getFullYear(), d.getMonth(), 1)),
    to: local(d)
  };
};

const human = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, x => x.toUpperCase());
const number = (v: unknown) => typeof v === "number" || !Number.isNaN(Number(v)) ? fmt(Number(v)) : String(v ?? "—");

export function ReportDetailPage({ type }: { type: ReportKey }) {
  const config = reportConfigs[type];
  const initial = config.currentState ? { from: "", to: "" } : month();
  const navigate = useNavigate();

  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [status, setStatus] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
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
    return q;
  }, [from, to, status, invoiceType, paymentMode, page]);

  const load = () => {
    setLoading(true);
    setError("");
    reportApi.get(type, query.toString())
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [type, query.toString()]);

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
    const x = config.currentState ? { from: "", to: "" } : month();
    setFrom(x.from);
    setTo(x.to);
    setStatus("");
    setInvoiceType("");
    setPaymentMode("");
    setPage(1);
  };

  const download = async () => {
    const q = new URLSearchParams(query);
    q.set("format", "csv");
    q.set("limit", "100");
    const base = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
    const response = await fetch(`${base}/reports/${type}?${q}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`
      }
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

  const primitive = Object.entries(data?.summary || {}).filter(([, v]) => typeof v !== "object");
  const nested = Object.entries(data?.summary || {}).filter(([, v]) => typeof v === "object");
  const keys = data?.rows[0] ? Object.keys(data.rows[0]).filter(k => k !== "id" && typeof data.rows[0][k] !== "object").slice(0, 9) : [];

  return (
    <div className="report-print-root space-y-6 pb-12">
      {/* Back button */}
      <button 
        onClick={() => navigate("/reports")} 
        className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer report-actions"
      >
        <ArrowLeft size={14}/>
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
                className="flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Printer size={14} className="mr-1.5" />
                Print Report
              </button>
              <button 
                onClick={() => void download().catch(e => setError(e.message))} 
                className="flex min-h-10 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                <FileDown size={14} className="mr-1.5" />
                Download CSV
              </button>
            </div>
          }
        />
      </div>

      {/* Filters Bar */}
      <div className="report-actions rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Filter size={15} className="text-orange-500" />
            Report Filters & Date Preset
          </span>
          <button 
            onClick={reset} 
            className="text-xs font-extrabold text-orange-600 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select 
            aria-label="Date preset" 
            onChange={e => preset(e.target.value)} 
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
          >
            <option value="">Custom Date Range</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="fy">Financial Year (Apr-Mar)</option>
          </select>
          <input aria-label="From date" type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"/>
          <input aria-label="To date" type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"/>
          <input aria-label="Status filter" value={status} onChange={e => { setStatus(e.target.value.toUpperCase()); setPage(1); }} placeholder="Filter Status (e.g. PAID)" className="h-11 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"/>
          <select aria-label="Invoice type" value={invoiceType} onChange={e => { setInvoiceType(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer">
            <option value="">All Bill Types (GST & Non-GST)</option>
            <option value="GST">GST Tax Invoice Only</option>
            <option value="NON_GST">Non-GST Bill Only</option>
          </select>
          <button 
            onClick={reset} 
            className="h-11 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-4 text-red-800 text-xs font-bold border border-red-200">{error}</p>}

      {loading ? (
        <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
      ) : data && (
        <div className="space-y-6">
          {data.metadata.warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs space-y-1">
              <b className="font-black">{data.metadata.isEstimated ? "Estimated Management Report" : "Attention Notice"}</b>
              {data.metadata.warnings.map(w => <p key={w}>{w}</p>)}
            </div>
          )}

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {primitive.map(([k, v]) => (
              <StatCard 
                key={k} 
                label={human(k)} 
                value={typeof v === "number" ? number(v) : String(v ?? "—")} 
                icon={Landmark}
              />
            ))}
          </div>

          {/* Nested summaries */}
          {nested.map(([k, v]) => (
            <section key={k} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider border-b pb-3">{human(k)}</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {Object.entries(v as Record<string, unknown>).map(([a, b]) => (
                  <div key={a} className="border-b last:border-0 pb-2 md:border-b-0 md:pb-0">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">{human(a)}</span>
                    <strong className="text-slate-900 font-black text-sm mt-1 block">{number(b)}</strong>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Breakdowns */}
          {Object.entries(data.breakdowns).slice(0, 3).map(([name, items]) => items.length > 0 && (
            <section key={name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider border-b pb-3">{human(name)}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.slice(0, 10).map(x => (
                  <div key={x.name} className="flex justify-between items-center gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 font-semibold">
                    <span className="text-slate-700 font-extrabold text-xs">{x.name}</span>
                    <strong className="text-slate-950 font-black text-sm">{number(x.total)}</strong>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Detail Rows */}
          {data.rows.length ? (
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Detailed Itemized Report Logs</h3>
              
              {/* Desktop Table View (>=768px) */}
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      {keys.map(k => <th key={k} className="px-4 py-3.5 font-black text-[11px] text-slate-500 uppercase tracking-wider">{human(k)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={String(row.id || i)} className="border-b last:border-0 border-slate-100 hover:bg-slate-50/60 transition-colors">
                        {keys.map(k => <td key={k} className="px-4 py-3.5 text-slate-700 font-semibold">{String(row[k] ?? "—")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Reusable Card View (<768px) */}
              <div className="grid gap-3.5 md:hidden">
                {data.rows.map((row, i) => (
                  <article key={String(row.id || i)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs space-y-2.5">
                    {keys.slice(0, 6).map(k => (
                      <div key={k} className="flex justify-between items-center gap-3 py-1 border-b last:border-0 border-slate-100 font-semibold">
                        <span className="text-slate-400 uppercase text-[10px] font-black">{human(k)}</span>
                        <strong className="text-right text-slate-900 font-black text-xs">{String(row[k] ?? "—")}</strong>
                      </div>
                    ))}
                    {config.source && (
                      <Link to={config.source} className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-colors">
                        View Source Document Records →
                      </Link>
                    )}
                  </article>
                ))}
              </div>

              <div className="report-actions flex items-center justify-between pt-4">
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(x => x - 1)} 
                  className="min-h-10 rounded-xl border px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500 font-medium">Page {page} of {data.pagination.pages}</span>
                <button 
                  disabled={page >= data.pagination.pages} 
                  onClick={() => setPage(x => x + 1)} 
                  className="min-h-10 rounded-xl border px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500 text-xs font-bold">
              No report logs matching the chosen filter values.
            </div>
          )}
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Generated {new Date(data.metadata.generatedAt).toLocaleString("en-IN")}</p>
        </div>
      )}
    </div>
  );
}
export default ReportDetailPage;
