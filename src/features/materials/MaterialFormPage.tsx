import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { godownApi } from "../../api/godown.api";
import { inventoryApi, type InventoryItemData } from "../../api/inventory.api";
import { supplierApi } from "../../api/supplier.api";
import { ErrorState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import { MobileStickyFooter } from "../../app/components/mobile/MobileStickyFooter";
import type { Godown } from "../../types/godown.types";
import type { Supplier } from "../../types/supplier.types";

const empty = {
  materialName: "",
  category: "",
  brand: "",
  sku: "",
  unit: "",
  minimumStockLevel: "",
  costPrice: "",
  sellingPrice: "",
  hsnCode: "",
  taxRate: "",
  defaultSupplierId: "",
  godownId: "",
  openingStock: "0"
};

export function MaterialFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const firstRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(empty);
  const [material, setMaterial] = useState<InventoryItemData | null>(null);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      godownApi.getAll(),
      supplierApi.getAll(),
      ...(mode === "edit" ? [inventoryApi.getItem(id)] : [])
    ])
      .then((responses: any[]) => {
        if (!active) return;
        setGodowns((responses[0].data ?? []).filter((item: Godown) => item.isActive));
        setSuppliers((responses[1].data ?? []).filter((item: Supplier) => item.isActive));

        if (mode === "edit") {
          const item = responses[2].data as InventoryItemData;
          setMaterial(item);
          setForm({
            materialName: item.materialName,
            category: item.category,
            brand: item.brand ?? "",
            sku: item.sku,
            unit: item.unit,
            minimumStockLevel: String(item.minimumStockLevel ?? item.reorderLevel ?? 0),
            costPrice: item.costPrice == null ? "" : String(item.costPrice),
            sellingPrice: item.sellingPrice == null ? "" : String(item.sellingPrice),
            hsnCode: item.hsnCode ?? "",
            taxRate: item.taxRate == null ? "" : String(item.taxRate),
            defaultSupplierId: item.defaultSupplierId ?? "",
            godownId: "",
            openingStock: "0"
          });
          setMore(Boolean(item.hsnCode || item.taxRate != null));
        } else if (responses[0].data?.length === 1) {
          setForm(value => ({ ...value, godownId: responses[0].data[0].id }));
        }
      })
      .catch(error => setError(error instanceof Error ? error.message : "Could not load the form."))
      .finally(() => setLoading(false));

    return () => {
      active = false;
    };
  }, [id, mode]);

  const change = (key: keyof typeof empty, value: string) =>
    setForm(current => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.materialName.trim() || !form.category.trim() || !form.sku.trim() || !form.unit.trim()) {
      setError("Material name, category, SKU and unit are required.");
      firstRef.current?.focus();
      firstRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSaving(true);
    const body: any = {
      materialName: form.materialName.trim(),
      category: form.category.trim(),
      brand: form.brand.trim() || null,
      sku: form.sku.trim(),
      unit: form.unit.trim(),
      minimumStockLevel: Number(form.minimumStockLevel || 0),
      reorderLevel: Number(form.minimumStockLevel || 0),
      location: material?.location || godowns.find(item => item.id === form.godownId)?.name || "Main Godown",
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : null,
      hsnCode: form.hsnCode.trim() || null,
      taxRate: form.taxRate ? Number(form.taxRate) : null,
      defaultSupplierId: form.defaultSupplierId || null,
      supplierIds: form.defaultSupplierId ? [form.defaultSupplierId] : []
    };

    if (mode === "create") {
      body.quantity = Number(form.openingStock || 0);
      body.openingStock = Number(form.openingStock || 0);
      if (form.godownId) body.godownId = form.godownId;
    }

    try {
      const response = mode === "create" ? await inventoryApi.createItem(body) : await inventoryApi.updateItem(id, body);
      toast.success(mode === "create" ? "Material added" : "Material updated");
      navigate(`/materials/${response.data.id}`, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Material could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;
  if (error && mode === "edit" && !material) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const inputClass = "mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none";

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6 pb-32">
      <PageHeader
        title={mode === "create" ? "Add Material" : "Edit Material"}
        description={mode === "create" ? "Add a material and its opening stock." : "Update material details. Use Stock In or Stock Out to change quantity."}
      />

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6 space-y-4">
        <SectionHeader title="Basic Details" />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Material Name
            <input ref={firstRef} required value={form.materialName} onChange={e => change("materialName", e.target.value)} className={inputClass} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Category
            <input required value={form.category} onChange={e => change("category", e.target.value)} placeholder="Cement, Steel, Sand…" className={inputClass} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Unit
            <input required value={form.unit} onChange={e => change("unit", e.target.value)} placeholder="Bags, Tonnes, Pieces…" className={inputClass} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            SKU / Item Code
            <input required value={form.sku} onChange={e => change("sku", e.target.value)} className={inputClass} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Brand
            <input value={form.brand} onChange={e => change("brand", e.target.value)} className={inputClass} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Minimum Stock Level
            <input type="number" inputMode="decimal" min="0" step="0.001" value={form.minimumStockLevel} onChange={e => change("minimumStockLevel", e.target.value)} className={inputClass} />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6 space-y-4">
        <SectionHeader title="Pricing and Supplier" />
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Purchase Price (₹)
            <input type="number" inputMode="decimal" min="0.01" step="0.01" value={form.costPrice} onChange={e => change("costPrice", e.target.value)} className={inputClass} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Selling Price (₹)
            <input type="number" inputMode="decimal" min="0.01" step="0.01" value={form.sellingPrice} onChange={e => change("sellingPrice", e.target.value)} className={inputClass} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Preferred Supplier
            <select value={form.defaultSupplierId} onChange={e => change("defaultSupplierId", e.target.value)} className={inputClass}>
              <option value="">No preferred supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {mode === "create" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6 space-y-4">
          <SectionHeader title="Opening Stock" description="This creates the first stock-history entry." />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Godown
              <select required value={form.godownId} onChange={e => change("godownId", e.target.value)} className={inputClass}>
                <option value="">Choose godown</option>
                {godowns.map(godown => (
                  <option key={godown.id} value={godown.id}>
                    {godown.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Opening Quantity
              <input type="number" inputMode="decimal" min="0" step="0.001" value={form.openingStock} onChange={e => change("openingStock", e.target.value)} className={inputClass} />
            </label>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <button type="button" onClick={() => setMore(!more)} className="flex min-h-12 w-full items-center justify-between px-4 text-xs font-extrabold uppercase tracking-wider text-slate-700 hover:bg-slate-50 cursor-pointer">
          More Details (GST & HSN)
          <ChevronDown size={18} className={more ? "rotate-180 transition-transform" : "transition-transform"} />
        </button>
        {more && (
          <div className="grid gap-4 border-t border-slate-100 p-4 md:grid-cols-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              HSN Code
              <input value={form.hsnCode} onChange={e => change("hsnCode", e.target.value)} className={inputClass} />
            </label>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              GST Rate %
              <input type="number" inputMode="decimal" min="0" max="100" step="0.01" value={form.taxRate} onChange={e => change("taxRate", e.target.value)} className={inputClass} />
            </label>
          </div>
        )}
      </section>

      {/* Mobile Safe Area Fixed Action Footer */}
      <MobileStickyFooter className="lg:hidden">
        <button 
          type="button" 
          onClick={() => navigate(-1)} 
          className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
        >
          Cancel
        </button>
        <button 
          disabled={saving} 
          type="submit" 
          className="flex-[2] min-h-[44px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs font-bold text-white cursor-pointer press-active disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "create" ? "Add Material" : "Save Changes"}
        </button>
      </MobileStickyFooter>

      {/* Desktop Action Buttons (>=1024px) */}
      <div className="hidden lg:flex lg:justify-end lg:gap-3">
        <button 
          type="button" 
          onClick={() => navigate(-1)} 
          className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button 
          disabled={saving} 
          type="submit" 
          className="min-h-11 rounded-xl bg-orange-600 hover:bg-orange-700 px-6 text-sm font-bold text-white cursor-pointer disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "create" ? "Add Material" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
