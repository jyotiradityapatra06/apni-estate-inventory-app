import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { supplierApi } from "../../api/supplier.api";
import { inventoryApi, type InventoryItemData } from "../../api/inventory.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import type { SupplierInput } from "../../types/supplier.types";

const empty: SupplierInput = {
  name: "",
  companyName: "",
  contactPerson: "",
  phone: "",
  alternatePhone: "",
  email: null,
  gstin: "",
  panNumber: "",
  address: "",
  openingPayable: 0,
  creditLimit: 0,
  paymentTerms: "",
  notes: "",
  isActive: true,
  materialIds: [],
};

const cls =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none";
const phonePattern = /^(?:\+91[ -]?)?[6-9]\d{9}$/;
const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function SupplierFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const first = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<SupplierInput>(empty);
  const [materials, setMaterials] = useState<InventoryItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([inventoryApi.getItems(), mode === "edit" ? supplierApi.getById(id) : Promise.resolve(null)])
      .then(([m, s]) => {
        setMaterials(m.data || []);
        if (s) {
          const x = s.data;
          setForm({
            name: x.name,
            companyName: x.companyName || "",
            contactPerson: x.contactPerson || "",
            phone: x.phone,
            alternatePhone: x.alternatePhone || "",
            email: x.email || null,
            gstin: x.gstin || "",
            panNumber: x.panNumber || "",
            address: x.address || "",
            openingPayable: x.openingPayable,
            creditLimit: Number(x.creditLimit || 0),
            paymentTerms: x.paymentTerms || "",
            notes: x.notes || "",
            isActive: x.isActive,
            materialIds: x.suppliedMaterials.map((y) => y.inventoryItem.id),
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, mode]);

  const set = <K extends keyof SupplierInput>(k: K, v: SupplierInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const toggle = (matId: string) =>
    set(
      "materialIds",
      form.materialIds?.includes(matId)
        ? form.materialIds.filter((x) => x !== matId)
        : [...(form.materialIds || []), matId]
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phonePattern.test(form.phone.replace(/\s/g, ""))) {
      setError("Please enter a valid 10-digit Indian phone number.");
      first.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (form.gstin && !gstPattern.test(form.gstin)) {
      setError("Please enter a valid 15-character GSTIN (e.g., 27AAAAA0000A1Z5).");
      return;
    }

    if (form.panNumber && !panPattern.test(form.panNumber)) {
      setError("Please enter a valid 10-character PAN number (e.g., ABCDE1234F).");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, email: form.email || null };
      const r = mode === "create" ? await supplierApi.create(payload) : await supplierApi.update(id, payload);
      toast.success(mode === "create" ? "Supplier added successfully" : "Supplier updated successfully");
      nav(`/suppliers/${r.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Supplier could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />;

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6 pb-28">
      <PageHeader
        title={mode === "create" ? "Add New Supplier" : "Edit Supplier Profile"}
        description={mode === "create" ? "Add vendor contact, GSTIN, and credit terms." : "Update supplier contact and material catalog."}
      />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <SectionHeader title="Basic Information" description="Supplier name, business name, and primary contact." />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Supplier Name *
            <input
              ref={first}
              required
              placeholder="e.g. Ultratech Cement Dist. or Sharma Hardware"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Company Name
            <input
              placeholder="Registered firm/company name"
              value={form.companyName || ""}
              onChange={(e) => set("companyName", e.target.value)}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Contact Person
            <input
              placeholder="Manager or sales representative name"
              value={form.contactPerson || ""}
              onChange={(e) => set("contactPerson", e.target.value)}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Phone Number *
            <input
              required
              inputMode="tel"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Alternate Phone
            <input
              inputMode="tel"
              placeholder="Secondary contact number"
              value={form.alternatePhone || ""}
              onChange={(e) => set("alternatePhone", e.target.value)}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Email Address
            <input
              type="email"
              placeholder="e.g. sales@vendor.com"
              value={form.email || ""}
              onChange={(e) => set("email", e.target.value)}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            GSTIN Number
            <input
              maxLength={15}
              placeholder="15-digit GSTIN (Optional)"
              value={form.gstin || ""}
              onChange={(e) => set("gstin", e.target.value.toUpperCase())}
              className={cls}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <SectionHeader title="Address, PAN & Credit Terms" description="Tax registration and vendor credit limits." />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            PAN Number
            <input
              maxLength={10}
              placeholder="10-character PAN"
              value={form.panNumber || ""}
              onChange={(e) => set("panNumber", e.target.value.toUpperCase())}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Registered Address
            <textarea
              rows={3}
              placeholder="Vendor depot or office address"
              value={form.address || ""}
              onChange={(e) => set("address", e.target.value)}
              className={`${cls} min-h-24 p-3`}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Opening Payable Balance (₹)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.openingPayable}
              onChange={(e) => set("openingPayable", Number(e.target.value))}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Credit Limit (₹)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.creditLimit || 0}
              onChange={(e) => set("creditLimit", Number(e.target.value))}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Payment Terms
            <input
              placeholder="e.g. Net 30 days or 7 days advance"
              value={form.paymentTerms || ""}
              onChange={(e) => set("paymentTerms", e.target.value)}
              className={cls}
            />
          </label>
          <div className="flex items-center pt-6">
            <label className="flex min-h-[46px] w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-extrabold text-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive !== false}
                onChange={(e) => set("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              Supplier Account Active
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <SectionHeader title="Materials Supplied" description="Check materials supplied by this vendor." />
        <div className="grid max-h-64 gap-2.5 overflow-y-auto pr-1 md:grid-cols-2 pt-1">
          {materials.map((m) => (
            <label
              key={m.id}
              className={`flex min-h-[46px] items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                form.materialIds?.includes(m.id)
                  ? "border-orange-300 bg-orange-50/50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={form.materialIds?.includes(m.id)}
                onChange={() => toggle(m.id)}
                className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <div>
                <b className="text-xs font-black text-slate-900 block">{m.materialName}</b>
                <span className="text-[10px] font-semibold text-slate-400 block">SKU: {m.sku} ({m.unit})</span>
              </div>
            </label>
          ))}
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
          disabled={saving}
          type="submit"
          className="min-h-[48px] flex-[2] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs sm:text-sm font-extrabold text-white cursor-pointer shadow-xs disabled:opacity-60 md:flex-none md:px-8"
        >
          {saving ? "Saving Supplier…" : mode === "create" ? "Add Supplier" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
