import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertTriangle, CalendarClock, IndianRupee, Users, ArrowLeft, Factory, DollarSign } from "lucide-react";
import { financialApi } from "../../api/financial.api";
import { purchaseApi } from "../../api/purchase.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { AgeingReport } from "../../features/financials/AgeingReport";
import { fmt } from "../../utils/currency";
import { StatCard } from "../../app/components/common/Card";

export default function PayablesPage() {
  const navigate = useNavigate();
  const [d, setD] = useState<any>();
  const [purchases, setPurchases] = useState<any[]>([]);

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

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <Link to="/financials/payments" className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer">
        <ArrowLeft size={14}/>
        Back to Finance
      </Link>

      <PageHeader title="Payables" description="Supplier amounts your business needs to pay." />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Amount Due" value={fmt(s.totalPayable)} helper="Total supplier balances" icon={IndianRupee} className={s.totalPayable > 0 ? "border-red-200 bg-red-50/20" : ""} />
        <StatCard label="Due This Week" value={fmt(s.dueThisWeek)} helper="Payables due this week" icon={CalendarClock} />
        <StatCard label="Overdue Amount" value={fmt(s.overdue)} helper="Outstanding beyond terms" icon={AlertTriangle} />
        <StatCard label="Suppliers Pending" value={s.suppliersPending} helper="Vendors awaiting payment" icon={Users} />
      </div>

      <AgeingReport rows={d.ageing} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Supplier Outstanding payables</h3>
        
        {/* Desktop Table Viewport */}
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
              {d.suppliers.map((x: any) => {
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

        {/* Mobile Card Viewport */}
        <div className="grid gap-3 md:hidden">
          {d.suppliers.map((x: any) => {
            const supplierPurchases = purchases.filter(p => p.supplierId === x.id && p.status !== "CANCELLED");
            const totalPurchased = supplierPurchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
            const totalPaid = supplierPurchases.reduce((sum, p) => sum + Number(p.amountPaid), 0);
            const outstandingPayable = totalPurchased - totalPaid;
            const pendingPO = supplierPurchases.find(p => Number(p.balanceDue) > 0);

            return (
              <article key={x.id} className="rounded-xl border p-4 bg-slate-50/50 space-y-3 text-xs">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{x.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{x.phone || "No contact logged"}</p>
                  </div>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {x.paymentTerms || "30 Days"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center border-t border-b py-2 border-slate-200/50">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Total POs</span>
                    <strong className="block text-slate-800 mt-0.5">{fmt(totalPurchased)}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Paid</span>
                    <strong className="block text-green-700 mt-0.5">{fmt(totalPaid)}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Pending</span>
                    <strong className="block text-red-600 mt-0.5">{fmt(outstandingPayable)}</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  {outstandingPayable > 0 && pendingPO && (
                    <button 
                      onClick={() => navigate(`/purchases/${pendingPO.id}`)} 
                      className="flex-1 min-h-9 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white cursor-pointer"
                    >
                      Pay Supplier
                    </button>
                  )}
                  <Link 
                    to={`/suppliers/${x.id}`} 
                    className="flex-1 min-h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
                  >
                    View Transactions
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
