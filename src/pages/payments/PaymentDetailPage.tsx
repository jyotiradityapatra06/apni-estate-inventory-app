import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import paymentApi from "../../api/payment.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { fmt } from "../../utils/currency";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { Printer, ArrowLeft } from "lucide-react";

export default function PaymentDetailPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { user, business } = useAuth();
  const [p, setP] = useState<any>();

  const load = () => paymentApi.getById(id).then(r => setP(r.data)).catch((e: any) => toast.error(e.message));

  useEffect(() => {
    void load();
  }, [id]);

  if (!p) return <div className="h-40 animate-pulse rounded-xl bg-slate-200" />;

  const reverse = async () => {
    if (!confirm("Reverse this payment and restore the invoice balance?")) return;
    try {
      await paymentApi.reverse(id);
      toast.success("Payment reversed");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12">
      <div className="flex justify-between items-center border-b pb-4">
        <button 
          onClick={() => nav("/payments")} 
          className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer"
        >
          <ArrowLeft size={14}/>
          Back to Payments
        </button>
        <button 
          onClick={() => window.print()} 
          className="flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <Printer size={14} className="mr-1.5" />
          Print Receipt
        </button>
      </div>

      <section className="rounded-xl border bg-white p-5 md:p-7 shadow-sm">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-slate-500">Payment</p>
            <h1 className="text-2xl font-bold">{p.paymentNumber}</h1>
          </div>
          <BusinessStatusBadge status={p.status}/>
        </div>
        <p className="mt-6 text-4xl font-bold text-green-700">{fmt(p.amount)}</p>
        
        <div className="mt-6 grid gap-4 border-t pt-5 md:grid-cols-2 text-xs">
          {[
            ["Customer", p.customer?.name],
            ["Invoice", p.invoice?.invoiceNumber],
            ["Method", p.paymentMethod?.replaceAll("_", " ")],
            ["Reference", p.referenceNumber || "—"],
            ["Received by", p.receivedBy?.name],
            ["Date", new Date(p.paymentDate).toLocaleDateString("en-IN")]
          ].map(([l, v]) => (
            <div key={l}>
              <p className="text-sm text-slate-500">{l}</p>
              <p className="mt-1 font-semibold">{v}</p>
            </div>
          ))}
        </div>
        {user && hasPermission(user, "sales:manage") && p.status === "POSTED" && (
          <button onClick={reverse} className="mt-7 min-h-12 rounded-lg border border-red-200 px-4 font-semibold text-red-700">
            Reverse Payment
          </button>
        )}
      </section>

      {/* 10. Printable Payment Receipt (A4 Print-only template) */}
      <article className="invoice-print-root hidden print:block bg-white p-8 text-xs">
        <header className="flex justify-between border-b pb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{business?.name || "APNI ESTATE"}</h2>
            {business?.address && <p className="max-w-md text-xs text-slate-500 mt-1 leading-relaxed">{business.address}</p>}
            {business?.phone && <p className="text-xs text-slate-500 mt-1">Phone: {business.phone}</p>}
          </div>
          <div className="text-right">
            <h3 className="text-base font-black text-slate-800 tracking-wider uppercase">PAYMENT RECEIPT</h3>
            <p className="font-bold text-sm text-slate-700 mt-1">{p.paymentNumber}</p>
            <p className="text-xs text-slate-500 mt-1">Date: {new Date(p.paymentDate).toLocaleDateString("en-IN")}</p>
          </div>
        </header>

        <section className="py-6 border-b text-xs space-y-4">
          <div className="flex justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Received From</span>
              <p className="font-bold text-slate-900 text-sm mt-1">{p.customer?.name}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Amount Received</span>
              <p className="font-black text-green-700 text-lg mt-1">{fmt(p.amount)}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-4 text-xs font-semibold">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payment Method</span>
            <p className="text-slate-800 mt-1">{p.paymentMethod?.replaceAll("_", " ")}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Reference Number</span>
            <p className="text-slate-800 mt-1">{p.referenceNumber || "—"}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Invoice Reference</span>
            <p className="text-slate-800 mt-1">{p.invoice?.invoiceNumber}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Authorized Signatory</span>
            <p className="text-slate-800 mt-1">APNI ESTATE</p>
          </div>
        </div>
      </article>
    </div>
  );
}
