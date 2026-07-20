import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, CalendarClock, IndianRupee, Users, ArrowLeft, Landmark, BarChart } from "lucide-react";
import { financialApi } from "../../api/financial.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { AgeingReport } from "../../features/financials/AgeingReport";
import { PaymentModal } from "../../features/financials/PaymentModal";
import { fmt } from "../../utils/currency";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { StatCard } from "../../app/components/common/Card";

export default function ReceivablesPage() {
  const [d, setD] = useState<any>();
  const [pay, setPay] = useState<any>();
  const { user } = useAuth();

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

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <Link to="/financials/payments" className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer">
        <ArrowLeft size={14}/>
        Back to Finance
      </Link>

      <PageHeader title="Receivables" description="Customer amounts you still need to receive." />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Amount Due" value={fmt(s.totalReceivable)} helper="Total customer balances" icon={IndianRupee} />
        <StatCard label="Due Today" value={fmt(s.dueToday)} helper="Receivables due today" icon={CalendarClock} />
        <StatCard label="Overdue Amount" value={fmt(s.overdue)} helper="Outstanding beyond terms" icon={AlertTriangle} className={s.overdue > 0 ? "border-red-200 bg-red-50/20" : ""} />
        <StatCard label="Customers Pending" value={s.customersPending} helper="Accounts awaiting receipt" icon={Users} />
      </div>

      <AgeingReport rows={d.ageing} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Customer Outstanding accounts</h3>
        
        {/* Desktop Table Viewport */}
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
              {d.customers.map((c: any) => {
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

        {/* Mobile Card Viewport */}
        <div className="grid gap-3 md:hidden">
          {d.customers.map((c: any) => {
            const totalInvoiceAmt = c.invoices.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount || 0), 0);
            const totalPaidAmt = totalInvoiceAmt - Number(c.amountDue);
            const ageDays = c.invoices[0]?.ageDays || 0;

            return (
              <article key={c.id} className="rounded-xl border p-4 bg-slate-50/50 space-y-3 text-xs">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{c.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{c.phone}</p>
                  </div>
                  {getAgeingBadge(ageDays)}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center border-t border-b py-2 border-slate-200/50">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Total Billed</span>
                    <strong className="block text-slate-800 mt-0.5">{fmt(totalInvoiceAmt)}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Paid</span>
                    <strong className="block text-green-700 mt-0.5">{fmt(totalPaidAmt)}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Pending</span>
                    <strong className="block text-red-600 mt-0.5">{fmt(c.amountDue)}</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  {hasPermission(user, "financials:manage") && c.invoices[0] && (
                    <button 
                      onClick={() => setPay({ customerId: c.id, invoiceId: c.invoices[0].id, balance: c.invoices[0].amountDue })} 
                      className="flex-1 min-h-9 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white cursor-pointer"
                    >
                      Receive Payment
                    </button>
                  )}
                  <Link 
                    to={`/financials/customers/${c.id}`} 
                    className="flex-1 min-h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
                  >
                    View Ledger
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {pay && (
        <PaymentModal {...pay} onClose={() => setPay(null)} onDone={() => { setPay(null); load(); }} />
      )}
    </div>
  );
}
