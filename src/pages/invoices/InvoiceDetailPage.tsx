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
import { ArrowLeft, Printer, FileCheck, Ban, CreditCard, Landmark, DollarSign, MessageCircle, Download } from "lucide-react";
import { normalizeWhatsAppNumber, createWhatsAppLink, formatInvoiceWhatsAppMessage } from "../../utils/whatsapp";
import { ProfessionalInvoice } from "../../features/invoices/components/ProfessionalInvoice";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

export default function InvoiceDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [x, setX] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [action, setAction] = useState<"issue" | "cancel" | null>(null);
  const [busy, setBusy] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

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

  const handleWhatsAppShare = async () => {
    if (!x) return;
    const phone = x.customerPhone || x.customer?.phone;
    const normalizedPhone = normalizeWhatsAppNumber(phone);

    if (!normalizedPhone) {
      toast.error("Customer phone number is missing. Please update customer details.");
      return;
    }

    const whatsappWindow = window.open("", "_blank");
    try {
      const shareRes = await invoiceApi.share(x.id, phone || undefined);
      const publicInvoiceURL = `${window.location.origin}${shareRes.data.publicUrl}`;

      const message = formatInvoiceWhatsAppMessage({
        customerName: x.customerName || x.customer?.name,
        businessName: x.businessName,
        invoiceNumber: x.invoiceNumber,
        totalAmount: x.totalAmount,
        balanceDue: x.balanceDue,
        invoiceLink: publicInvoiceURL,
      });

      const link = createWhatsAppLink(phone, message);
      if (!link) {
        whatsappWindow?.close();
        toast.error("Customer phone number is missing. Please update customer details.");
        return;
      }

      if (whatsappWindow) {
        whatsappWindow.location.href = link;
      } else {
        window.location.href = link;
      }
      toast.success("Invoice shared on WhatsApp");
      window.dispatchEvent(new Event("notifications:refresh"));
    } catch (e) {
      whatsappWindow?.close();
      toast.error(e instanceof Error ? e.message : "Unable to generate WhatsApp share link. Please try again.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!x || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      await generateInvoicePDF(x);
      toast.success("Invoice PDF downloaded");
    } catch (e) {
      toast.error("Unable to generate invoice PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
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
            className="flex min-h-9 items-center gap-2 text-xs font-bold text-muted-foreground hover:text-orange-600 cursor-pointer"
          >
            <ArrowLeft size={14}/>
            Back to Invoices
          </button>
          
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-black text-foreground tracking-tight">{x.invoiceNumber}</h1>
            <BusinessStatusBadge status={x.status}/>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              gst ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-muted text-muted-foreground border border-border"
            }`}>
              {gst ? "GST Invoice" : "Non-GST Bill"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            disabled={generatingPdf}
            onClick={handleDownloadPDF} 
            className="flex min-h-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-4 text-xs font-black text-orange-900 hover:bg-orange-100 cursor-pointer transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={15} className="mr-1.5 text-orange-600" />
            {generatingPdf ? "Generating PDF..." : "Download PDF"}
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-black text-muted-foreground hover:bg-muted cursor-pointer transition-colors shadow-xs"
          >
            <Printer size={15} className="mr-1.5 text-muted-foreground" />
            Print Bill
          </button>
          <button 
            onClick={handleWhatsAppShare} 
            className="flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors shadow-xs"
          >
            <MessageCircle size={15} className="mr-1.5 text-emerald-600" />
            Share on WhatsApp
          </button>
          {Number(x.balanceDue) > 0 && manage && (
            <Link 
              to={`/payments/new?customerId=${x.customerId}&invoiceId=${x.id}`} 
              className="flex min-h-11 items-center justify-center rounded-xl bg-green-600 hover:bg-green-700 px-4 text-xs font-black text-white shadow-xs transition-colors cursor-pointer"
            >
              <DollarSign size={15} className="mr-1.5" />
              Receive Payment
            </Link>
          )}
          {manage && x.status === "DRAFT" && (
            <button 
              onClick={() => setAction("issue")} 
              className="flex min-h-11 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-black text-white shadow-xs cursor-pointer transition-colors"
            >
              <FileCheck size={15} className="mr-1.5" />
              Issue Invoice
            </button>
          )}
          {manage && ["DRAFT", "ISSUED"].includes(x.status) && (
            <button 
              onClick={() => setAction("cancel")} 
              className="flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-card px-4 text-xs font-black text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <Ban size={15} className="mr-1.5" />
              Cancel Bill
            </button>
          )}
        </div>
      </div>

      {/* Payment Integration Summary Banner */}
      {x.status !== "CANCELLED" && (
        <div className="invoice-actions rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="px-3.5 py-2 bg-green-50 rounded-xl border border-green-100">
              <span className="text-[10px] uppercase font-black text-green-700 block">Received Amount</span>
              <strong className="text-green-800 text-base font-black mt-0.5 block">{fmt(x.amountPaid)}</strong>
            </div>
            <div className="px-3.5 py-2 bg-red-50 rounded-xl border border-red-100">
              <span className="text-[10px] uppercase font-black text-red-700 block">Outstanding Balance</span>
              <strong className="text-red-800 text-base font-black mt-0.5 block">{fmt(x.balanceDue)}</strong>
            </div>
          </div>
          {Number(x.balanceDue) > 0 && manage && (
            <Link 
              to={`/payments/new?customerId=${x.customerId}&invoiceId=${x.id}`} 
              className="flex min-h-11 items-center justify-center rounded-xl bg-green-600 hover:bg-green-700 px-5 text-xs font-extrabold text-white shadow-xs transition-colors cursor-pointer"
            >
              <DollarSign size={16} className="mr-1.5" />
              Record Payment Receipt
            </Link>
          )}
        </div>
      )}

      {/* Professional Invoice Presentation Card */}
      <ProfessionalInvoice invoice={x} />

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
      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">{label}</span>
      <div className="flex items-center gap-1.5 font-bold text-foreground break-words mt-0.5">
        {Icon && <Icon size={12} className="text-muted-foreground shrink-0" />}
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-0.5 ${large ? "text-sm font-black text-foreground" : "text-xs font-semibold text-muted-foreground"}`}>
      <span>{label}</span>
      <b className={large ? "text-red-700" : "text-foreground"}>{value}</b>
    </div>
  );
}
