import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { purchaseApi } from "../../api/purchase.api";
import { supplierApi } from "../../api/supplier.api";
import { inventoryApi, type InventoryItemData } from "../../api/inventory.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import { MobileStickyFooter } from "../../app/components/mobile/MobileStickyFooter";
import { fmt } from "../../utils/currency";
import type { Supplier } from "../../types/supplier.types";

type Line = { inventoryItemId: string; godownId: string; quantity: string; rate: string; discountRate: string; gstRate: string };
const blank = (): Line => ({ inventoryItemId: "", godownId: "", quantity: "", rate: "", discountRate: "0", gstRate: "0" });
const cls = "mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none";

export function PurchaseForm() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<InventoryItemData[]>([]);
  const [supplierId, setSupplierId] = useState(searchParams.get("supplierId") || "");
  const [items, setItems] = useState<Line[]>([blank()]);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([supplierApi.getAll(), inventoryApi.getItems()])
      .then(([s, m]) => {
        setSuppliers((s.data || []).filter(x => x.isActive));
        setMaterials((m.data || []).filter(x => x.isActive));
      })
      .catch(e => setError(e.message));
  }, []);

  const calc = (x: Line) => {
    const gross = Number(x.quantity) * Number(x.rate);
    const discount = (gross * Number(x.discountRate)) / 100;
    const taxable = gross - discount;
    const tax = (taxable * Number(x.gstRate)) / 100;
    return { gross, discount, tax, total: taxable + tax };
  };

  const totals = useMemo(() => {
    return items.reduce(
      (a, x) => {
        const v = calc(x);
        return {
          gross: a.gross + v.gross,
          discount: a.discount + v.discount,
          tax: a.tax + v.tax,
          total: a.total + v.total
        };
      },
      { gross: 0, discount: 0, tax: 0, total: 0 }
    );
  }, [items]);

  const set = (i: number, k: keyof Line, v: string) => {
    setItems(a => a.map((x, n) => (n === i ? { ...x, [k]: v } : x)));
  };

  const save = async (send: boolean) => {
    setError("");
    if (!supplierId || items.some(x => !x.inventoryItemId || !x.godownId || Number(x.quantity) <= 0 || Number(x.rate) < 0)) {
      return setError("Choose a supplier and complete every Material line.");
    }
    setBusy(true);
    try {
      const r = await purchaseApi.create({
        supplierId,
        expectedDeliveryDate: date ? new Date(date).toISOString() : undefined,
        notes: notes || undefined,
        items: items.map(x => ({
          ...x,
          quantity: Number(x.quantity),
          rate: Number(x.rate),
          discountRate: Number(x.discountRate),
          gstRate: Number(x.gstRate)
        }))
      });
      if (send) await purchaseApi.send(r.data.id);
      toast.success(send ? "Purchase Order sent" : "Draft Purchase Order saved");
      nav(`/purchases/${r.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase Order could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-32">
      <PageHeader title="New Purchase Order" description="Order Materials from a supplier." />
      {error && <p className="rounded-xl bg-red-50 p-3 font-semibold text-xs text-red-800 border border-red-200">{error}</p>}

      {/* Zero Data Alerts */}
      {!suppliers.length && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">No suppliers found</p>
            <p>Please add your first supplier before creating a purchase order.</p>
            <Link to="/suppliers/new" className="inline-block font-bold text-orange-600 underline mt-1">
              + Add Supplier First
            </Link>
          </div>
        </div>
      )}

      {!materials.length && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">No materials found</p>
            <p>Please create your first material before adding line items.</p>
            <Link to="/materials/new" className="inline-block font-bold text-orange-600 underline mt-1">
              + Create First Material
            </Link>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <SectionHeader title="Supplier and Expected Delivery" description="Select vendor and set estimated delivery arrival date." />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Supplier Vendor *
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={cls}>
              <option value="">Choose supplier vendor…</option>
              {suppliers.map(x => (
                <option key={x.id} value={x.id}>
                  {x.name} ({x.phone}){x.gstin ? ` · GST: ${x.gstin}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Expected Delivery Date
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={cls} />
          </label>
        </div>

        {/* Selected Supplier Card Preview */}
        {(() => {
          const sel = suppliers.find(s => s.id === supplierId);
          if (!sel) return null;
          return (
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-black text-sm text-slate-900">{sel.name} {sel.companyName ? `(${sel.companyName})` : ""}</span>
                {sel.gstin && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase border border-blue-100">
                    GSTIN: {sel.gstin}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-600 pt-1">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Phone</span>
                  <strong className="text-slate-900 font-bold block">{sel.phone}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Current Payable Dues</span>
                  <strong className="font-black text-slate-900 block">{fmt(sel.openingPayable || 0)}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Payment Terms</span>
                  <strong className="text-slate-900 font-bold block">{sel.paymentTerms || "Standard"}</strong>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      <section className="space-y-4">
        <SectionHeader title="Purchase Line Items" description="Select materials and target destination Godown for stock arrival." />
        
        {/* Stock Impact Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 flex items-center gap-2.5 text-xs text-blue-900 font-medium">
          <AlertCircle size={17} className="shrink-0 text-blue-600" />
          <span><strong>Stock Impact Notice:</strong> Creating a Purchase Order reserves inventory space. Physical stock will be automatically added to the chosen Godown upon <strong>Goods Receipt (GRN)</strong>.</span>
        </div>

        {items.map((x, i) => {
          const m = materials.find(y => y.id === x.inventoryItemId);
          const g = m?.godownStocks || [];
          const v = calc(x);
          return (
            <article key={i} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-orange-600">Material Item #{i + 1}</span>
                {items.length > 1 && (
                  <button aria-label="Remove Material" onClick={() => setItems(a => a.filter((_, n) => n !== i))} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-6">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block md:col-span-2">
                  Material Item *
                  <select
                    value={x.inventoryItemId}
                    onChange={e => {
                      const z = materials.find(y => y.id === e.target.value);
                      setItems(a =>
                        a.map((q, n) =>
                          n === i
                            ? {
                                ...q,
                                inventoryItemId: e.target.value,
                                godownId: z?.godownStocks?.[0]?.godown.id || "",
                                rate: String(z?.costPrice || 0),
                                gstRate: String(z?.taxRate || 0)
                              }
                            : q
                        )
                      );
                    }}
                    className={cls}
                  >
                    <option value="">Choose Material item…</option>
                    {materials.map(y => (
                      <option key={y.id} value={y.id}>
                        {y.materialName} ({y.unit}) · SKU: {y.sku}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block md:col-span-2">
                  Destination Godown *
                  <select value={x.godownId} onChange={e => set(i, "godownId", e.target.value)} className={cls}>
                    <option value="">Choose Godown warehouse…</option>
                    {g.map(y => (
                      <option key={y.godown.id} value={y.godown.id}>
                        {y.godown.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Quantity *" value={x.quantity} set={v => set(i, "quantity", v)} />
                <Field label="Cost Rate (₹) *" value={x.rate} set={v => set(i, "rate", v)} />
                <Field label="Discount %" value={x.discountRate} set={v => set(i, "discountRate", v)} />
                <Field label="GST Tax %" value={x.gstRate} set={v => set(i, "gstRate", v)} />
                <div className="rounded-xl bg-orange-50/60 p-3 md:col-span-2 border border-orange-100 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase block">Calculated Line Total</span>
                  <b className="text-base font-black text-slate-900 mt-0.5 block">{fmt(v.total)}</b>
                </div>
              </div>
            </article>
          );
        })}
        <button
          type="button"
          onClick={() => setItems(a => [...a, blank()])}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-300 font-extrabold text-xs text-orange-600 hover:bg-orange-50 cursor-pointer transition-colors"
        >
          <Plus size={18} />
          + Add Another Material Item
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Notes & Delivery Terms
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${cls} min-h-24 p-3`} />
        </label>
      </section>

      <section className="ml-auto max-w-md rounded-2xl bg-slate-950 p-5 text-white shadow-sm space-y-2">
        <Row l="Subtotal" v={fmt(totals.gross)} />
        <Row l="Discount" v={fmt(totals.discount)} />
        <Row l="GST" v={fmt(totals.tax)} />
        <div className="mt-3 border-t border-slate-800 pt-3">
          <Row l="Purchase Total" v={fmt(totals.total)} big />
        </div>
      </section>

      {/* Mobile Safe Area Fixed Action Footer */}
      <MobileStickyFooter className="md:hidden">
        <button
          disabled={busy}
          onClick={() => save(false)}
          className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
        >
          Save Draft
        </button>
        <button
          disabled={busy}
          onClick={() => save(true)}
          className="flex-1 min-h-[44px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs font-bold text-white cursor-pointer press-active"
        >
          Send PO
        </button>
      </MobileStickyFooter>

      {/* Desktop Action Buttons (>=768px) */}
      <div className="hidden md:flex md:justify-end md:gap-3">
        <button
          disabled={busy}
          onClick={() => save(false)}
          className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Save Draft
        </button>
        <button
          disabled={busy}
          onClick={() => save(true)}
          className="min-h-11 rounded-xl bg-orange-600 hover:bg-orange-700 px-6 text-sm font-bold text-white cursor-pointer"
        >
          Send Purchase Order
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return (
    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
      {label}
      <input type="number" inputMode="decimal" min="0" step="0.001" placeholder="0.00" value={value} onChange={e => set(e.target.value)} className={cls} />
    </label>
  );
}

function Row({ l, v, big = false }: { l: string; v: string; big?: boolean }) {
  return (
    <div className={`flex justify-between ${big ? "text-lg font-bold" : "text-xs text-slate-300"}`}>
      <span>{l}</span>
      <b>{v}</b>
    </div>
  );
}
