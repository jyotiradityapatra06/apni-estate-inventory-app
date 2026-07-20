import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import salesOrderApi from "../../api/salesOrder.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { ConfirmDialog } from "../../app/components/common/ConfirmDialog";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { fmt, formatQuantity } from "../../utils/currency";
import type { SalesOrder } from "./salesOrder.types";
import { ArrowLeft, Plus, CheckCircle, Ban, FileText, ShoppingCart, User, Phone, MapPin, Percent, DollarSign, Printer } from "lucide-react";

export function SalesOrderDetailPage() {
  const { id = "" } = useParams();
  const { user, business } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<SalesOrder | null>(null);
  const [error, setError] = useState("");
  const [action, setAction] = useState<"confirm" | "cancel" | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => salesOrderApi.getById(id).then(r => setData(r.data)).catch(e => setError(e.message));

  useEffect(() => {
    void load();
  }, [id]);

  const act = async () => {
    if (!action || busy) return;
    setBusy(true);
    try {
      const r = action === "confirm" ? await salesOrderApi.confirm(id) : await salesOrderApi.cancel(id);
      setData(r.data);
      toast.success(action === "confirm" ? "Order confirmed and stock reserved" : "Order cancelled and reservations released");
      window.dispatchEvent(new Event("notifications:refresh"));
      setAction(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Order could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="rounded-xl bg-red-50 p-5 text-red-800">{error}<button onClick={load} className="ml-3 font-bold">Retry</button></div>;
  if (!data) return <div className="h-64 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Loading details" />;

  const manage = hasPermission(user, "sales:manage");
  const canCancel = manage && !['CANCELLED', 'FULFILLED'].includes(data.status);
  const tax = Number(data.cgstTotal) + Number(data.sgstTotal) + Number(data.igstTotal);

  return (
    <div className="space-y-6 pb-12">
      {/* Back link */}
      <button 
        onClick={() => navigate("/sales-orders")} 
        className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer"
      >
        <ArrowLeft size={14}/>
        Back to Sales Orders
      </button>

      {/* Header */}
      <PageHeader 
        title={data.orderNumber} 
        description={`${data.customerName} &middot; ${new Date(data.orderDate).toLocaleDateString("en-IN")}`} 
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => window.print()} 
              className="flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <Printer size={14} className="mr-1.5" />
              Print Order
            </button>
            <BusinessStatusBadge status={data.status}/>
            {manage && ["CONFIRMED", "PARTIALLY_INVOICED"].includes(data.status) && (
              <Link 
                to={`/invoices/new?salesOrderId=${data.id}`} 
                className="flex min-h-10 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white shadow-sm cursor-pointer transition-colors"
              >
                <Plus size={15} className="mr-1.5" />
                Generate Invoice
              </Link>
            )}
            {manage && data.status === "DRAFT" && (
              <button 
                onClick={() => setAction("confirm")} 
                className="flex min-h-10 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white shadow-sm cursor-pointer transition-colors"
              >
                <CheckCircle size={14} className="mr-1.5" />
                Confirm Order
              </button>
            )}
            {canCancel && (
              <button 
                onClick={() => setAction("cancel")} 
                className="flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
              >
                <Ban size={14} className="mr-1.5" />
                Cancel Order
              </button>
            )}
          </div>
        }
      />

      {/* Customer Info Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Customer Information</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-xs">
          <Info label="Customer Name" icon={User}>
            <Link to={`/customers/${data.customerId}`} className="font-bold text-orange-600 hover:text-orange-700 hover:underline">
              {data.customerName}
            </Link>
          </Info>
          <Info label="Phone" icon={Phone}>
            <a href={`tel:${data.customerPhone}`} className="font-semibold text-slate-700">
              {data.customerPhone}
            </a>
          </Info>
          {data.customerGstin && <Info label="GST Number">{data.customerGstin}</Info>}
          {data.billingAddress && <Info label="Billing Address" icon={MapPin}>{data.billingAddress}</Info>}
          {data.deliveryAddress && <Info label="Delivery Address" icon={MapPin}>{data.deliveryAddress}</Info>}
          <Info label="Sales Representative">{data.createdBy?.name || "—"}</Info>
        </div>
      </section>

      {/* Items list */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Material line items</h3>
        
        {/* Desktop list */}
        <div className="hidden overflow-hidden rounded-xl border border-slate-100 md:block">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                {["Material", "Godown / Warehouse", "Quantity", "Rate", "Discount", "GST", "Reserved", "Delivered", "Line Total"].map((x) => (
                  <th key={x} className="p-3 font-semibold text-slate-500 uppercase tracking-wider">{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((x) => (
                <tr key={x.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="p-3">
                    <Link to={`/materials/${x.inventoryItemId}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors">
                      {x.materialName}
                    </Link>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{x.sku}</p>
                  </td>
                  <td className="text-slate-600 font-medium">{x.godown.name}</td>
                  <td className="text-slate-600 font-medium">{formatQuantity(x.quantity, x.unit)}</td>
                  <td className="text-slate-600 font-medium">{fmt(x.rate)}</td>
                  <td className="text-slate-500 font-medium">{x.discountRate}%</td>
                  <td className="text-slate-500 font-medium">{x.gstRate}%</td>
                  <td className="text-slate-600 font-semibold">{formatQuantity(x.reservedQuantity, x.unit)}</td>
                  <td className="text-slate-600 font-semibold">{formatQuantity(x.deliveredQuantity, x.unit)}</td>
                  <td className="font-black text-slate-950">{fmt(x.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="grid gap-3 md:hidden">
          {data.items.map((x) => (
            <article key={x.id} className="rounded-xl bg-slate-50/60 p-4 border border-slate-100 space-y-2 text-xs">
              <Link to={`/materials/${x.inventoryItemId}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors">
                {x.materialName}
              </Link>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{x.godown.name} &middot; {x.sku}</p>
              
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                <Info label="Ordered">{formatQuantity(x.quantity, x.unit)}</Info>
                <Info label="Reserved">{formatQuantity(x.reservedQuantity, x.unit)}</Info>
                <Info label="Fulfilled">{formatQuantity(x.deliveredQuantity, x.unit)}</Info>
                <Info label="Remaining">{formatQuantity(Math.max(0, Number(x.quantity) - Number(x.deliveredQuantity)), x.unit)}</Info>
                <Info label="Rate">{fmt(x.rate)}</Info>
                <Info label="Line Total"><span className="font-black text-slate-900">{fmt(x.lineTotal)}</span></Info>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Totals panel */}
      <section className="ml-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
        <Row label="Subtotal" value={fmt(data.subtotal)}/>
        <Row label="Discount" value={fmt(data.discountTotal)}/>
        <Row label="Taxable Amount" value={fmt(data.taxableTotal)}/>
        <Row label="GST tax value" value={fmt(tax)}/>
        <div className="border-t pt-3 mt-1">
          <Row label="Grand Total" value={fmt(data.totalAmount)} large/>
        </div>
      </section>

      {/* References */}
      {(data.invoices?.length || data.deliveries?.length) ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Linked References</h3>
          <div className="space-y-2">
            {data.invoices?.map(x => (
              <div key={x.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                <span className="font-bold text-slate-800">Invoice: {x.invoiceNumber}</span>
                <span className="font-semibold text-slate-500">{x.status} &middot; {fmt(x.totalAmount)}</span>
              </div>
            ))}
            {data.deliveries?.map(x => (
              <div key={x.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                <span className="font-bold text-slate-800">Delivery challan: {x.deliveryNumber}</span>
                <span className="font-semibold text-slate-500">{x.status}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Status Timeline */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 max-w-md">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Order Status Timeline</h3>
        
        <div className="relative border-l border-slate-100 pl-5 space-y-4 text-xs">
          <div className="relative">
            <div className="absolute -left-[24.5px] top-0.5 h-2.5 w-2.5 rounded-full border bg-white border-green-600" />
            <p className="font-bold text-slate-900">Order Created</p>
            <p className="text-slate-400 text-[10px] mt-0.5">{new Date(data.createdAt).toLocaleString("en-IN")}</p>
          </div>
          
          {data.confirmedAt && (
            <div className="relative">
              <div className="absolute -left-[24.5px] top-0.5 h-2.5 w-2.5 rounded-full border bg-white border-green-600" />
              <p className="font-bold text-slate-900">Order Confirmed (Stock Reserved)</p>
              <p className="text-slate-400 text-[10px] mt-0.5">{new Date(data.confirmedAt).toLocaleString("en-IN")}</p>
            </div>
          )}

          {data.cancelledAt && (
            <div className="relative">
              <div className="absolute -left-[24.5px] top-0.5 h-2.5 w-2.5 rounded-full border bg-white border-red-500" />
              <p className="font-bold text-red-600">Order Cancelled</p>
              <p className="text-slate-400 text-[10px] mt-0.5">{new Date(data.cancelledAt).toLocaleString("en-IN")}</p>
            </div>
          )}

          <div className="relative">
            <div className="absolute -left-[24.5px] top-0.5 h-2.5 w-2.5 rounded-full border bg-white border-slate-400" />
            <p className="font-bold text-slate-500">Last System Update</p>
            <p className="text-slate-400 text-[10px] mt-0.5">{new Date(data.updatedAt).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </section>

      <ConfirmDialog 
        open={!!action} 
        title={action === "confirm" ? "Confirm Sales Order?" : `Cancel ${data.orderNumber}?`} 
        description={
          action === "confirm" 
            ? `Confirming will reserve stock for ${data.items.length} material line${data.items.length === 1 ? "" : "s"}. Physical stock will not change.` 
            : "Reserved stock will be released and this order cannot continue to invoice or delivery."
        } 
        confirmLabel={busy ? "Please wait..." : action === "confirm" ? "Confirm Order" : "Cancel Order"} 
        destructive={action === "cancel"} 
        onCancel={() => !busy && setAction(null)} 
        onConfirm={act}
      />

      {/* 10. Printable Sales Order (A4 Print-only template) */}
      <article className="invoice-print-root hidden print:block bg-white p-8 text-xs">
        <header className="flex justify-between border-b pb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{business?.name || "APNI ESTATE"}</h2>
            {business?.address && <p className="max-w-md text-xs text-slate-500 mt-1 leading-relaxed">{business.address}</p>}
            {business?.phone && <p className="text-xs text-slate-500 mt-1">Phone: {business.phone}</p>}
            {business?.gstNumber && <p className="text-xs text-slate-700 font-bold mt-1 uppercase">GSTIN: {business.gstNumber}</p>}
          </div>
          <div className="text-right">
            <h3 className="text-base font-black text-slate-800 tracking-wider uppercase">SALES ORDER</h3>
            <p className="font-bold text-sm text-slate-700 mt-1">{data.orderNumber}</p>
            <p className="text-xs text-slate-500 mt-1">Date: {new Date(data.orderDate).toLocaleDateString("en-IN")}</p>
          </div>
        </header>

        <section className="grid gap-5 border-b py-6 grid-cols-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customer</span>
            <p className="font-bold text-slate-900 text-sm mt-1">{data.customerName}</p>
            <p className="text-slate-600 mt-0.5">{data.customerPhone}</p>
            {data.customerGstin && <p className="font-bold text-slate-700 mt-1 uppercase">GSTIN: {data.customerGstin}</p>}
          </div>
        </section>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                {["Material Item", "Qty", "Rate", "Discount", "GST %", "Line Total"].map((v) => (
                  <th key={v} className="p-3 font-semibold text-slate-500 uppercase tracking-wider">{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((i) => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="p-3">
                    <span className="block font-bold text-slate-900">{i.materialName}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{i.sku}</span>
                  </td>
                  <td className="text-slate-600 font-medium">{formatQuantity(i.quantity, i.unit)}</td>
                  <td className="text-slate-600 font-medium">{fmt(i.rate)}</td>
                  <td className="text-slate-500 font-medium">{i.discountRate}%</td>
                  <td className="text-slate-500 font-medium">{i.gstRate}%</td>
                  <td className="font-black text-slate-950">{fmt(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="ml-auto mt-6 max-w-sm space-y-1.5 text-xs">
          <Row label="Subtotal" value={fmt(data.subtotal)}/>
          <Row label="Discount" value={fmt(data.discountTotal)}/>
          <Row label="GST taxes" value={fmt(tax)}/>
          <div className="border-t pt-2 mt-1">
            <Row label="Grand Total" value={fmt(data.totalAmount)} large/>
          </div>
        </section>
      </article>
    </div>
  );
}

function Info({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{label}</span>
      <div className="flex items-center gap-1.5 font-semibold text-slate-800 break-words mt-0.5">
        {Icon && <Icon size={12} className="text-slate-400 shrink-0" />}
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 py-1 ${large ? "text-lg font-black text-slate-900" : "text-xs font-semibold text-slate-500"}`}>
      <span>{label}</span>
      <b className={large ? "text-[#F97316]" : "text-slate-900"}>{value}</b>
    </div>
  );
}

export default SalesOrderDetailPage;
