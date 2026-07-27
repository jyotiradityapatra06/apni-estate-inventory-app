import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { toast } from "sonner";
import paymentApi from "../../api/payment.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { fmt } from "../../utils/currency";
import { useAuth } from "../../hooks/useAuth";
import { Printer, ArrowLeft, Building2, User, FileText, CheckCircle2, ShieldCheck } from "lucide-react";

export default function PaymentReceiptPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { business } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentApi
      .getById(id)
      .then((r) => {
        setData(r.data);
        setLoading(false);
      })
      .catch((e: any) => {
        toast.error(e.message || "Failed to load payment receipt");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" role="status" aria-label="Loading payment receipt" />;
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <h2 className="text-lg font-bold">Payment Receipt Not Found</h2>
        <p className="mt-1 text-sm">The requested payment receipt could not be loaded.</p>
        <button onClick={() => nav("/payments")} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white">
          Back to Payments
        </button>
      </div>
    );
  }

  const receipt = data.receipt || {};
  const biz = receipt.business || {
    name: business?.name || "APNI ESTATE ERP",
    address: business?.address,
    phone: business?.phone,
    gstNumber: business?.gstNumber,
  };
  const cust = receipt.customer || data.customer || {};
  const inv = receipt.invoice || data.invoice || {};
  const pymt = receipt.payment || {
    paymentNumber: data.paymentNumber,
    paymentDate: data.paymentDate,
    amount: Number(data.amount || 0),
    paymentMethod: data.paymentMethod,
    referenceNumber: data.referenceNumber,
    bankName: data.bankName,
    notes: data.notes,
    status: data.status,
    receivedBy: data.receivedBy,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Screen Navigation Controls (Hidden during print) */}
      <div className="flex items-center justify-between border-b border-border pb-4 print:hidden">
        <button
          onClick={() => nav("/payments")}
          className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </button>

        <div className="flex gap-3">
          <Link
            to={`/payments/${id}`}
            className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
          >
            Payment Details
          </Link>
          <button
            onClick={handlePrint}
            className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-xs font-bold text-white hover:bg-orange-700 shadow-sm transition-colors cursor-pointer"
          >
            <Printer size={16} />
            Print Official Receipt (A4)
          </button>
        </div>
      </div>

      {/* Main Printable A4 Receipt Document */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0">
        {/* Receipt Top Header / Branding */}
        <header className="flex flex-col sm:flex-row justify-between border-b-2 border-slate-900 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="text-orange-600 print:text-foreground" size={28} />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">{biz.name || "APNI ESTATE"}</h1>
            </div>
            {biz.address && <p className="mt-1 text-xs text-muted-foreground max-w-md leading-relaxed">{biz.address}</p>}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground font-medium">
              {biz.phone && <span>Phone: {biz.phone}</span>}
              {biz.gstNumber && <span className="font-semibold text-muted-foreground">GSTIN: {biz.gstNumber}</span>}
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
            <span className="inline-block rounded-lg bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 uppercase tracking-widest border border-emerald-200 print:bg-muted print:text-foreground print:border-border">
              OFFICIAL PAYMENT RECEIPT
            </span>
            <h2 className="mt-2 text-xl font-extrabold text-foreground tracking-tight">{pymt.paymentNumber}</h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Date: {new Date(pymt.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <div className="mt-2 flex justify-start sm:justify-end">
              <BusinessStatusBadge status={pymt.status} />
            </div>
          </div>
        </header>

        {/* Customer & Payment High-Level Summary */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-border text-xs">
          <div className="space-y-2 bg-muted p-4 rounded-xl border border-border print:bg-transparent print:p-0 print:border-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <User size={13} /> Received From Customer
            </span>
            <p className="text-base font-extrabold text-foreground">{cust.name || "Customer"}</p>
            {cust.customerCode && <p className="font-semibold text-muted-foreground">Customer Code: {cust.customerCode}</p>}
            {cust.phone && <p className="text-muted-foreground">Phone: {cust.phone}</p>}
            {cust.email && <p className="text-muted-foreground">Email: {cust.email}</p>}
            {cust.gstin && <p className="font-semibold text-foreground">GSTIN: {cust.gstin}</p>}
            {cust.billingAddress && <p className="text-muted-foreground mt-1 leading-relaxed">{cust.billingAddress}</p>}
          </div>

          <div className="space-y-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-right print:bg-transparent print:p-0 print:border-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 print:text-muted-foreground block">
              Total Amount Received
            </span>
            <p className="text-3xl font-black text-emerald-700 print:text-foreground">{fmt(pymt.amount)}</p>
            <p className="text-xs font-bold text-muted-foreground mt-1">
              Mode: <span className="uppercase text-foreground">{pymt.paymentMethod?.replaceAll("_", " ")}</span>
            </p>
            {pymt.referenceNumber && <p className="text-muted-foreground">Ref / UTR / Cheque: {pymt.referenceNumber}</p>}
            {pymt.bankName && <p className="text-muted-foreground">Bank: {pymt.bankName}</p>}
          </div>
        </section>

        {/* Invoice Settlement Breakdown */}
        {inv && inv.invoiceNumber && (
          <section className="py-6 border-b border-border space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText size={14} /> Settlement Details Against Invoice
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-border rounded-lg">
                <thead className="bg-muted text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">Invoice Ref</th>
                    <th className="p-3">Invoice Date</th>
                    <th className="p-3 text-right">Invoice Total</th>
                    <th className="p-3 text-right">Amount Received</th>
                    <th className="p-3 text-right">Remaining Balance</th>
                    <th className="p-3 text-center">Invoice Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-foreground">
                  <tr>
                    <td className="p-3 font-extrabold text-foreground">{inv.invoiceNumber}</td>
                    <td className="p-3">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="p-3 text-right">{fmt(inv.totalAmount || 0)}</td>
                    <td className="p-3 text-right text-emerald-700 font-extrabold">{fmt(pymt.amount)}</td>
                    <td className="p-3 text-right text-foreground font-bold">{fmt(inv.balanceDue || 0)}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-black uppercase text-muted-foreground border border-border">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Additional Payment Notes */}
        {pymt.notes && (
          <section className="py-4 border-b border-border text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Payment Remarks / Notes</span>
            <p className="mt-1 text-muted-foreground font-medium italic">{pymt.notes}</p>
          </section>
        )}

        {/* Official Signatory Footer */}
        <footer className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs pt-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Received By User</span>
            <div className="flex items-center gap-2 text-foreground font-bold">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{pymt.receivedBy?.name || "System Operator"}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">System generated timestamped payment entry</p>
          </div>

          <div className="text-left sm:text-right space-y-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">For {biz.name || "APNI ESTATE"}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Authorized Signatory</p>
            </div>
            <div className="border-t border-slate-400 w-48 ml-0 sm:ml-auto pt-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Signature / Stamp</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
