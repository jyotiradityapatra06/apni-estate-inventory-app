import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Mail, Phone, Plus, DollarSign, Edit, ArrowLeft, Building, CreditCard } from "lucide-react";
import { supplierApi } from "../../api/supplier.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { useAuth } from "../../hooks/useAuth";
import type { Supplier } from "../../types/supplier.types";
import type { PurchaseOrder } from "../purchases/purchase.types";
import { hasPermission } from "../../utils/permissions";
import { fmt } from "../../utils/currency";

export function SupplierDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<(Supplier & { purchaseHistory: PurchaseOrder[] }) | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supplierApi
      .getById(id)
      .then((r) => setData(r.data as typeof data))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800 font-bold">{error}</div>;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" role="status" aria-label="Loading supplier details" />;

  const canPurchase = hasPermission(user, "purchases:manage");
  const canUpdate = hasPermission(user, "suppliers:update");

  return (
    <div className="space-y-6 pb-12">
      <Link to="/suppliers" className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer">
        <ArrowLeft size={14} />
        Back to Suppliers List
      </Link>

      <PageHeader
        title={data.name}
        description={`${data.companyName ? `${data.companyName} · ` : ""}${data.supplierCode || "VENDOR"} · ${data.phone}`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`tel:${data.phone}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <Phone size={15} className="text-slate-500" />
              Call Supplier
            </a>
            {canPurchase && (
              <Link
                to={`/purchases/new?supplierId=${data.id}`}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-orange-600 px-5 text-xs font-black text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                + Create Purchase PO
              </Link>
            )}
            <Link
              to={`/financials/payables?supplierId=${data.id}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <DollarSign size={15} className="text-emerald-600" />
              Make Payment
            </Link>
            {canUpdate && (
              <Link
                to={`/suppliers/${data.id}/edit`}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Edit size={15} className="text-slate-500" />
                Edit Profile
              </Link>
            )}
          </div>
        }
      />

      {/* Prominent Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Stat l="Total Purchases" v={fmt(data.totalPurchases)} helper="Cumulative PO value" />
        <Stat l="Outstanding Balance" v={fmt(data.pendingPayments)} isRed helper="Pending Payable Dues" />
        <Stat l="Total Paid" v={fmt(data.paidAmount)} isGreen helper="Settled Vendor Payments" />
        <Stat l="Approved Credit Limit" v={fmt(data.creditLimit)} helper="Vendor Credit Ceiling" />
      </div>

      {/* Profile Details */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <SectionHeader title="Contact & Business Profile" description="Official contact, tax registration, and credit terms." />
        <dl className="grid gap-4 md:grid-cols-2 pt-2">
          <Row l="Supplier Status">
            <BusinessStatusBadge status={data.isActive ? "ACTIVE" : "INACTIVE"} />
          </Row>
          {data.companyName && <Row l="Company / Business Name">{data.companyName}</Row>}
          <Row l="Primary Phone">
            <a className="font-extrabold text-orange-600 hover:underline" href={`tel:${data.phone}`}>
              {data.phone}
            </a>
          </Row>
          {data.contactPerson && <Row l="Contact Person">{data.contactPerson}</Row>}
          {data.email && (
            <Row l="Email Address">
              <a className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:underline" href={`mailto:${data.email}`}>
                <Mail size={15} />
                {data.email}
              </a>
            </Row>
          )}
          {data.gstin && (
            <Row l="GSTIN Number">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-black text-xs border border-blue-100 uppercase">
                {data.gstin}
              </span>
            </Row>
          )}
          {data.panNumber && <Row l="PAN Number">{data.panNumber}</Row>}
          {data.paymentTerms && <Row l="Payment Terms">{data.paymentTerms}</Row>}
          {data.address && <Row l="Registered Address">{data.address}</Row>}
          {data.suppliedMaterials?.length > 0 && (
            <Row l="Materials Supplied">
              <div className="flex flex-wrap gap-1.5 pt-1">
                {data.suppliedMaterials.map((m) => (
                  <span key={m} className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    {m}
                  </span>
                ))}
              </div>
            </Row>
          )}
        </dl>
      </section>

      {/* Purchase History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <SectionHeader
          title="Purchase History"
          description={`${data.purchaseHistory.length} Purchase Order${data.purchaseHistory.length === 1 ? "" : "s"} placed`}
        />
        <div className="space-y-2.5 pt-1">
          {data.purchaseHistory.length ? (
            data.purchaseHistory.map((x) => (
              <Link
                key={x.id}
                to={`/purchases/${x.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 hover:bg-orange-50/50 hover:border-orange-200 transition-colors"
              >
                <div>
                  <b className="text-sm font-black text-slate-900 block">{x.purchaseOrderNumber}</b>
                  <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
                    {new Date(x.orderDate).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <b className="text-sm font-black text-slate-900 block">{fmt(x.totalAmount)}</b>
                  <BusinessStatusBadge status={x.status} />
                </div>
              </Link>
            ))
          ) : (
            <p className="text-xs font-semibold text-slate-500 py-4 text-center">No purchase orders recorded yet.</p>
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

function Row({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">{l}</dt>
      <dd className="mt-1 text-sm font-extrabold text-slate-900">{children}</dd>
    </div>
  );
}
