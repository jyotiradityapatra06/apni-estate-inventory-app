import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import invoiceApi from "../../api/invoice.api";
import salesOrderApi from "../../api/salesOrder.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import { fmt, formatQuantity } from "../../utils/currency";
import { calculateOrder } from "../../features/sales-orders/salesOrderCalculations";
import type { SalesOrder } from "../../features/sales-orders/salesOrder.types";

type Line = { id: string; quantity: string; rate: string; discountRate: string; gstRate: string };

export default function CreateInvoicePage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [orderId, setOrderId] = useState(params.get("salesOrderId") || "");
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [type, setType] = useState<"GST" | "NON_GST">("GST");
  const [lines, setLines] = useState<Line[]>([]);
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    salesOrderApi
      .getAll()
      .then((r) => setOrders(r.data.filter((x) => ["CONFIRMED", "PARTIALLY_INVOICED"].includes(x.status))))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    salesOrderApi
      .getById(orderId)
      .then((r) => {
        setOrder(r.data);
        setType(r.data.taxMode);
        setLines(
          r.data.items
            .map((x) => ({
              id: x.id,
              quantity: String(Math.max(0, Number(x.quantity) - Number(x.invoicedQuantity || 0))),
              rate: String(x.rate),
              discountRate: String(x.discountRate),
              gstRate: String(x.gstRate),
            }))
            .filter((x) => Number(x.quantity) > 0)
        );
      })
      .catch((e) => setError(e.message));
  }, [orderId]);

  const summary = useMemo(
    () =>
      calculateOrder(
        lines.map((x) => ({
          ...x,
          quantity: x.quantity,
          rate: x.rate,
          discountRate: x.discountRate,
          gstRate: x.gstRate,
        })),
        type
      ),
    [lines, type]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!order || !lines.length) return setError("Please select an eligible Sales Order.");

    for (const line of lines) {
      const item = order.items.find((x) => x.id === line.id)!;
      const remaining = Number(item.quantity) - Number(item.invoicedQuantity || 0);
      if (Number(line.quantity) <= 0 || Number(line.quantity) > remaining)
        return setError(`Invoice quantity for ${item.materialName} must be between 0 and ${remaining} ${item.unit}.`);
    }

    setSaving(true);
    try {
      const r = await invoiceApi.create({
        salesOrderId: order.id,
        invoiceType: type,
        dueDate: due ? new Date(due).toISOString() : undefined,
        notes: notes || undefined,
        terms: terms || undefined,
        items: lines.map((x) => ({
          salesOrderItemId: x.id,
          quantity: x.quantity,
          rate: x.rate,
          discountRate: x.discountRate,
        })),
      });
      toast.success(`Draft Invoice ${r.data.invoiceNumber} created`);
      window.dispatchEvent(new Event("notifications:refresh"));
      nav(`/invoices/${r.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invoice could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none";

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6 pb-28">
      <PageHeader
        title="Create Customer Invoice"
        description="Generate a GST Tax Invoice or Non-GST Bill from a confirmed Sales Order."
      />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          <AlertTriangle size={18} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Sales Order & Bill Type */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <SectionHeader title="Sales Order & Bill Category" description="Choose confirmed sales order and select bill tax classification." />

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Select Confirmed Sales Order *
          <select required value={orderId} onChange={(e) => setOrderId(e.target.value)} className={inputClass}>
            <option value="">Choose confirmed Sales Order…</option>
            {orders.map((x) => (
              <option key={x.id} value={x.id}>
                {x.orderNumber} — {x.customerName} ({fmt(x.totalAmount)})
              </option>
            ))}
          </select>
        </label>

        {/* GST vs Non-GST Selector Cards */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <button
            type="button"
            onClick={() => setType("GST")}
            className={`min-h-[84px] rounded-2xl border p-4 text-left cursor-pointer transition-all ${
              type === "GST"
                ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-sm"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-blue-900">GST Tax Invoice</span>
              {type === "GST" && <CheckCircle2 size={18} className="text-blue-600" />}
            </div>
            <p className="mt-1 text-xs text-slate-600 font-medium">Includes HSN code, CGST, SGST & IGST tax breakdown.</p>
          </button>

          <button
            type="button"
            onClick={() => setType("NON_GST")}
            className={`min-h-[84px] rounded-2xl border p-4 text-left cursor-pointer transition-all ${
              type === "NON_GST"
                ? "border-slate-800 bg-slate-100 ring-2 ring-slate-800/20 shadow-sm"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-slate-900">Non-GST Bill</span>
              {type === "NON_GST" && <CheckCircle2 size={18} className="text-slate-800" />}
            </div>
            <p className="mt-1 text-xs text-slate-600 font-medium">Simple commercial voucher without tax breakdown.</p>
          </button>
        </div>

        {order && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Customer Account</span>
            <b className="text-sm font-black text-slate-900 block">{order.customerName}</b>
            <p className="text-slate-600 font-semibold">
              Phone: {order.customerPhone} {order.customerGstin ? `· GSTIN: ${order.customerGstin}` : ""}
            </p>
          </div>
        )}
      </section>

      {/* Invoice Items */}
      {order && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <SectionHeader title="Invoice Line Items" description="Specify billing quantity per item. Partial invoicing supported." />

          <div className="space-y-4 pt-1">
            {lines.map((line, i) => {
              const item = order.items.find((x) => x.id === line.id)!;
              const already = Number(item.invoicedQuantity || 0);
              const remaining = Number(item.quantity) - already;

              return (
                <article key={line.id} className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <b className="text-sm font-black text-slate-900 block">{item.materialName}</b>
                      <p className="text-xs text-slate-500 font-bold">
                        SKU: {item.sku} {type === "GST" && item.hsnCode ? `· HSN: ${item.hsnCode}` : ""}
                      </p>
                    </div>
                    <strong className="text-base font-black text-slate-900">
                      {fmt(Number(line.quantity) * Number(line.rate))}
                    </strong>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 pt-2 border-t border-slate-200/60">
                    <Mini label="Ordered Qty" value={formatQuantity(item.quantity, item.unit)} />
                    <Mini label="Already Invoiced" value={formatQuantity(already, item.unit)} />
                    <Mini label="Remaining Qty" value={formatQuantity(remaining, item.unit)} isGreen />
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      Invoice Now
                      <input
                        aria-label={`Invoice quantity ${item.materialName}`}
                        type="number"
                        min="0.001"
                        max={remaining}
                        step="0.001"
                        value={line.quantity}
                        onChange={(e) =>
                          setLines((x) => x.map((v, n) => (n === i ? { ...v, quantity: e.target.value } : v)))
                        }
                        className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-black text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-200/60 text-slate-600">
                    <Mini label="Unit Rate" value={fmt(line.rate)} />
                    <Mini label="Discount" value={`${line.discountRate}%`} />
                    {type === "GST" && <Mini label="GST Rate" value={`${line.gstRate}%`} />}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Due Date & Notes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <SectionHeader title="Payment Due Date & Terms" description="Set invoice payment due date and custom notes." />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Payment Due Date
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputClass} />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Payment Terms
            <input
              placeholder="e.g. Net 15 days or Due on receipt"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block md:col-span-2">
            Notes / Bank Account Details
            <textarea
              rows={2}
              placeholder="Payment terms, bank UPI ID, or delivery terms"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} min-h-20 p-3`}
            />
          </label>
        </div>
      </section>

      {/* Financial Summary */}
      <section className="ml-auto max-w-lg rounded-2xl bg-slate-950 p-5 text-white shadow-sm space-y-2">
        <Row label="Subtotal" value={fmt(summary.subtotal)} />
        <Row label="Discount" value={fmt(summary.discount)} />
        <Row label="Taxable Value" value={fmt(summary.taxable)} />
        {type === "GST" && <Row label="GST Tax" value={fmt(summary.tax)} />}
        <div className="mt-3 border-t border-slate-800 pt-3">
          <Row label="Grand Total Amount" value={fmt(summary.total)} large />
        </div>
      </section>

      {/* Action Footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))] md:static md:justify-end md:border-0 md:bg-transparent md:p-0">
        <button
          type="button"
          onClick={() => nav(-1)}
          className="min-h-[48px] flex-1 rounded-xl border border-slate-200 text-xs sm:text-sm font-extrabold text-slate-700 hover:bg-slate-50 md:flex-none md:px-6 cursor-pointer"
        >
          Cancel
        </button>
        <button
          disabled={saving || !order}
          type="submit"
          className="min-h-[48px] flex-[2] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs sm:text-sm font-extrabold text-white cursor-pointer shadow-xs disabled:opacity-60 md:flex-none md:px-8"
        >
          {saving ? "Creating Invoice…" : type === "GST" ? "Create GST Tax Invoice" : "Create Non-GST Bill"}
        </button>
      </div>
    </form>
  );
}

function Mini({ label, value, isGreen = false }: { label: string; value: string; isGreen?: boolean }) {
  return (
    <div>
      <span className="text-[10px] font-black uppercase text-slate-400 block">{label}</span>
      <strong className={`text-xs sm:text-sm font-black mt-0.5 block ${isGreen ? "text-green-700" : "text-slate-900"}`}>
        {value}
      </strong>
    </div>
  );
}

function Row({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1 ${large ? "text-lg font-black text-orange-400" : "text-xs text-slate-300 font-semibold"}`}>
      <span>{label}:</span>
      <b>{value}</b>
    </div>
  );
}
