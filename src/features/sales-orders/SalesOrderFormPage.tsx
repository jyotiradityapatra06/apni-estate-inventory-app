import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { customerApi } from "../../api/customer.api";
import { inventoryApi, type InventoryItemData } from "../../api/inventory.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import salesOrderApi from "../../api/salesOrder.api";
import type { Customer } from "../../types/customer.types";
import { fmt } from "../../utils/currency";
import { calculateLine, calculateOrder } from "./salesOrderCalculations";

type Line = { inventoryItemId: string; godownId: string; quantity: string; rate: string; discountRate: string; gstRate: string };
const blank = (): Line => ({ inventoryItemId: "", godownId: "", quantity: "", rate: "", discountRate: "0", gstRate: "0" });
const cls = "mt-2 min-h-12 w-full rounded-lg border bg-white px-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none";

export function SalesOrderFormPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<InventoryItemData[]>([]);
  const [customerId, setCustomerId] = useState(searchParams.get("customerId") || "");
  const [taxMode, setTaxMode] = useState<"GST" | "NON_GST">("GST");
  const [items, setItems] = useState<Line[]>([blank()]);
  const [details, setDetails] = useState({ expectedDeliveryDate: "", billingAddress: "", deliveryAddress: "", placeOfSupplyCode: "", notes: "", terms: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([customerApi.getAll(), inventoryApi.getItems()])
      .then(([c, m]) => {
        setCustomers(c.data || []);
        setMaterials(m.data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const customer = customers.find(c => c.id === customerId);

  useEffect(() => {
    if (customer) {
      setDetails(prev => ({
        ...prev,
        billingAddress: customer.billingAddress || "",
        deliveryAddress: customer.shippingAddress || ""
      }));
    }
  }, [customerId, customers]);

  const change = (i: number, k: keyof Line, v: string) => 
    setItems(x => x.map((line, n) => n === i ? { ...line, [k]: v } : line));

  const summary = useMemo(() => calculateOrder(items, taxMode), [items, taxMode]);

  const available = (line: Line) => {
    const m = materials.find(x => x.id === line.inventoryItemId);
    const b = m?.godownStocks?.find(x => x.godown.id === line.godownId);
    return {
      material: m,
      balance: b,
      value: Math.max(0, Number(b?.quantity || 0) - Number(b?.reservedQuantity || 0))
    };
  };

  const validate = () => {
    if (!customerId) return "Select a customer.";
    const keys = new Set<string>();
    for (const line of items) {
      if (!line.inventoryItemId || !line.godownId || Number(line.quantity) <= 0 || Number(line.rate) < 0) return "Complete every material line.";
      const key = `${line.inventoryItemId}:${line.godownId}`;
      if (keys.has(key)) return "The same material and Godown can only appear once.";
      keys.add(key);
      const a = available(line);
      if (Number(line.quantity) > a.value) return `Only ${a.value} ${a.material?.unit || "units"} are available in ${a.balance?.godown.name || "the selected Godown"}.`;
    }
    return "";
  };

  const body = () => ({
    customerId,
    taxMode,
    expectedDeliveryDate: details.expectedDeliveryDate ? new Date(details.expectedDeliveryDate).toISOString() : undefined,
    billingAddress: details.billingAddress || undefined,
    deliveryAddress: details.deliveryAddress || undefined,
    placeOfSupplyCode: details.placeOfSupplyCode || undefined,
    notes: details.notes || undefined,
    terms: details.terms || undefined,
    items: items.map(x => ({
      inventoryItemId: x.inventoryItemId,
      godownId: x.godownId,
      quantity: x.quantity,
      rate: x.rate,
      discountRate: x.discountRate,
      gstRate: taxMode === "GST" ? x.gstRate : "0"
    }))
  });

  const save = async (confirm: boolean) => {
    const message = validate();
    if (message) {
      setError(message);
      setReview(false);
      return;
    }
    setSaving(true);
    try {
      const created = await salesOrderApi.create(body());
      toast.success(`Draft ${created.data.orderNumber} saved`);
      if (confirm) {
        setConfirming(true);
        try {
          await salesOrderApi.confirm(created.data.id);
          toast.success("Order confirmed and stock reserved");
          window.dispatchEvent(new Event("notifications:refresh"));
        } catch (e) {
          toast.error(`Draft saved, but confirmation failed: ${e instanceof Error ? e.message : "Please retry from the order."}`);
        }
      }
      nav(`/sales-orders/${created.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sales Order could not be saved.");
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-slate-200" />;

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-28">
      <PageHeader title="New Sale" description="Create a customer order and save it as a Draft." />
      {error && <p className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{error}</p>}
      
      <section className="rounded-xl border bg-white p-4 md:p-6">
        <SectionHeader title="Customer" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Customer
            <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className={cls}>
              <option value="">Choose customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}{c.gstin ? ` - ${c.gstin}` : ""}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Tax mode
            <select value={taxMode} onChange={e => setTaxMode(e.target.value as "GST" | "NON_GST")} className={cls}>
              <option value="GST">GST Sales Order</option>
              <option value="NON_GST">Non-GST Sales Order</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Order Items" description="Choose a material and the exact Godown supplying it." />
        {items.map((line, i) => {
          const a = available(line);
          const calc = calculateLine(line, taxMode);
          const balances = a.material?.godownStocks || [];
          return (
            <article key={i} className="rounded-xl border bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-6">
                <label className="text-sm font-semibold lg:col-span-2">
                  Material
                  <select required value={line.inventoryItemId} onChange={e => {
                    const m = materials.find(x => x.id === e.target.value);
                    setItems(x => x.map((l, n) => n === i ? {
                      ...l,
                      inventoryItemId: e.target.value,
                      godownId: (m?.godownStocks?.length === 1 ? m.godownStocks[0].godown.id : ""),
                      rate: String(m?.sellingPrice ?? ""),
                      gstRate: String(m?.taxRate ?? 0),
                      quantity: ""
                    } : l));
                  }} className={cls}>
                    <option value="">Choose material</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.materialName} - {m.sku} - {m.unit}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Godown
                  <select required disabled={!a.material} value={line.godownId} onChange={e => change(i, "godownId", e.target.value)} className={cls}>
                    <option value="">Choose Godown</option>
                    {balances.map(b => (
                      <option key={b.id} value={b.godown.id}>{b.godown.name} - {Math.max(0, b.quantity - Number(b.reservedQuantity || 0))} available</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Quantity
                  <input required type="number" min="0.001" step="0.001" max={line.godownId ? a.value : undefined} value={line.quantity} onChange={e => change(i, "quantity", e.target.value)} className={cls} />
                </label>
                <label className="text-sm font-semibold">
                  Rate
                  <input required type="number" min="0" step="0.01" value={line.rate} onChange={e => change(i, "rate", e.target.value)} className={cls} />
                </label>
                <label className="text-sm font-semibold">
                  Discount %
                  <div className="flex gap-1">
                    <input type="number" min="0" max="100" step="0.01" value={line.discountRate} onChange={e => change(i, "discountRate", e.target.value)} className={cls} />
                    {items.length > 1 && (
                      <button type="button" aria-label={`Remove item ${i + 1}`} onClick={() => setItems(x => x.filter((_, n) => n !== i))} className="mt-2 h-12 w-12 text-red-700">
                        <Trash2 className="mx-auto" size={19} />
                      </button>
                    )}
                  </div>
                </label>

                {a.balance && (
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-xs lg:col-span-3">
                    <Mini label="Physical" value={`${a.balance.quantity} ${a.material?.unit}`} />
                    <Mini label="Reserved" value={`${a.balance.reservedQuantity || 0} ${a.material?.unit}`} />
                    <Mini label="Available" value={`${a.value} ${a.material?.unit}`} />
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-blue-50 p-3 text-xs lg:col-span-3">
                  <Mini label="Taxable" value={fmt(calc.taxable)} />
                  <Mini label="Tax" value={fmt(calc.tax)} />
                  <Mini label="Line Total" value={fmt(calc.total)} />
                </div>
              </div>
            </article>
          );
        })}
        <button type="button" onClick={() => setItems(x => [...x, blank()])} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 font-semibold text-blue-700">
          <Plus size={19} />
          Add another material
        </button>
      </section>

      <section className="rounded-xl border bg-white p-4 md:p-6">
        <SectionHeader title="Delivery Information and Notes" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Expected delivery
            <input type="date" value={details.expectedDeliveryDate} onChange={e => setDetails({ ...details, expectedDeliveryDate: e.target.value })} className={cls} />
          </label>
          <label className="text-sm font-semibold">
            Place of supply code
            <input maxLength={2} inputMode="numeric" value={details.placeOfSupplyCode} onChange={e => setDetails({ ...details, placeOfSupplyCode: e.target.value })} className={cls} />
          </label>
          <label className="text-sm font-semibold">
            Billing address
            <textarea value={details.billingAddress} onChange={e => setDetails({ ...details, billingAddress: e.target.value })} className={`${cls} min-h-24 p-3`} />
          </label>
          <label className="text-sm font-semibold">
            Delivery address
            <textarea value={details.deliveryAddress} onChange={e => setDetails({ ...details, deliveryAddress: e.target.value })} className={`${cls} min-h-24 p-3`} />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Notes
            <textarea value={details.notes} onChange={e => setDetails({ ...details, notes: e.target.value })} className={`${cls} min-h-20 p-3`} />
          </label>
        </div>
      </section>

      <section className="ml-auto max-w-lg rounded-xl bg-slate-950 p-5 text-white">
        <Row label="Subtotal" value={fmt(summary.subtotal)} />
        <Row label="Discount" value={fmt(summary.discount)} />
        <Row label="Tax" value={fmt(summary.tax)} />
        <div className="mt-3 border-t border-slate-700 pt-3">
          <Row label="Order Total" value={fmt(summary.total)} large />
        </div>
        <p className="mt-3 text-xs text-slate-300">
          {items.length} line{items.length === 1 ? "" : "s"}. Backend totals remain authoritative. Stock is reserved only after confirmation.
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-[72px] z-30 grid grid-cols-2 gap-2 border-t bg-white p-3 md:static md:ml-auto md:flex md:justify-end md:border-0 md:bg-transparent">
        <button disabled={saving} onClick={() => save(false)} className="min-h-12 rounded-lg border px-5 font-semibold">
          {saving && !confirming ? "Saving..." : "Save Draft"}
        </button>
        <button disabled={saving} onClick={() => {
          const m = validate();
          if (m) setError(m);
          else setReview(true);
        }} className="min-h-12 rounded-lg bg-blue-700 px-5 font-semibold text-white">
          Confirm Order
        </button>
      </div>

      {review && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 sm:items-center sm:p-4">
          <div className="w-full rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl">
            <h2 className="text-xl font-bold">Confirm Sales Order?</h2>
            <div className="mt-5 space-y-3">
              <Mini label="Customer" value={customer?.name || ""} />
              <Mini label="Items" value={`${items.length} Material${items.length === 1 ? "" : "s"}`} />
              <Mini label="Order Total" value={fmt(summary.total)} />
            </div>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Confirming this order will reserve the required stock. Physical stock will not be deducted.
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setReview(false)} className="min-h-12 flex-1 rounded-lg border font-semibold">Back</button>
              <button disabled={saving} onClick={() => save(true)} className="min-h-12 flex-[2] rounded-lg bg-blue-700 font-semibold text-white">
                {saving ? "Confirming..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <b>{value}</b>
    </div>
  );
}

function Row({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${large ? "text-xl" : "text-sm"}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
export default SalesOrderFormPage;
