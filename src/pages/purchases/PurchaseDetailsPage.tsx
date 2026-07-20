import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { purchaseApi } from "../../api/purchase.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { ConfirmDialog } from "../../app/components/common/ConfirmDialog";
import { PageHeader } from "../../app/components/common/PageHeader";
import { PaymentModal } from "../../features/purchases/PaymentModal";
import { SupplierPaymentReversalDialog } from "../../features/purchases/SupplierPaymentReversalDialog";
import type { PurchaseOrder } from "../../features/purchases/purchase.types";
import { useAuth } from "../../hooks/useAuth";
import { fmt, formatQuantity } from "../../utils/currency";
import { hasPermission } from "../../utils/permissions";
import { StatCard } from "../../app/components/common/Card";
import { ArrowLeft, Plus, CheckCircle, Ban, DollarSign, Package, Layers, Clock, AlertTriangle, ArrowLeftRight, User, Phone, MapPin, Printer } from "lucide-react";

export default function PurchaseDetailsPage() {
  const { id = "" } = useParams();
  const { user, business } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState("");
  const [action, setAction] = useState<"send" | "cancel" | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [payment, setPayment] = useState(false);
  const [receiveBusy, setReceiveBusy] = useState(false);
  const [reversing, setReversing] = useState<PurchaseOrder["payments"][number] | null>(null);
  const [reverseBusy, setReverseBusy] = useState(false);
  const [qty, setQty] = useState<Record<string, string>>({});

  const load = () => purchaseApi.get(id).then(r => {
    setOrder(r.data);
    setQty(Object.fromEntries(r.data.items.map(i => [i.id, String(Math.max(0, Number(i.quantity) - Number(i.receivedQuantity)))])));
  }).catch(e => setError(e.message));

  useEffect(() => {
    void load();
  }, [id]);

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>;
  if (!order) return <div className="h-64 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Loading PO Details" />;

  const manage = hasPermission(user, "purchases:manage");
  const manageFinancials = hasPermission(user, "financials:manage");
  const canCancel = manage && ["DRAFT", "SENT"].includes(order.status);

  const act = async () => {
    if (!action) return;
    try {
      if (action === "send") {
        await purchaseApi.send(id);
        toast.success("Purchase Order sent");
      } else {
        await purchaseApi.cancel(id);
        toast.success("Purchase Order cancelled");
      }
      setAction(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    }
  };

  const receive = async () => {
    setReceiveBusy(true);
    try {
      const items = order.items.map(i => ({
        purchaseOrderItemId: i.id,
        quantity: Number(qty[i.id] || 0)
      })).filter(i => i.quantity > 0);
      await purchaseApi.receive(id, { items, idempotencyKey: crypto.randomUUID() });
      toast.success("Materials received and stock increased");
      setReceiving(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Receiving failed.");
    } finally {
      setReceiveBusy(false);
    }
  };

  const reverse = async (reason: string) => {
    if (!reversing || reverseBusy) return;
    setReverseBusy(true);
    try {
      await purchaseApi.reversePayment(id, reversing.id, reason);
      toast.success("Supplier payment reversed");
      setReversing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment could not be reversed.");
    } finally {
      setReverseBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <button 
        onClick={() => navigate("/purchases")} 
        className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer"
      >
        <ArrowLeft size={14}/>
        Back to Purchases
      </button>

      {/* Header */}
      <PageHeader 
        title={order.purchaseOrderNumber} 
        description={`${order.supplierName} &middot; ${new Date(order.orderDate).toLocaleDateString("en-IN")}`} 
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => window.print()} 
              className="flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <Printer size={14} className="mr-1.5" />
              Print PO
            </button>
            <BusinessStatusBadge status={order.status}/>
            {manage && order.status === "DRAFT" && (
              <button 
                onClick={() => setAction("send")} 
                className="flex min-h-10 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white shadow-sm cursor-pointer transition-colors"
              >
                <CheckCircle size={14} className="mr-1.5" />
                Send Purchase Order
              </button>
            )}
            {manage && ["SENT", "PARTIALLY_RECEIVED"].includes(order.status) && (
              <button 
                onClick={() => setReceiving(true)} 
                className="flex min-h-10 items-center justify-center rounded-xl bg-green-600 hover:bg-green-700 px-4 text-xs font-bold text-white shadow-sm cursor-pointer transition-colors"
              >
                <Package size={14} className="mr-1.5" />
                Receive Stock
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

      {/* 7. Supplier Outstanding Card */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Payable Metrics */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 md:col-span-2">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Supplier Outstanding details</h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Payable</span>
              <strong className="text-slate-900 text-base font-black mt-1 block">{fmt(order.totalAmount)}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Paid Amount</span>
              <strong className="text-green-700 text-base font-black mt-1 block">{fmt(order.amountPaid)}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Amount</span>
              <strong className="text-red-600 text-base font-black mt-1 block">{fmt(order.balanceDue)}</strong>
            </div>
          </div>
          {Number(order.balanceDue) > 0 && manageFinancials && (
            <button 
              onClick={() => setPayment(true)} 
              className="flex min-h-10 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
            >
              <DollarSign size={14} className="mr-1" />
              Pay Supplier
            </button>
          )}
        </div>

        {/* Supplier Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Supplier Profile</h3>
          <div>
            <Link to={`/suppliers/${order.supplierId}`} className="font-bold text-orange-600 hover:text-orange-700 hover:underline text-sm block">
              {order.supplierName}
            </Link>
            <p className="text-slate-500 font-semibold mt-1">{order.supplierPhone}</p>
            {order.supplierGstin && <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">GSTIN: {order.supplierGstin}</p>}
          </div>
        </div>
      </div>

      {/* Materials list */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Ordered Materials</h3>
        <div className="space-y-4">
          {order.items.map(i => (
            <article key={i.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm block">{i.materialName}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{i.godown.name} &middot; {i.sku}</span>
              </div>
              
              <div className="flex gap-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Ordered</span>
                  <strong className="text-slate-950 block mt-0.5">{formatQuantity(i.quantity, i.unit)}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Received</span>
                  <strong className="text-green-700 block mt-0.5">{formatQuantity(i.receivedQuantity, i.unit)}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
                  <strong className="text-red-600 block mt-0.5">{formatQuantity(Math.max(0, Number(i.quantity) - Number(i.receivedQuantity)), i.unit)}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Line Total</span>
                  <strong className="text-slate-950 block mt-0.5">{fmt(i.lineTotal)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Financials totals */}
      <section className="ml-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 text-xs font-semibold text-slate-500">
        <Row label="Subtotal" value={fmt(order.subtotal)}/>
        <Row label="Discount" value={fmt(order.discountTotal)}/>
        <Row label="GST taxes" value={fmt(order.taxTotal)}/>
        <div className="border-t pt-3 mt-1">
          <Row label="Grand Total" value={fmt(order.totalAmount)} large/>
        </div>
        <Row label="Payment Status" value={order.paymentStatus}/>
      </section>

      {/* Receipts list */}
      {order.receipts?.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Goods Receipt Logs</h3>
          <div className="space-y-2">
            {order.receipts.map(r => (
              <div key={r.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <strong className="text-slate-800">Challan: {r.receiptNumber}</strong>
                  <span className="block text-[10px] text-slate-400 mt-0.5">{new Date(r.receiptDate).toLocaleString("en-IN")}</span>
                </div>
                <strong className="text-slate-900">{fmt(r.totalAmount)}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Payments list */}
      {order.payments.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Supplier Payments history</h3>
          <div className="space-y-2">
            {order.payments.map(p => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-2.5 last:border-0">
                <div>
                  <span className={`font-bold text-slate-800 ${p.status === "REVERSED" ? "text-slate-400 line-through" : ""}`}>
                    {p.paymentNumber} &middot; {p.paymentMode}
                  </span>
                  {p.status === "REVERSED" && (
                    <small className="block text-red-700 mt-1">Reversed: {p.reversalReason}</small>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <strong className={p.status === "REVERSED" ? "text-slate-400 line-through" : "text-slate-900"}>{fmt(p.amount)}</strong>
                  {manageFinancials && p.status === "POSTED" && (
                    <button 
                      onClick={() => setReversing(p)} 
                      className="min-h-[30px] rounded-lg border border-red-200 px-3 text-[10px] font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Reverse
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Status Timeline */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 max-w-md">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Purchase Order Timeline</h3>
        
        <div className="relative border-l border-slate-100 pl-5 space-y-4 text-xs">
          <div className="relative">
            <div className="absolute -left-[24.5px] top-0.5 h-2.5 w-2.5 rounded-full border bg-white border-green-600" />
            <p className="font-bold text-slate-900">PO Created</p>
          </div>
          
          {order.status !== "DRAFT" && (
            <div className="relative">
              <div className="absolute -left-[24.5px] top-0.5 h-2.5 w-2.5 rounded-full border bg-white border-green-600" />
              <p className="font-bold text-slate-900">PO Sent to Supplier</p>
            </div>
          )}

          {["PARTIALLY_RECEIVED", "RECEIVED"].includes(order.status) && (
            <div className="relative">
              <div className="absolute -left-[24.5px] top-0.5 h-2.5 w-2.5 rounded-full border bg-white border-green-600" />
              <p className="font-bold text-slate-900">Stock Received (Warehouse)</p>
            </div>
          )}

          {order.status === "RECEIVED" && (
            <div className="relative">
              <div className="absolute -left-[24.5px] top-0.5 h-2.5 w-2.5 rounded-full border bg-white border-orange-500" />
              <p className="font-bold text-orange-600">PO Completed</p>
            </div>
          )}

          {order.status === "CANCELLED" && (
            <div className="relative">
              <div className="absolute -left-[24.5px] top-0.5 h-2.5 w-2.5 rounded-full border bg-white border-red-500" />
              <p className="font-bold text-red-600">PO Cancelled</p>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog 
        open={!!action} 
        title={action === "send" ? "Send Purchase Order?" : "Cancel Purchase Order?"} 
        description={action === "send" ? "The order will be ready for Material receiving." : "Only unreceived orders can be cancelled."} 
        confirmLabel={action === "send" ? "Send Order" : "Cancel Order"} 
        destructive={action === "cancel"} 
        onCancel={() => setAction(null)} 
        onConfirm={act}
      />

      {/* 6. Goods Receipt Dialog */}
      {receiving && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-xl sm:rounded-2xl space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Receive Materials</h2>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1">Record incoming stock received at warehouse</p>
            </div>
            
            <div className="space-y-4">
              {order.items.filter(i => Number(i.receivedQuantity) < Number(i.quantity)).map(i => (
                <div key={i.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 text-xs">
                  <span className="font-bold text-slate-800 text-sm block">{i.materialName}</span>
                  
                  <div className="grid grid-cols-3 gap-2 text-center border-b pb-2 border-slate-200/50">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Ordered</span>
                      <strong className="block text-slate-800 mt-0.5">{formatQuantity(i.quantity, i.unit)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Received</span>
                      <strong className="block text-green-700 mt-0.5">{formatQuantity(i.receivedQuantity, i.unit)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Remaining</span>
                      <strong className="block text-red-600 mt-0.5">{formatQuantity(Number(i.quantity) - Number(i.receivedQuantity), i.unit)}</strong>
                    </div>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current receiving quantity</span>
                    <input 
                      aria-label={`Receive ${i.materialName}`} 
                      type="number" 
                      min="0" 
                      max={Number(i.quantity) - Number(i.receivedQuantity)} 
                      step="0.001" 
                      value={qty[i.id] || ""} 
                      onChange={e => setQty({ ...qty, [i.id]: e.target.value })} 
                      className="mt-2 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </label>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <button 
                onClick={() => setReceiving(false)} 
                className="min-h-10 flex-1 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                disabled={receiveBusy} 
                onClick={receive} 
                className="min-h-10 flex-[2] rounded-xl bg-orange-600 font-bold text-white text-xs hover:bg-orange-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {receiveBusy ? "Receiving..." : "Receive and Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {payment && (
        <PaymentModal id={id} balance={Number(order.balanceDue)} onClose={() => setPayment(false)} onDone={() => { setPayment(false); void load(); }}/>
      )} 
      
      <SupplierPaymentReversalDialog open={!!reversing} paymentNumber={reversing?.paymentNumber || "payment"} busy={reverseBusy} onCancel={() => !reverseBusy && setReversing(null)} onConfirm={reverse}/>

      {/* 10. Printable Purchase Order (A4 Print-only template) */}
      <article className="invoice-print-root hidden print:block bg-white p-8 text-xs">
        <header className="flex justify-between border-b pb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{business?.name || "APNI ESTATE"}</h2>
            {business?.address && <p className="max-w-md text-xs text-slate-500 mt-1 leading-relaxed">{business.address}</p>}
            {business?.phone && <p className="text-xs text-slate-500 mt-1">Phone: {business.phone}</p>}
            {business?.gstNumber && <p className="text-xs text-slate-700 font-bold mt-1 uppercase">GSTIN: {business.gstNumber}</p>}
          </div>
          <div className="text-right">
            <h3 className="text-base font-black text-slate-800 tracking-wider uppercase">PURCHASE ORDER</h3>
            <p className="font-bold text-sm text-slate-700 mt-1">{order.purchaseOrderNumber}</p>
            <p className="text-xs text-slate-500 mt-1">Date: {new Date(order.orderDate).toLocaleDateString("en-IN")}</p>
          </div>
        </header>

        <section className="grid gap-5 border-b py-6 grid-cols-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vendor / Supplier</span>
            <p className="font-bold text-slate-900 text-sm mt-1">{order.supplierName}</p>
            <p className="text-slate-600 mt-0.5">{order.supplierPhone}</p>
            {order.supplierGstin && <p className="font-bold text-slate-700 mt-1 uppercase">GSTIN: {order.supplierGstin}</p>}
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
              {order.items.map((i) => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="p-3">
                    <span className="block font-bold text-slate-900">{i.materialName}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{i.sku}</span>
                  </td>
                  <td className="text-slate-600 font-medium">{formatQuantity(i.quantity, i.unit)}</td>
                  <td className="text-slate-600 font-medium">{fmt(i.rate)}</td>
                  <td className="text-slate-500 font-medium">{i.discountRate}%</td>
                  <td className="text-slate-500 font-medium">{i.gstRate || 0}%</td>
                  <td className="font-black text-slate-950">{fmt(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="ml-auto mt-6 max-w-sm space-y-1.5 text-xs">
          <Row label="Subtotal" value={fmt(order.subtotal)}/>
          <Row label="Discount" value={fmt(order.discountTotal)}/>
          <Row label="GST taxes" value={fmt(order.taxTotal)}/>
          <div className="border-t pt-2 mt-1">
            <Row label="Grand Total" value={fmt(order.totalAmount)} large/>
          </div>
        </section>
      </article>
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
