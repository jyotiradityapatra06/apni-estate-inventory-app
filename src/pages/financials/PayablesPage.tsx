import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertTriangle, CalendarClock, IndianRupee, Users, ArrowLeft, Factory, DollarSign, Search, Filter } from "lucide-react";
import { financialApi } from "../../api/financial.api";
import { purchaseApi } from "../../api/purchase.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { AgeingReport } from "../../features/financials/AgeingReport";
import { MobileDataCard } from "../../app/components/mobile/MobileDataCard";
import { MobileFilterDrawer } from "../../app/components/mobile/MobileFilterDrawer";
import { fmt } from "../../utils/currency";
import { StatCard } from "../../app/components/common/Card";

export default function PayablesPage() {
  const navigate = useNavigate();
  const [d, setD] = useState<any>();
  const [purchases, setPurchases] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [draftStatus, setDraftStatus] = useState("ALL");

  useEffect(() => {
    Promise.all([
      financialApi.payables(),
      purchaseApi.list().catch(() => ({ data: [] }))
    ])
      .then(([payablesRes, purchasesRes]) => {
        setD(payablesRes.data);
        setPurchases(purchasesRes.data || []);
      });
  }, []);

  if (!d) return <div className="h-56 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Loading payables" />;
  const s = d.summary;

  const filteredSuppliers = (d.suppliers || []).filter((x: any) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [x.name, x.phone].some((v: string) => v?.toLowerCase().includes(q));
    
    const supplierPurchases = purchases.filter(p => p.supplierId === x.id && p.status !== "CANCELLED");
    const totalPurchased = supplierPurchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const totalPaid = supplierPurchases.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const outstandingPayable = totalPurchased - totalPaid;

    let matchesStatus = true;
    if (statusFilter === "PENDING") matchesStatus = outstandingPayable > 0;
    else if (statusFilter === "SETTLED") matchesStatus = outstandingPayable <= 0;

    return matchesSearch && matchesStatus;
  });

  const filtersPanel = (
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Payable Status
      <select 
        value={draftStatus} 
        onChange={(e) => setDraftStatus(e.target.value)} 
        className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
      >
        <option value="ALL">All Supplier Accounts</option>
        <option value="PENDING">Pending Payables Only</option>
        <option value="SETTLED">Settled Accounts</option>
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

      <PageHeader title="Payables" description="Supplier amounts your business needs to pay." />

      {/* Mobile Finance Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Payables Summary</span>
          {s.overdue > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-600 border border-red-100">
              Overdue: {fmt(s.overdue)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div className="p-2.5 bg-red-50/50 rounded-xl border border-red-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Payable</span>
            <strong className="text-base font-black text-red-600 mt-0.5 block">{fmt(s.totalPayable)}</strong>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Due This Week</span>
            <strong className="text-base font-black text-slate-900 mt-0.5 block">{fmt(s.dueThisWeek)}</strong>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Overdue</span>
            <strong className="text-base font-black text-slate-900 mt-0.5 block">{fmt(s.overdue)}</strong>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Pending Suppliers</span>
            <strong className="text-base font-black text-slate-900 mt-0.5 block">{s.suppliersPending}</strong>
          </div>
        </div>
      </div>

      <AgeingReport rows={d.ageing} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Supplier Outstanding Payables</h3>
          
          <div className="flex gap-2.5">
            <div className="relative min-w-0 flex-1 sm:w-80">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18}/>
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search supplier name, phone, or GSTIN…" 
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 h-11 text-sm sm:text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
              />
            </div>
            <button 
              onClick={() => { setDraftStatus(statusFilter); setFilterOpen(true); }} 
              className="flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer shrink-0"
            >
              <Filter size={14}/>
              Filter
              {statusFilter !== "ALL" && <span className="rounded-full bg-orange-600 px-1.5 py-0.5 text-[9px] text-white">1</span>}
            </button>
          </div>
        </div>
        
        {filteredSuppliers.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="font-extrabold text-sm text-slate-900">No pending supplier payments</p>
            <p className="text-xs text-slate-400">All supplier PO accounts are settled and up to date.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table Viewport (>=768px) */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-100 md:block">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    {["Supplier", "Purchase Volume", "Amount Paid", "Pending Payable", "Payment Terms", "Actions"].map((h) => (
                      <th key={h} className="p-3 font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((x: any) => {
                    const supplierPurchases = purchases.filter(p => p.supplierId === x.id && p.status !== "CANCELLED");
                    const totalPurchased = supplierPurchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
                    const totalPaid = supplierPurchases.reduce((sum, p) => sum + Number(p.amountPaid), 0);
                    const outstandingPayable = totalPurchased - totalPaid;
                    const pendingPO = supplierPurchases.find(p => Number(p.balanceDue) > 0);

                    return (
                      <tr key={x.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <Link className="font-bold text-slate-900 hover:text-orange-600 transition-colors" to={`/suppliers/${x.id}`}>
                            {x.name}
                          </Link>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{x.phone || "No contact logged"}</p>
                        </td>
                        <td className="text-slate-600 font-semibold">{fmt(totalPurchased)}</td>
                        <td className="text-green-700 font-semibold">{fmt(totalPaid)}</td>
                        <td className="font-black text-red-600">{fmt(outstandingPayable)}</td>
                        <td className="text-slate-500 font-medium">{x.paymentTerms || "30 Days"}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {outstandingPayable > 0 && pendingPO && (
                              <button 
                                onClick={() => navigate(`/purchases/${pendingPO.id}`)} 
                                className="min-h-8 rounded-lg bg-orange-600 hover:bg-orange-700 px-3 text-[10px] font-bold text-white transition-colors cursor-pointer"
                              >
                                Pay Supplier
                              </button>
                            )}
                            <Link 
                              to={`/suppliers/${x.id}`} 
                              className="min-h-8 inline-flex items-center rounded-lg border border-slate-200 hover:bg-slate-50 px-3 text-[10px] font-bold text-slate-700 transition-colors"
                            >
                              View Transactions
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
              {filteredSuppliers.map((x: any) => {
                const supplierPurchases = purchases.filter(p => p.supplierId === x.id && p.status !== "CANCELLED");
                const totalPurchased = supplierPurchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
                const totalPaid = supplierPurchases.reduce((sum, p) => sum + Number(p.amountPaid), 0);
                const outstandingPayable = totalPurchased - totalPaid;
                const pendingPO = supplierPurchases.find(p => Number(p.balanceDue) > 0);

                return (
                  <MobileDataCard
                    key={x.id}
                    title={x.name}
                    subtitle={`Phone: ${x.phone || "No contact"}`}
                    badge={
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
                        {x.paymentTerms || "30 Days"}
                      </span>
                    }
                    onClick={() => navigate(`/suppliers/${x.id}`)}
                    primaryMetric={{
                      label: "Pending Supplier Payable",
                      value: <span className="text-red-600 font-black">{fmt(outstandingPayable)}</span>,
                      helper: outstandingPayable > 0 ? "Outstanding PO Balance" : "Account Settled"
                    }}
                    secondaryMetrics={[
                      { label: "Purchase Volume", value: fmt(totalPurchased) },
                      { label: "Amount Paid", value: fmt(totalPaid) }
                    ]}
                    actions={
                      <>
                        {outstandingPayable > 0 && pendingPO && (
                          <button 
                            onClick={() => navigate(`/purchases/${pendingPO.id}`)} 
                            className="flex-1 min-h-[44px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs font-bold text-white cursor-pointer press-active"
                          >
                            Pay Supplier
                          </button>
                        )}
                        <button 
                          onClick={() => navigate(`/suppliers/${x.id}`)} 
                          className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
                        >
                          View Supplier
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
        title="Filter Payables"
        subtitle="Filter payables by status"
        activeFilterCount={statusFilter !== "ALL" ? 1 : 0}
        onReset={() => {
          setDraftStatus("ALL");
          setStatusFilter("ALL");
        }}
        onApply={() => {
          setStatusFilter(draftStatus);
          setFilterOpen(false);
        }}
      >
        {filtersPanel}
      </MobileFilterDrawer>
    </div>
  );
}

