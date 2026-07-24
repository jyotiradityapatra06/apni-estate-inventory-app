import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Mail, Phone, Plus, DollarSign, Pencil, UserCheck, AlertTriangle } from "lucide-react";
import { customerApi } from "../../api/customer.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import { StatCard } from "../../app/components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import type { Customer } from "../../types/customer.types";
import { hasPermission } from "../../utils/permissions";
import { fmt } from "../../utils/currency";

export function CustomerDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<(Customer & { transactionHistory?: unknown[] }) | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    customerApi
      .getById(id)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="rounded-2xl bg-red-50 p-5 text-red-800 text-sm font-extrabold border border-red-200">{error}</div>;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />;

  const hasDue = data.outstandingBalance > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action Buttons */}
      <PageHeader
        title={data.name}
        description={`Customer Code: ${data.customerCode} · Phone: ${data.phone}${data.gstin ? ` · GSTIN: ${data.gstin}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`tel:${data.phone}`}
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
            >
              <Phone size={15} />
              Call Customer
            </a>
            {hasPermission(user, "sales:manage") && (
              <Link
                to={`/sales-orders/new?customerId=${data.id}`}
                className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-extrabold text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                + Create Sale
              </Link>
            )}
            {hasPermission(user, "financials:manage") && hasDue && (
              <Link
                to={`/payments/new?customerId=${data.id}`}
                className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-4 text-xs font-extrabold text-white shadow-xs transition-colors cursor-pointer"
              >
                <DollarSign size={15} />
                Receive Payment
              </Link>
            )}
            {hasPermission(user, "customers:update") && (
              <Link
                to={`/customers/${data.id}/edit`}
                className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Pencil size={15} />
                Edit Profile
              </Link>
            )}
          </div>
        }
      />

      {/* Prominent Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding Dues to Receive"
          value={fmt(data.outstandingBalance)}
          helper={hasDue ? "Payment pending from customer" : "All dues settled"}
          icon={UserCheck}
          className={hasDue ? "border-red-200 bg-red-50/20" : "border-green-200 bg-green-50/10"}
        />
        <StatCard
          label="Approved Credit Limit"
          value={fmt(data.creditLimit)}
          helper="Maximum allowed credit threshold"
          icon={DollarSign}
        />
        <StatCard
          label="Opening Outstanding Balance"
          value={fmt(data.openingBalance)}
          helper="Balance brought forward at setup"
          icon={AlertTriangle}
        />
      </div>

      {/* Contact and Business Details */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
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
              <a href={`mailto:${data.email}`} className="inline-flex items-center gap-1.5 text-slate-800 font-bold hover:underline">
                <Mail size={15} className="text-slate-400" />
                {data.email}
              </a>
            </Row>
          )}
          {data.gstin && <Row label="GST Number">{data.gstin}</Row>}
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
    <div className="border-b border-slate-100 pb-3 last:border-0">
      <dt className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-extrabold text-slate-900">{children}</dd>
    </div>
  );
}
