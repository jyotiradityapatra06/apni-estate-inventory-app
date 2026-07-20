import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import invoiceApi from "../../api/invoice.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { ConfirmDialog } from "../../app/components/common/ConfirmDialog";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { fmt, formatQuantity } from "../../utils/currency";
import type { Invoice } from "../../features/invoices/invoice.types";
import { ArrowLeft, Printer, FileCheck, Ban, CreditCard, Landmark, DollarSign } from "lucide-react";

export default function InvoiceDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [x, setX] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [action, setAction] = useState<"issue" | "cancel" | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => invoiceApi.getById(id).then(r => setX(r.data)).catch(e => setError(e.message));

  useEffect(() => {
    void load();
  }, [id]);

  useEffect(() => {
    if (x && params.get("print") === "1") {
      setTimeout(() => window.print(), 150);
    }
  }, [x, params]);

  const run = async () => {
    if (!action || busy) return;
    setBusy(true);
    try {
      const r = action === "issue" ? await invoiceApi.issue(id) : await invoiceApi.cancel(id);
      setX(r.data);
      toast.success(action === "issue" ? "Invoice issued" : "Invoice cancelled");
      window.dispatchEvent(new Event("notifications:refresh"));
      setAction(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invoice could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="rounded-xl bg-red-50 p-5 text-red-800">{error}<button onClick={load} className="ml-3 font-bold">Retry</button></div>;
  if (!x) return <div className="h-64 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Loading bill" />;

  const manage = hasPermission(user, "sales:manage");
  const gst = x.invoiceType === "GST";

  return (
    <div className="invoice-page mx-auto max-w-4xl space-y-6 pb-16">
      {/* Navigation actions */}
      <div className="invoice-actions flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <button 
            onClick={() => navigate("/invoices")} 
            className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer"
          >
            <ArrowLeft size={14}/>
            Back to Invoices
          </button>
          
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{x.invoiceNumber}</h1>
            <BusinessStatusBadge status={x.status}/>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              gst ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}>
              {gst ? "GST Invoice" : "Non-GST Bill"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => window.print()} 
            className="flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Printer size={14} className="mr-1.5" />
            Print Bill
          </button>
          {manage && x.status === "DRAFT" && (
            <button 
              onClick={() => setAction("issue")} 
              className="flex min-h-10 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white shadow-sm cursor-pointer transition-colors"
            >
              <FileCheck size={14} className="mr-1.5" />
              Issue Invoice
            </button>
          )}
          {manage && ["DRAFT", "ISSUED"].includes(x.status) && (
            <button 
              onClick={() => setAction("cancel")} 
              className="flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <Ban size={14} className="mr-1.5" />
              Cancel Bill
            </button>
          )}
        </div>
      </div>

      {/* 9. Payment Integration Summary Banner */}
      {x.status !== "CANCELLED" && (
        <div className="invoice-actions rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-2 bg-green-50 rounded-xl border border-green-100">
              <span className="text-[9px] uppercase font-bold text-green-700 block">Received Amount</span>
              <strong className="text-green-800 text-sm font-black mt-0.5 block">{fmt(x.amountPaid)}</strong>
            </div>
            <div className="px-3 py-2 bg-red-50 rounded-xl border border-red-100">
              <span className="text-[9px] uppercase font-bold text-red-700 block">Outstanding Balance</span>
              <strong className="text-red-800 text-sm font-black mt-0.5 block">{fmt(x.balanceDue)}</strong>
            </div>
          </div>
          {Number(x.balanceDue) > 0 && manage && (
            <Link 
              to={`/payments/new?invoiceId=${x.id}`} 
              className="flex min-h-10 items-center justify-center rounded-xl bg-green-600 hover:bg-green-700 px-4 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
            >
              <DollarSign size={14} className="mr-1.5" />
              Receive Payment
            </Link>
          )}
        </div>
      )}

      {/* 7. Professional Invoice Template Card */}
      <article className="invoice-print-root rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <header className="flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{x.businessName}</h2>
            {x.businessAddress && <p className="max-w-md whitespace-pre-line text-xs text-slate-500 mt-1 leading-relaxed">{x.businessAddress}</p>}
            {x.businessPhone && <p className="text-xs text-slate-500 mt-1">Phone: {x.businessPhone}</p>}
            {gst && x.businessGstin && <p className="text-xs text-slate-700 font-bold mt-1 uppercase">GSTIN: {x.businessGstin}</p>}
          </div>
          <div className="sm:text-right">
            <h3 className="text-lg font-black text-slate-800 tracking-wider uppercase">{gst ? "TAX INVOICE" : "BILL OF SUPPLY"}</h3>
            <p className="font-bold text-sm text-slate-700 mt-1">{x.invoiceNumber}</p>
            <p className="text-xs text-slate-500 mt-1">Date: {new Date(x.invoiceDate).toLocaleDateString("en-IN")}</p>
            {x.dueDate && <p className="text-xs text-slate-500">Due Date: {new Date(x.dueDate).toLocaleDateString("en-IN")}</p>}
          </div>
        </header>

        <section className="grid gap-5 border-b py-6 sm:grid-cols-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bill To</span>
            <p className="font-bold text-slate-900 text-sm mt-1">{x.customerName}</p>
            <p className="text-slate-600 mt-0.5">{x.customerPhone}</p>
            {x.billingAddress && <p className="whitespace-pre-line text-slate-500 mt-1 leading-relaxed">{x.billingAddress}</p>}
            {gst && x.customerGstin && <p className="font-bold text-slate-700 mt-1 uppercase">GSTIN: {x.customerGstin}</p>}
          </div>
        </section>

        {/* Desktop items table */}
        <div className="mt-6 hidden overflow-hidden rounded-xl border border-slate-100 sm:block">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                {["Material Item", "HSN Code", "Qty", "Rate", "Discount", ...(gst ? ["GST %"] : []), "Line Total"].map((v) => (
                  <th key={v} className="p-3 font-semibold text-slate-500 uppercase tracking-wider">{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {x.items.map((i) => (
                <tr key={i.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="p-3">
                    <span className="block font-bold text-slate-900">{i.materialName}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{i.sku}</span>
                  </td>
                  <td className="text-slate-600 font-medium">{gst ? i.hsnCode || "—" : "—"}</td>
                  <td className="text-slate-600 font-medium">{formatQuantity(i.quantity, i.unit)}</td>
                  <td className="text-slate-600 font-medium">{fmt(i.rate)}</td>
                  <td className="text-slate-500 font-medium">{fmt(i.discountAmount)}</td>
                  {gst && <td className="text-slate-500 font-medium">{i.gstRate}%</td>}
                  <td className="font-black text-slate-950">{fmt(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile items view */}
        <div className="mt-6 space-y-3 sm:hidden">
          {x.items.map((i) => (
            <div key={i.id} className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-900">{i.materialName}</span>
                <span className="text-slate-950 font-black">{fmt(i.lineTotal)}</span>
              </div>
              <p className="text-slate-500">
                {formatQuantity(i.quantity, i.unit)} &times; {fmt(i.rate)}
                {gst ? ` &middot; GST ${i.gstRate}%` : ""}
              </p>
            </div>
          ))}
        </div>

        {/* Financial calculations */}
        <section className="ml-auto mt-6 max-w-sm space-y-1.5 text-xs">
          <Row label="Subtotal" value={fmt(x.subtotal)}/>
          <Row label="Discount" value={fmt(x.discountTotal)}/>
          <Row label="Taxable Value" value={fmt(x.taxableTotal)}/>
          {gst && (
            <>
              <Row label="CGST Value" value={fmt(x.cgstTotal)}/>
              <Row label="SGST Value" value={fmt(x.sgstTotal)}/>
              <Row label="IGST Value" value={fmt(x.igstTotal)}/>
            </>
          )}
          <Row label="Round Off" value={fmt(x.roundOff)}/>
          <div className="border-t pt-2 mt-1">
            <Row label="Grand Total" value={fmt(x.totalAmount)} large/>
          </div>
          <Row label="Paid" value={fmt(x.amountPaid)}/>
          <Row label="Balance Due" value={fmt(x.balanceDue)} large/>
        </section>

        {(x.notes || x.terms) && (
          <section className="mt-6 border-t pt-4 text-[11px] text-slate-500 leading-relaxed space-y-1">
            {x.notes && <p><b>Notes:</b> {x.notes}</p>}
            {x.terms && <p><b>Terms:</b> {x.terms}</p>}
          </section>
        )}

        <footer className="mt-8 flex flex-col sm:flex-row justify-between border-t pt-5 text-xs text-slate-500 gap-4">
          <div>
            {x.salesOrder && (
              <p>
                Sales Order Reference:{" "}
                <Link className="invoice-order-link font-bold text-orange-600 hover:underline" to={`/sales-orders/${x.salesOrder.id}`}>
                  {x.salesOrder.orderNumber}
                </Link>
              </p>
            )}
            {x.payments?.length ? (
              <p className="mt-1">
                Receipts: {x.payments.map((p) => p.paymentNumber).join(", ")}
              </p>
            ) : null}
          </div>
          <p className="font-bold text-slate-700 sm:text-right">Authorised Signatory</p>
        </footer>
      </article>

      <ConfirmDialog 
        open={!!action} 
        title={action === "issue" ? `Issue ${x.invoiceNumber}?` : `Cancel ${x.invoiceNumber}?`} 
        description={
          action === "issue" 
            ? "Issuing posts customer outstanding and invoiced quantities. Stock is not deducted." 
            : "Cancellation reverses invoice outstanding and invoiced quantities. Paid invoices cannot be cancelled."
        } 
        confirmLabel={busy ? "Please wait..." : action === "issue" ? "Issue Invoice" : "Cancel Invoice"} 
        destructive={action === "cancel"} 
        onCancel={() => !busy && setAction(null)} 
        onConfirm={run}
      />
    </div>
  );
}

function Info({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{label}</span>
      <div className="flex items-center gap-1.5 font-bold text-slate-800 break-words mt-0.5">
        {Icon && <Icon size={12} className="text-slate-400 shrink-0" />}
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-0.5 ${large ? "text-sm font-black text-slate-900" : "text-xs font-semibold text-slate-500"}`}>
      <span>{label}</span>
      <b className={large ? "text-red-700" : "text-slate-900"}>{value}</b>
    </div>
  );
}
