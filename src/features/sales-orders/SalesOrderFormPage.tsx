import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { customerApi } from "../../api/customer.api";
import { inventoryApi, type InventoryItemData } from "../../api/inventory.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import { MobileStickyFooter } from "../../app/components/mobile/MobileStickyFooter";
import salesOrderApi from "../../api/salesOrder.api";
import type { Customer } from "../../types/customer.types";
import { fmt } from "../../utils/currency";
import { calculateLine, calculateOrder } from "./salesOrderCalculations";

type Line = { inventoryItemId: string; godownId: string; quantity: string; rate: string; discountRate: string; gstRate: string };
const blank = (): Line => ({ inventoryItemId: "", godownId: "", quantity: "", rate: "", discountRate: "0", gstRate: "0" });
const cls = "mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none";

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
    <div className="mx-auto max-w-5xl space-y-5 pb-32">
      <PageHeader title="New Sale" description="Create a customer order and save it as a Draft." />
      {error && <p className="rounded-xl bg-red-50 p-3 font-semibold text-xs text-red-800 border border-red-200">{error}</p>}
      
      {/* Zero Data Alerts for New Accounts */}
      {!customers.length && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">No customers found</p>
            <p>Please add your first customer before creating a sales order.</p>
            <Link to="/customers/new" className="inline-block font-bold text-orange-600 underline mt-1">
              + Add Customer First
            </Link>
          </div>
        </div>
      )}

      {!materials.length && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">No materials found</p>
            <p>Please create your first material to add items to a sale.</p>
            <Link to="/materials/new" className="inline-block font-bold text-orange-600 underline mt-1">
              + Create First Material
            </Link>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <SectionHeader title="Customer & Billing Type" description="Select customer account and choose GST or Non-GST billing." />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Select Customer *
            <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className={cls}>
              <option value="">Choose customer account…</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone}){c.gstin ? ` · GST: ${c.gstin}` : ""}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Billing / Tax Mode *
            <select value={taxMode} onChange={e => setTaxMode(e.target.value as "GST" | "NON_GST")} className={cls}>
              <option value="GST">GST Sales Order (Tax Invoice)</option>
              <option value="NON_GST">Non-GST Sales Order (Bill of Supply)</option>
            </select>
          </label>
        </div>

        {/* Selected Customer Card Preview */}
        {customer && (
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black text-sm text-slate-900">{customer.name}</span>
              {customer.gstin && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase border border-blue-100">
                  GSTIN: {customer.gstin}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-600 pt-1">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Phone</span>
                <strong className="text-slate-900 font-bold block">{customer.phone}</strong>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Outstanding Dues</span>
                <strong className={`font-black block ${customer.outstandingBalance > 0 ? "text-red-600" : "text-slate-900"}`}>
                  {fmt(customer.outstandingBalance)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Credit Limit</span>
                <strong className="text-slate-900 font-bold block">{fmt(customer.creditLimit)}</strong>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader title="Order Items" description="Choose materials, supplying warehouse godown, quantity, and rate." />
        {items.map((line, i) => {
          const a = available(line);
          const calc = calculateLine(line, taxMode);
          const balances = a.material?.godownStocks || [];
          const isOverStock = line.godownId && Number(line.quantity) > a.value;

          return (
            <article key={i} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-orange-600">Material Item #{i + 1}</span>
                {items.length > 1 && (
                  <button type="button" aria-label={`Remove item ${i + 1}`} onClick={() => setItems(x => x.filter((_, n) => n !== i))} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-6">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block md:col-span-2">
                  Material Item *
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
                    <option value="">Choose material item…</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.materialName} ({m.unit}) · SKU: {m.sku}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block md:col-span-2">
                  Supplying Godown *
                  <select required disabled={!a.material} value={line.godownId} onChange={e => change(i, "godownId", e.target.value)} className={cls}>
                    <option value="">Choose Godown warehouse…</option>
                    {balances.map(b => (
                      <option key={b.id} value={b.godown.id}>{b.godown.name} ({Math.max(0, b.quantity - Number(b.reservedQuantity || 0))} {a.material?.unit} avail)</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Quantity ({a.material ? a.material.unit : "Qty"}) *
                  <input required type="number" inputMode="decimal" min="0.001" step="0.001" placeholder="0.00" value={line.quantity} onChange={e => change(i, "quantity", e.target.value)} className={cls} />
                </label>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Unit Rate (₹) *
                  <input required type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={line.rate} onChange={e => change(i, "rate", e.target.value)} className={cls} />
                </label>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block md:col-span-2">
                  Discount %
                  <input type="number" inputMode="decimal" min="0" max="100" step="0.01" value={line.discountRate} onChange={e => change(i, "discountRate", e.target.value)} className={cls} />
                </label>

                {a.balance && (
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs md:col-span-4 border border-slate-100 text-center">
                    <Mini label="Physical Stock" value={`${a.balance.quantity} ${a.material?.unit}`} />
                    <Mini label="Reserved Stock" value={`${a.balance.reservedQuantity || 0} ${a.material?.unit}`} />
                    <Mini label="Net Available" value={`${a.value} ${a.material?.unit}`} isGreen />
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-orange-50/60 p-3 text-xs md:col-span-2 border border-orange-100 text-center">
                  <Mini label="Taxable" value={fmt(calc.taxable)} />
                  <Mini label="Tax" value={fmt(calc.tax)} />
                  <Mini label="Line Total" value={fmt(calc.total)} isOrange />
                </div>

                {isOverStock && (
                  <div className="md:col-span-6 rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-xs font-bold text-red-800">
                    <AlertCircle size={16} className="shrink-0 text-red-600" />
                    <span>Insufficient stock! Only {a.value} {a.material?.unit} available in {a.balance?.godown.name}.</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        <button type="button" onClick={() => setItems(x => [...x, blank()])} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-300 font-extrabold text-xs text-orange-600 hover:bg-orange-50 cursor-pointer transition-colors">
          <Plus size={18} />
          + Add Another Material Item
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <SectionHeader title="Delivery Information and Notes" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Expected delivery
            <input type="date" value={details.expectedDeliveryDate} onChange={e => setDetails({ ...details, expectedDeliveryDate: e.target.value })} className={cls} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Place of supply code
            <input maxLength={2} inputMode="numeric" value={details.placeOfSupplyCode} onChange={e => setDetails({ ...details, placeOfSupplyCode: e.target.value })} className={cls} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Billing address
            <textarea value={details.billingAddress} onChange={e => setDetails({ ...details, billingAddress: e.target.value })} className={`${cls} min-h-24 p-3`} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Delivery address
            <textarea value={details.deliveryAddress} onChange={e => setDetails({ ...details, deliveryAddress: e.target.value })} className={`${cls} min-h-24 p-3`} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block md:col-span-2">
            Notes
            <textarea value={details.notes} onChange={e => setDetails({ ...details, notes: e.target.value })} className={`${cls} min-h-20 p-3`} />
          </label>
        </div>
      </section>

      <section className="ml-auto max-w-lg rounded-2xl bg-slate-950 p-5 text-white shadow-sm space-y-2">
        <Row label="Subtotal" value={fmt(summary.subtotal)} />
        <Row label="Discount" value={fmt(summary.discount)} />
        <Row label="Tax" value={fmt(summary.tax)} />
        <div className="mt-3 border-t border-slate-800 pt-3">
          <Row label="Order Total" value={fmt(summary.total)} large />
        </div>
        <p className="mt-3 text-[10px] text-slate-400 font-medium">
          {items.length} line{items.length === 1 ? "" : "s"}. Backend totals remain authoritative. Stock is reserved only after confirmation.
        </p>
      </section>

      {/* Mobile Safe Area Fixed Action Footer */}
      <MobileStickyFooter className="md:hidden">
        <button 
          disabled={saving} 
          onClick={() => save(false)} 
          className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
        >
          {saving && !confirming ? "Saving..." : "Save Draft"}
        </button>
        <button 
          disabled={saving} 
          onClick={() => {
            const m = validate();
            if (m) setError(m);
            else setReview(true);
          }} 
          className="flex-1 min-h-[44px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs font-bold text-white cursor-pointer press-active"
        >
          Confirm Order
        </button>
      </MobileStickyFooter>

      {/* Desktop Action Area (>=768px) */}
      <div className="hidden md:flex md:justify-end md:gap-3">
        <button 
          disabled={saving} 
          onClick={() => save(false)} 
          className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          {saving && !confirming ? "Saving..." : "Save Draft"}
        </button>
        <button 
          disabled={saving} 
          onClick={() => {
            const m = validate();
            if (m) setError(m);
            else setReview(true);
          }} 
          className="min-h-11 rounded-xl bg-orange-600 hover:bg-orange-700 px-6 text-sm font-bold text-white cursor-pointer"
        >
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
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-100">
              Confirming this order will reserve the required stock. Physical stock will not be deducted.
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setReview(false)} className="min-h-11 flex-1 rounded-xl border font-bold text-slate-700">Back</button>
              <button disabled={saving} onClick={() => save(true)} className="min-h-11 flex-[2] rounded-xl bg-orange-600 font-bold text-white">
                {saving ? "Confirming..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, isGreen = false, isOrange = false }: { label: string; value: string; isGreen?: boolean; isOrange?: boolean }) {
  return (
    <div>
      <span className="text-slate-400 text-[10px] uppercase font-black block">{label}</span>
      <b className={`text-xs sm:text-sm font-black mt-0.5 block ${isGreen ? "text-green-700" : isOrange ? "text-orange-600" : "text-slate-900"}`}>{value}</b>
    </div>
  );
}

function Row({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${large ? "text-lg font-bold" : "text-xs text-slate-300"}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export default SalesOrderFormPage;

