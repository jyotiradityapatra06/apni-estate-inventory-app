import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertTriangle, CalendarClock, IndianRupee, Users, ArrowLeft, Landmark, BarChart, Search, Filter } from "lucide-react";
import { financialApi } from "../../api/financial.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { AgeingReport } from "../../features/financials/AgeingReport";
import { PaymentModal } from "../../features/financials/PaymentModal";
import { MobileDataCard } from "../../app/components/mobile/MobileDataCard";
import { MobileFilterDrawer } from "../../app/components/mobile/MobileFilterDrawer";
import { fmt } from "../../utils/currency";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { StatCard } from "../../app/components/common/Card";

export default function ReceivablesPage() {
  const navigate = useNavigate();
  const [d, setD] = useState<any>();
  const [pay, setPay] = useState<any>();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [ageingFilter, setAgeingFilter] = useState("ALL");
  const [draftAgeing, setDraftAgeing] = useState("ALL");

  const load = () => financialApi.receivables().then(r => setD(r.data));

  useEffect(() => {
    void load();
  }, []);

  if (!d) return <div className="h-56 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Loading receivables" />;
  const s = d.summary;

  const getAgeingBadge = (days: number) => {
    if (days <= 30) return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">0-30 Days</span>;
    if (days <= 60) return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">31-60 Days</span>;
    if (days <= 90) return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100">61-90 Days</span>;
    return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">90+ Days</span>;
  };

  const filteredCustomers = (d.customers || []).filter((c: any) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [c.name, c.phone].some((v: string) => v?.toLowerCase().includes(q));
    const ageDays = c.invoices[0]?.ageDays || 0;

    let matchesAgeing = true;
    if (ageingFilter === "0_30") matchesAgeing = ageDays <= 30;
    else if (ageingFilter === "31_60") matchesAgeing = ageDays > 30 && ageDays <= 60;
    else if (ageingFilter === "61_90") matchesAgeing = ageDays > 60 && ageDays <= 90;
    else if (ageingFilter === "90_PLUS") matchesAgeing = ageDays > 90;

    return matchesSearch && matchesAgeing;
  });

  const filtersPanel = (
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ageing Bracket
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
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <Link to="/financials/payments" className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer">
        <ArrowLeft size={14}/>
        Back to Finance
      </Link>

      <PageHeader title="Receivables" description="Customer amounts you still need to receive." />

      {/* Mobile Finance Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Receivables Summary</span>
          {s.overdue > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-600 border border-red-100">
              Overdue: {fmt(s.overdue)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Due</span>
            <strong className="text-base font-black text-slate-900 mt-0.5 block">{fmt(s.totalReceivable)}</strong>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Due Today</span>
            <strong className="text-base font-black text-slate-900 mt-0.5 block">{fmt(s.dueToday)}</strong>
          </div>
          <div className="p-2.5 bg-red-50/50 rounded-xl border border-red-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Overdue</span>
            <strong className="text-base font-black text-red-600 mt-0.5 block">{fmt(s.overdue)}</strong>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Pending Customers</span>
            <strong className="text-base font-black text-slate-900 mt-0.5 block">{s.customersPending}</strong>
          </div>
        </div>
      </div>

      <AgeingReport rows={d.ageing} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Customer Outstanding Accounts</h3>
          
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search customer name or phone" 
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 h-9 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <button 
              onClick={() => { setDraftAgeing(ageingFilter); setFilterOpen(true); }} 
              className="flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer shrink-0"
            >
              <Filter size={14}/>
              Filter
              {ageingFilter !== "ALL" && <span className="rounded-full bg-orange-600 px-1.5 py-0.5 text-[9px] text-white">1</span>}
            </button>
          </div>
        </div>
        
        {filteredCustomers.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="font-extrabold text-sm text-slate-900">No pending customer payments</p>
            <p className="text-xs text-slate-400">All customer accounts are settled and up to date.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table Viewport (>=768px) */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-100 md:block">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    {["Customer", "Total Invoice Amount", "Amount Paid", "Pending Due", "Ageing", "Actions"].map((h) => (
                      <th key={h} className="p-3 font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c: any) => {
                    const totalInvoiceAmt = c.invoices.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount || 0), 0);
                    const totalPaidAmt = totalInvoiceAmt - Number(c.amountDue);
                    const ageDays = c.invoices[0]?.ageDays || 0;

                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <Link className="font-bold text-slate-900 hover:text-orange-600 transition-colors" to={`/customers/${c.id}`}>
                            {c.name}
                          </Link>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{c.phone}</p>
                        </td>
                        <td className="text-slate-600 font-semibold">{fmt(totalInvoiceAmt)}</td>
                        <td className="text-green-700 font-semibold">{fmt(totalPaidAmt)}</td>
                        <td className="font-black text-red-600">{fmt(c.amountDue)}</td>
                        <td>{getAgeingBadge(ageDays)}</td>
                        <td className="p-3">
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
                    badge={getAgeingBadge(ageDays)}
                    onClick={() => navigate(`/financials/customers/${c.id}`)}
                    primaryMetric={{
                      label: "Pending Customer Due",
                      value: <span className="text-red-600 font-black">{fmt(c.amountDue)}</span>,
                      helper: ageDays > 60 ? "Overdue Balance" : "Current Account"
                    }}
                    secondaryMetrics={[
                      { label: "Total Billed", value: fmt(totalInvoiceAmt) },
                      { label: "Total Paid", value: fmt(totalPaidAmt) }
                    ]}
                    actions={
                      <>
                        {hasPermission(user, "financials:manage") && c.invoices[0] && (
                          <button 
                            onClick={() => setPay({ customerId: c.id, invoiceId: c.invoices[0].id, balance: c.invoices[0].amountDue })} 
                            className="flex-1 min-h-[44px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs font-bold text-white cursor-pointer press-active"
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

      {pay && (
        <PaymentModal {...pay} onClose={() => setPay(null)} onDone={() => { setPay(null); load(); }} />
      )}
    </div>
  );
}

