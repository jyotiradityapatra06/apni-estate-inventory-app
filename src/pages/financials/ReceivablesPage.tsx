import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertTriangle, CalendarClock, IndianRupee, Users, ArrowLeft, Search, Filter, ShieldAlert, DollarSign } from "lucide-react";
import { financialApi } from "../../api/financial.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { AgeingReport } from "../../features/financials/AgeingReport";
import { PaymentModal } from "../../features/financials/PaymentModal";
import { MobileDataCard } from "../../app/components/mobile/MobileDataCard";
import { MobileFilterDrawer } from "../../app/components/mobile/MobileFilterDrawer";
import { fmt } from "../../utils/currency";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";

export default function ReceivablesPage() {
  const navigate = useNavigate();
  const [d, setD] = useState<any>();
  const [pay, setPay] = useState<any>();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [ageingFilter, setAgeingFilter] = useState("ALL");
  const [draftAgeing, setDraftAgeing] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = () => financialApi.receivables().then((r) => setD(r.data));

  useEffect(() => {
    void load();
  }, []);

  if (!d) return <div className="h-56 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Loading receivables" />;
  const s = d.summary || {};

  const getAgeingBadge = (days: number) => {
    if (days <= 30) return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">0-30 Days</span>;
    if (days <= 60) return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">31-60 Days</span>;
    if (days <= 90) return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100">61-90 Days</span>;
    return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">90+ Days</span>;
  };

  const getCollectionBadge = (status: string) => {
    switch (status) {
      case "HIGH_RISK":
        return <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-800 border border-red-200 uppercase">HIGH RISK</span>;
      case "OVERDUE":
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200 uppercase">OVERDUE</span>;
      case "DUE":
        return <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800 border border-blue-200 uppercase">DUE</span>;
      case "CURRENT":
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200 uppercase">CURRENT</span>;
    }
  };

  const filteredCustomers = (d.customers || []).filter((c: any) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [c.name, c.phone, c.customerCode].some((v: string) => v?.toLowerCase().includes(q));
    const ageDays = c.invoices[0]?.ageDays || 0;

    let matchesAgeing = true;
    if (ageingFilter === "0_30") matchesAgeing = ageDays <= 30;
    else if (ageingFilter === "31_60") matchesAgeing = ageDays > 30 && ageDays <= 60;
    else if (ageingFilter === "61_90") matchesAgeing = ageDays > 60 && ageDays <= 90;
    else if (ageingFilter === "90_PLUS") matchesAgeing = ageDays > 90;

    let matchesStatus = true;
    if (statusFilter !== "ALL") {
      matchesStatus = c.collectionStatus === statusFilter;
    }

    return matchesSearch && matchesAgeing && matchesStatus;
  });

  const filtersPanel = (
    <div className="space-y-4">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
        Ageing Bracket
        <select
          value={draftAgeing}
          onChange={(e) => setDraftAgeing(e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="ALL">All Ageing Brackets</option>
          <option value="0_30">0-30 Days (Current)</option>
          <option value="31_60">31-60 Days</option>
          <option value="61_90">61-90 Days</option>
          <option value="90_PLUS">90+ Days (Overdue)</option>
        </select>
      </label>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <Link to="/financials/payments" className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer">
        <ArrowLeft size={14} />
        Back to Finance
      </Link>

      <PageHeader title="Receivables Dashboard" description="Customer collection status, ageing analysis, and outstanding dues." />

      {/* Enhanced Collection KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Receivable</span>
          <strong className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">{fmt(s.totalReceivable)}</strong>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">{s.customersPending || 0} customers pending</span>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-red-700 block">Overdue Amount</span>
          <strong className="text-xl sm:text-2xl font-black text-red-600 mt-1 block">{fmt(s.overdue)}</strong>
          <span className="text-[10px] font-bold text-red-700 mt-0.5 block">{s.overduePercentage || 0}% of total receivables</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Due Today</span>
          <strong className="text-xl sm:text-2xl font-black text-amber-700 mt-1 block">{fmt(s.dueToday)}</strong>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Requires immediate action</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pending Customers</span>
          <strong className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">{s.customersPending || 0}</strong>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Accounts with balance</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">Overdue Accounts</span>
          <strong className="text-xl sm:text-2xl font-black text-amber-800 mt-1 block">{s.overdueCustomersCount || 0}</strong>
          <span className="text-[10px] font-bold text-amber-700 mt-0.5 block">Past credit terms</span>
        </div>
      </div>

      <AgeingReport rows={d.ageing} />

      {/* Customer Accounts Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Customer Collection Accounts</h3>

          <div className="flex flex-wrap gap-2.5">
            <div className="relative min-w-0 flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, or code…"
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 h-11 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Collection Statuses</option>
              <option value="CURRENT">Current</option>
              <option value="DUE">Due</option>
              <option value="OVERDUE">Overdue</option>
              <option value="HIGH_RISK">High Risk</option>
            </select>

            <button
              onClick={() => {
                setDraftAgeing(ageingFilter);
                setFilterOpen(true);
              }}
              className="flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer shrink-0"
            >
              <Filter size={14} />
              Filter
              {ageingFilter !== "ALL" && <span className="rounded-full bg-orange-600 px-1.5 py-0.5 text-[9px] text-white">1</span>}
            </button>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="font-bold text-sm text-slate-900">No pending customer accounts match criteria</p>
            <p className="text-xs text-slate-400">All customer accounts in this filter are fully settled.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table Viewport (>=768px) */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-100 md:block">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    {["Customer", "Total Billed", "Amount Paid", "Pending Dues", "Ageing", "Status", "Actions"].map((h) => (
                      <th key={h} className="p-3.5 font-bold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((c: any) => {
                    const totalInvoiceAmt = c.invoices.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount || 0), 0);
                    const totalPaidAmt = totalInvoiceAmt - Number(c.amountDue);
                    const ageDays = c.invoices[0]?.ageDays || 0;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors font-semibold text-slate-800">
                        <td className="p-3.5">
                          <Link className="font-bold text-slate-900 hover:text-orange-600 transition-colors" to={`/customers/${c.id}`}>
                            {c.name}
                          </Link>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{c.phone || "No phone"} {c.customerCode ? `• ${c.customerCode}` : ""}</p>
                        </td>
                        <td className="p-3.5 text-slate-600">{fmt(totalInvoiceAmt)}</td>
                        <td className="p-3.5 text-emerald-700 font-bold">{fmt(totalPaidAmt)}</td>
                        <td className="p-3.5 font-black text-red-600 text-sm">{fmt(c.amountDue)}</td>
                        <td className="p-3.5">{getAgeingBadge(ageDays)}</td>
                        <td className="p-3.5">{getCollectionBadge(c.collectionStatus || "CURRENT")}</td>
                        <td className="p-3.5">
                          <div className="flex gap-2">
                            {hasPermission(user, "financials:manage") && c.invoices[0] && (
                              <button
                                onClick={() => setPay({ customerId: c.id, invoiceId: c.invoices[0].id, balance: c.invoices[0].amountDue })}
                                className="min-h-8 rounded-lg bg-orange-600 hover:bg-orange-700 px-3 text-[10px] font-bold text-white transition-colors cursor-pointer"
                              >
                                Receive Payment
                              </button>
                            )}
                            <Link
                              to={`/financials/customers/${c.id}`}
                              className="min-h-8 inline-flex items-center rounded-lg border border-slate-200 hover:bg-slate-50 px-3 text-[10px] font-bold text-slate-700 transition-colors"
                            >
                              View Ledger
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Reusable Card Viewport (<768px) */}
            <div className="space-y-3.5 md:hidden">
              {filteredCustomers.map((c: any) => {
                const totalInvoiceAmt = c.invoices.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount || 0), 0);
                const totalPaidAmt = totalInvoiceAmt - Number(c.amountDue);
                const ageDays = c.invoices[0]?.ageDays || 0;

                return (
                  <MobileDataCard
                    key={c.id}
                    title={c.name}
                    subtitle={`Phone: ${c.phone || "No contact"}`}
                    badge={
                      <div className="flex gap-1">
                        {getCollectionBadge(c.collectionStatus || "CURRENT")}
                        {getAgeingBadge(ageDays)}
                      </div>
                    }
                    onClick={() => navigate(`/financials/customers/${c.id}`)}
                    primaryMetric={{
                      label: "Pending Customer Due",
                      value: <span className="text-red-600 font-black">{fmt(c.amountDue)}</span>,
                      helper: c.collectionStatus === "HIGH_RISK" ? "High Risk Dues" : "Current Account",
                    }}
                    secondaryMetrics={[
                      { label: "Total Billed", value: fmt(totalInvoiceAmt) },
                      { label: "Total Paid", value: fmt(totalPaidAmt) },
                    ]}
                    actions={
                      <>
                        {hasPermission(user, "financials:manage") && c.invoices[0] && (
                          <button
                            onClick={() => setPay({ customerId: c.id, invoiceId: c.invoices[0].id, balance: c.invoices[0].amountDue })}
                            className="flex-1 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white cursor-pointer press-active"
                          >
                            Receive Payment
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/financials/customers/${c.id}`)}
                          className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
                        >
                          View Ledger
                        </button>
                      </>
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Reusable Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Receivables"
        subtitle="Filter receivables by ageing bracket"
        activeFilterCount={ageingFilter !== "ALL" ? 1 : 0}
        onReset={() => {
          setDraftAgeing("ALL");
          setAgeingFilter("ALL");
        }}
        onApply={() => {
          setAgeingFilter(draftAgeing);
          setFilterOpen(false);
        }}
      >
        {filtersPanel}
      </MobileFilterDrawer>

      {pay && <PaymentModal {...pay} onClose={() => setPay(null)} onDone={() => { setPay(null); load(); }} />}
    </div>
  );
}
