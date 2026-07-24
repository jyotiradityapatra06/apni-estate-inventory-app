import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, DollarSign, Plus } from "lucide-react";
import { financialApi } from "../../api/financial.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { fmt } from "../../utils/currency";

export default function CustomerCreditPage() {
  const { id } = useParams();
  const [c, setC] = useState<any>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financialApi
      .receivables()
      .then((r) => setC(r.data.customers.find((x: any) => x.id === id)))
      .catch(() => setC(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />;

  if (!c) {
    return (
      <div className="space-y-4">
        <Link to="/financials/receivables" className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer">
          <ArrowLeft size={14} />
          Back to Receivables
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
          <p className="font-extrabold text-base text-slate-900">No Pending Dues Found</p>
          <p className="text-xs text-slate-400">This customer currently has zero outstanding balance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Link to="/financials/receivables" className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer">
        <ArrowLeft size={14} />
        Back to Receivables
      </Link>

      <PageHeader
        title={c.name}
        description={`Customer phone: ${c.phone || "N/A"} · Credit limit & invoice history.`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to={`/payments/new?customerId=${c.id}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-orange-600 px-5 text-xs font-black text-white shadow-xs transition-colors cursor-pointer"
            >
              <DollarSign size={15} />
              Receive Payment
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Stat l="Total Sales" v={fmt(c.totalSales)} helper="Cumulative Orders" />
        <Stat l="Total Paid" v={fmt(c.paidAmount)} isGreen helper="Collections Received" />
        <Stat l="Current Amount Due" v={fmt(c.amountDue)} isRed helper="Pending Receivables Dues" />
        <Stat l="Credit Limit" v={fmt(c.creditLimit)} helper="Max Credit Ceiling" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 tracking-tight">Pending Invoice History</h2>
        <div className="space-y-2.5 pt-1">
          {c.invoices?.length ? (
            c.invoices.map((x: any) => (
              <div
                key={x.id}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 hover:bg-orange-50/50 transition-colors"
              >
                <div>
                  <b className="text-sm font-black text-slate-900 block">{x.reference}</b>
                  <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
                    Ageing: <strong className={x.ageDays > 60 ? "text-red-600 font-black" : "text-slate-800"}>{x.ageDays} days</strong>
                  </span>
                </div>
                <div className="text-right">
                  <b className="text-sm font-black text-red-600 block">{fmt(x.amountDue)} due</b>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs font-semibold text-slate-400 py-4 text-center">No pending unpaid invoices for this customer.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ l, v, isRed = false, isGreen = false, helper }: { l: string; v: string; isRed?: boolean; isGreen?: boolean; helper?: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-1">
      <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">{l}</span>
      <p className={`text-lg sm:text-xl font-black ${isRed ? "text-red-600" : isGreen ? "text-green-700" : "text-slate-900"}`}>{v}</p>
      {helper && <span className="text-[10px] font-semibold text-slate-400 block">{helper}</span>}
    </article>
  );
}
