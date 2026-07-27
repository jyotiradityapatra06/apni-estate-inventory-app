import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { customerApi } from "../../api/customer.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import type { CustomerInput } from "../../types/customer.types";

const empty: CustomerInput = {
  name: "",
  phone: "",
  email: "",
  gstin: "",
  state: "",
  stateCode: "",
  billingAddress: "",
  shippingAddress: "",
  creditLimit: 0,
  creditDays: 0,
  allowCredit: true,
  openingBalance: 0,
  notes: "",
  isActive: true,
};

const cls =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none";
const phonePattern = /^(?:\+91[ -]?)?[6-9]\d{9}$/;
const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const stateCodePattern = /^[0-9]{2}$/;

export function CustomerFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const first = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CustomerInput>(empty);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit") {
      customerApi
        .getById(id)
        .then((r) => {
          const c = r.data;
          setForm({
            name: c.name,
            phone: c.phone,
            email: c.email || "",
            gstin: c.gstin || "",
            state: c.state || "",
            stateCode: c.stateCode || "",
            billingAddress: c.billingAddress || "",
            shippingAddress: c.shippingAddress || "",
            creditLimit: c.creditLimit || 0,
            creditDays: c.creditDays || 0,
            allowCredit: c.allowCredit !== false,
            openingBalance: c.openingBalance || 0,
            notes: c.notes || "",
            isActive: c.isActive,
          });
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id, mode]);

  const set = <K extends keyof CustomerInput>(k: K, v: CustomerInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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

    if (form.stateCode && !stateCodePattern.test(form.stateCode)) {
      setError("State Code must be exactly 2 numeric digits (e.g., 27).");
      return;
    }

    if (saving) return;
    setSaving(true);
    try {
      const r = mode === "create" ? await customerApi.create(form) : await customerApi.update(id, form);
      toast.success(mode === "create" ? "Customer added successfully" : "Customer updated successfully");
      window.dispatchEvent(new Event("customers:refresh"));
      window.dispatchEvent(new Event("notifications:refresh"));
      nav(`/customers/${r.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Customer could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />;

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6 pb-28">
      <PageHeader
        title={mode === "create" ? "Add New Customer" : "Edit Customer Details"}
        description={mode === "create" ? "Add contact, GSTIN, location, and credit threshold details." : "Update customer contact, location, address, and credit settings."}
      />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <SectionHeader title="Basic Information" description="Name, primary phone, email, GSTIN, and location details." />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            Customer Name *
            <input
              ref={first}
              required
              placeholder="e.g. Rajesh Kumar or Shivam Builders"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
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
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            Email Address
            <input
              type="email"
              placeholder="e.g. contact@business.com"
              value={form.email || ""}
              onChange={(e) => set("email", e.target.value)}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            GSTIN / Tax ID
            <input
              maxLength={15}
              placeholder="15-digit GSTIN (Optional)"
              value={form.gstin || ""}
              onChange={(e) => set("gstin", e.target.value.toUpperCase())}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            State Name
            <input
              placeholder="e.g. Maharashtra"
              value={form.state || ""}
              onChange={(e) => set("state", e.target.value)}
              className={cls}
            />
          </label>
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            GST State Code
            <input
              maxLength={2}
              inputMode="numeric"
              placeholder="2-digit numeric code (e.g. 27)"
              value={form.stateCode || ""}
              onChange={(e) => set("stateCode", e.target.value)}
              className={cls}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <SectionHeader title="Address Details" description="Billing and site delivery locations." />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            Billing Address
            <textarea
              rows={3}
              placeholder="Shop/Office address"
              value={form.billingAddress || ""}
              onChange={(e) => set("billingAddress", e.target.value)}
              className={`${cls} min-h-24 p-3`}
            />
          </label>
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            Site / Delivery Address
            <textarea
              rows={3}
              placeholder="Construction site address"
              value={form.shippingAddress || ""}
              onChange={(e) => set("shippingAddress", e.target.value)}
              className={`${cls} min-h-24 p-3`}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <SectionHeader title="Credit Settings & Balances" description="Configure credit limits, payment terms, and initial outstanding balance." />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            Credit Limit (₹)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0 (Unlimited credit)"
              value={form.creditLimit}
              onChange={(e) => set("creditLimit", Number(e.target.value))}
              className={cls}
            />
            <span className="text-[10px] text-muted-foreground font-bold normal-case mt-1 block">Set 0 for unlimited credit sales.</span>
          </label>

          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            Credit Period (Days)
            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="e.g. 30"
              value={form.creditDays || 0}
              onChange={(e) => set("creditDays", Number(e.target.value))}
              className={cls}
            />
            <span className="text-[10px] text-muted-foreground font-bold normal-case mt-1 block">Payment due terms in days.</span>
          </label>

          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block md:col-span-2">
            Opening Outstanding Balance (₹)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.openingBalance}
              onChange={(e) => set("openingBalance", Number(e.target.value))}
              className={cls}
            />
          </label>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-4 md:col-span-2">
            <div>
              <span className="text-xs font-black text-foreground block">Allow Credit Sales</span>
              <span className="text-[11px] text-muted-foreground font-semibold block">Enable or disable credit sales transactions for this customer.</span>
            </div>
            <input
              type="checkbox"
              checked={form.allowCredit !== false}
              onChange={(e) => set("allowCredit", e.target.checked)}
              className="h-5 w-5 rounded border-border text-orange-500 focus:ring-orange-500 cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Footer Actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t bg-card p-4 pb-[max(16px,env(safe-area-inset-bottom))] md:static md:justify-end md:border-0 md:bg-transparent md:p-0">
        <button
          type="button"
          onClick={() => nav(-1)}
          className="min-h-[48px] flex-1 rounded-xl border border-border text-xs sm:text-sm font-extrabold text-muted-foreground hover:bg-muted md:flex-none md:px-6 cursor-pointer"
        >
          Cancel
        </button>
        <button
          disabled={saving}
          type="submit"
          className="min-h-[48px] flex-[2] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs sm:text-sm font-extrabold text-white cursor-pointer shadow-xs disabled:opacity-60 md:flex-none md:px-8"
        >
          {saving ? "Saving Customer…" : mode === "create" ? "Add Customer" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
