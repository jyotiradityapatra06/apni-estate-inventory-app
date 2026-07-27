import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Mail, Phone, Plus, DollarSign, Pencil, UserCheck, AlertTriangle, Receipt, Printer, Eye, Calendar, FilePlus, MessageCircle, IndianRupee, BookOpen, ShoppingCart } from "lucide-react";
import { customerApi } from "../../api/customer.api";
import paymentApi from "../../api/payment.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import { StatCard } from "../../app/components/common/Card";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { useAuth } from "../../hooks/useAuth";
import type { Customer } from "../../types/customer.types";
import { hasPermission } from "../../utils/permissions";
import { fmt } from "../../utils/currency";
import { normalizeWhatsAppNumber, createWhatsAppLink } from "../../utils/whatsapp";

export function CustomerDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<(Customer & { transactionHistory?: unknown[] }) | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    customerApi
      .getById(id)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message));

    setLoadingPayments(true);
    paymentApi
      .getAll(`customerId=${id}`)
      .then((r) => {
        setPayments(r.data || []);
        setLoadingPayments(false);
      })
      .catch(() => setLoadingPayments(false));
  }, [id]);

  const handleWhatsAppShare = () => {
    if (!data) return;
    const phone = data.phone;
    const normalizedPhone = normalizeWhatsAppNumber(phone);

    if (!normalizedPhone) {
      toast.error("Customer phone number is missing. Please update customer details.");
      return;
    }

    const message = `Hello ${data.name || "Customer"},

Greetings from APNI ESTATE.

Please contact us regarding your account details.

Thank you for your business.`;

    const link = createWhatsAppLink(phone, message);
    if (!link) {
      toast.error("Customer phone number is missing. Please update customer details.");
      return;
    }

    const whatsappWindow = window.open("", "_blank");
    if (whatsappWindow) {
      whatsappWindow.location.href = link;
    } else {
      window.location.href = link;
    }
  };

  if (error) return <div className="rounded-2xl bg-red-50 p-5 text-red-800 text-sm font-extrabold border border-red-200">{error}</div>;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />;

  const hasDue = data.outstandingBalance > 0;
  const postedPayments = payments.filter((p) => p.status === "POSTED");
  const totalPaidAmount = postedPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const lastPayment = postedPayments.length > 0 ? postedPayments[0] : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Customer Header Summary */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-foreground tracking-tight">{data.name}</h1>
              <BusinessStatusBadge status={data.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-muted-foreground">
              <span>
                Customer Code: <strong className="text-foreground">{data.customerCode}</strong>
              </span>
              {data.phone && (
                <span className="flex items-center gap-1">
                  Phone: <a href={`tel:${data.phone}`} className="text-orange-600 font-extrabold hover:underline">{data.phone}</a>
                </span>
              )}
              {data.gstin && (
                <span>
                  GSTIN: <strong className="text-foreground uppercase font-mono">{data.gstin}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 sm:self-center">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                Outstanding Dues
              </span>
              <strong className={`text-lg sm:text-xl font-black block ${hasDue ? "text-red-600" : "text-emerald-700"}`}>
                {fmt(data.outstandingBalance)}
              </strong>
            </div>
          </div>
        </div>

        {/* Profile Edit Option */}
        {hasPermission(user, "customers:update") && (
          <div className="flex justify-end pt-1">
            <Link
              to={`/customers/${data.id}/edit`}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Pencil size={14} />
              Edit Profile
            </Link>
          </div>
        )}
      </div>

      {/* Sales Workflow Guidance Card */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <span className="font-black text-muted-foreground uppercase tracking-wider text-[11px]">
            Sales Workflow
          </span>
          <div className="flex items-center gap-2 font-bold text-foreground overflow-x-auto pb-1 sm:pb-0">
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              Sales Order
            </span>
            <span className="text-muted-foreground font-mono">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
              Invoice
            </span>
            <span className="text-muted-foreground font-mono">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
              Delivery
            </span>
            <span className="text-muted-foreground font-mono">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Payment
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <SectionHeader title="Quick Actions" description="Fast CRM shortcuts for sales orders, invoices, receipts, WhatsApp communication, and ledger details." />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 pt-1">
          {/* 1. Create Sales Order */}
          {hasPermission(user, "sales:manage") && (
            <Link
              to={`/sales-orders/new?customerId=${data.id}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-xs font-extrabold text-amber-900 hover:bg-amber-100/80 transition-colors shadow-xs"
            >
              <ShoppingCart size={16} className="text-amber-600 shrink-0" />
              Create Sales Order
            </Link>
          )}

          {/* 2. Create Invoice */}
          {hasPermission(user, "sales:manage") && (
            <Link
              to={`/invoices/new?customerId=${data.id}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-2.5 text-xs font-extrabold text-orange-800 hover:bg-orange-100/80 transition-colors shadow-xs"
            >
              <FilePlus size={16} className="text-orange-600 shrink-0" />
              Create Invoice
            </Link>
          )}

          {/* 3. WhatsApp Bill */}
          <button
            onClick={handleWhatsAppShare}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100/80 transition-colors shadow-xs cursor-pointer"
          >
            <MessageCircle size={16} className="text-emerald-600 shrink-0" />
            WhatsApp Bill
          </button>

          {/* 4. Receive Payment */}
          {hasPermission(user, "financials:manage") && (
            <Link
              to={`/payments/new?customerId=${data.id}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-2.5 text-xs font-extrabold text-blue-800 hover:bg-blue-100/80 transition-colors shadow-xs"
            >
              <IndianRupee size={16} className="text-blue-600 shrink-0" />
              Receive Payment
            </Link>
          )}

          {/* 5. View Ledger */}
          {hasPermission(user, "financials:view") && (
            <Link
              to={`/financials/ledger?customerId=${data.id}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50/60 px-3 py-2.5 text-xs font-extrabold text-purple-800 hover:bg-purple-100/80 transition-colors shadow-xs"
            >
              <BookOpen size={16} className="text-purple-600 shrink-0" />
              View Ledger
            </Link>
          )}

          {/* 6. Call Customer */}
          {data.phone && (
            <a
              href={`tel:${data.phone}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-extrabold text-slate-800 hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Phone size={16} className="text-slate-600 shrink-0" />
              Call Customer
            </a>
          )}
        </div>
      </section>

      {/* Prominent Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          label="Outstanding Dues"
          value={fmt(data.outstandingBalance)}
          helper={hasDue ? "Payment pending from customer" : "All dues settled"}
          icon={UserCheck}
          className={hasDue ? "border-red-200 bg-red-50/20" : "border-green-200 bg-green-50/10"}
        />
        <StatCard
          label="Total Paid Amount"
          value={fmt(totalPaidAmount)}
          helper={`${postedPayments.length} posted receipts`}
          icon={DollarSign}
          className="border-emerald-200 bg-emerald-50/10"
        />
        <StatCard
          label="Last Payment Date"
          value={lastPayment ? new Date(lastPayment.paymentDate).toLocaleDateString("en-IN") : "No Payments"}
          helper={lastPayment ? `Receipt #${lastPayment.paymentNumber}` : "No recorded receipts"}
          icon={Calendar}
        />
        <StatCard
          label="Payment Terms"
          value={`${data.creditDays || 0} Days`}
          helper="Standard credit days period"
          icon={AlertTriangle}
        />
      </div>

      {/* Payment History Section */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <SectionHeader title="Payment History & Receipts" description="Recent customer payments, receipts, and settlement records." />
          {hasPermission(user, "financials:manage") && (
            <Link
              to={`/payments/new?customerId=${data.id}`}
              className="flex min-h-9 items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 px-3 text-xs font-bold text-white transition-colors"
            >
              <Plus size={14} /> Record Payment
            </Link>
          )}
        </div>

        {loadingPayments ? (
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        ) : payments.length === 0 ? (
          <div className="py-8 text-center space-y-1 text-muted-foreground">
            <p className="font-bold text-sm text-foreground">No payment receipts recorded</p>
            <p className="text-xs text-muted-foreground">No payments have been received from this customer yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground border-b border-border font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Receipt #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Invoice Ref</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Receipt Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-foreground">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/60 transition-colors">
                    <td className="p-3 font-bold text-foreground">{p.paymentNumber}</td>
                    <td className="p-3 text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                    <td className="p-3 text-muted-foreground">{p.invoice?.invoiceNumber || "—"}</td>
                    <td className="p-3 text-right font-black text-emerald-700">{fmt(p.amount)}</td>
                    <td className="p-3">
                      <span className="uppercase text-[10px] font-bold text-muted-foreground">{p.paymentMethod?.replaceAll("_", " ")}</span>
                    </td>
                    <td className="p-3 text-center">
                      <BusinessStatusBadge status={p.status} />
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        to={`/payments/${p.id}/receipt`}
                        className="inline-flex items-center gap-1 min-h-7 rounded-lg bg-slate-900 hover:bg-slate-800 px-2.5 text-[10px] font-bold text-white transition-colors"
                      >
                        <Printer size={12} /> Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Credit Control & Exposure Card */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader title="Credit Control & Exposure" description="Credit allowance, payment period, and threshold status." />
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border ${
              data.allowCredit === false
                ? "bg-red-50 text-red-700 border-red-200"
                : data.creditLimit > 0 && data.outstandingBalance > data.creditLimit
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {data.allowCredit === false
              ? "Credit Blocked"
              : data.creditLimit > 0 && data.outstandingBalance > data.creditLimit
              ? "Limit Exceeded"
              : "Within Limit"}
          </span>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <Row label="Allow Credit Sales">
            <span className={data.allowCredit !== false ? "text-emerald-700" : "text-red-600"}>
              {data.allowCredit !== false ? "Enabled" : "Disabled (Blocked)"}
            </span>
          </Row>
          <Row label="Approved Credit Limit">
            {data.creditLimit > 0 ? fmt(data.creditLimit) : "Unlimited Credit"}
          </Row>
          <Row label="Credit Days (Terms)">
            {data.creditDays || 0} Days
          </Row>
          <Row label="Available Exposure">
            {data.creditLimit > 0 ? fmt(Math.max(0, data.creditLimit - data.outstandingBalance)) : "N/A (Unlimited)"}
          </Row>
        </dl>
      </section>

      {/* Contact and Business Details */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <SectionHeader title="Contact & Business Profile" description="Phone, GST, billing, and delivery address details." />
        <dl className="grid gap-5 md:grid-cols-2 pt-2">
          {data.phone && (
            <Row label="Phone Number">
              <a href={`tel:${data.phone}`} className="text-orange-600 font-extrabold hover:underline">
                {data.phone}
              </a>
            </Row>
          )}
          {data.email && (
            <Row label="Email Address">
              <a href={`mailto:${data.email}`} className="inline-flex items-center gap-1.5 text-foreground font-bold hover:underline">
                <Mail size={15} className="text-muted-foreground" />
                {data.email}
              </a>
            </Row>
          )}
          {data.gstin && <Row label="GST Number">{data.gstin}</Row>}
          {(data.state || data.stateCode) && (
            <Row label="GST State / Location">
              {data.state || "Unspecified"} {data.stateCode ? `(State Code: ${data.stateCode})` : ""}
            </Row>
          )}
          {data.billingAddress && <Row label="Billing Address">{data.billingAddress}</Row>}
          {data.shippingAddress && <Row label="Delivery Address">{data.shippingAddress}</Row>}
          {data.notes && <Row label="Internal Notes">{data.notes}</Row>}
        </dl>
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-3 last:border-0">
      <dt className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-extrabold text-foreground">{children}</dd>
    </div>
  );
}
