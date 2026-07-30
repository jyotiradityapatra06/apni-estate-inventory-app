import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { customerApi } from "../../api/customer.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import type { CustomerInput } from "../../types/customer.types";

type CustomerField = "name" | "phone" | "email" | "gstin" | "stateCode";
type FieldErrors = Partial<Record<CustomerField, string>>;

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
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const optionalText = (value: string | null | undefined) => value?.trim() || null;
const safeNumber = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export function CustomerFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const fieldRefs = useRef<Partial<Record<CustomerField, HTMLInputElement | null>>>({});
  const requestActive = useRef(false);
  const [form, setForm] = useState<CustomerInput>(empty);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

  const set = <K extends keyof CustomerInput>(k: K, v: CustomerInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k in fieldErrors) setFieldErrors((current) => ({ ...current, [k]: undefined }));
  };

  const focusFirstInvalid = (errors: FieldErrors) => {
    const firstInvalid = (["name", "phone", "email", "gstin", "stateCode"] as CustomerField[])
      .find((field) => errors[field]);
    if (!firstInvalid) return;
    requestAnimationFrame(() => {
      const input = fieldRefs.current[firstInvalid];
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus({ preventScroll: true });
    });
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (form.name.trim().length < 2) errors.name = "Enter a customer name with at least 2 characters.";
    if (!phonePattern.test(form.phone.replace(/\s/g, ""))) errors.phone = "Enter a valid 10-digit Indian mobile number.";
    if (form.email?.trim() && !emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address.";
    if (form.gstin?.trim() && !gstPattern.test(form.gstin.trim().toUpperCase())) {
      errors.gstin = "Enter a valid 15-character GSTIN (e.g., 27AAAAA0000A1Z5).";
    }
    if (form.stateCode?.trim() && !stateCodePattern.test(form.stateCode.trim())) {
      errors.stateCode = "State Code must be exactly 2 numeric digits (e.g., 27).";
    }
    return errors;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(errors);
      return;
    }
    if (requestActive.current) return;
    requestActive.current = true;
    setSaving(true);
    try {
      const payload: CustomerInput = {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: optionalText(form.email),
        gstin: optionalText(form.gstin)?.toUpperCase() || null,
        state: optionalText(form.state),
        stateCode: optionalText(form.stateCode),
        billingAddress: optionalText(form.billingAddress),
        shippingAddress: optionalText(form.shippingAddress),
        notes: optionalText(form.notes),
        creditLimit: safeNumber(form.creditLimit),
        creditDays: safeNumber(form.creditDays),
        openingBalance: safeNumber(form.openingBalance),
      };
      const r = mode === "create" ? await customerApi.create(payload) : await customerApi.update(id, payload);
      toast.success(mode === "create" ? "Customer added successfully" : "Customer updated successfully");
      window.dispatchEvent(new Event("customers:refresh"));
      window.dispatchEvent(new Event("notifications:refresh"));
      nav(`/customers/${r.data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Customer could not be saved.";
      setError(message);
      toast.error(message);
    } finally {
      requestActive.current = false;
      setSaving(false);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />;

  return (
    <form id="customer-create-form" noValidate onSubmit={submit} className="mx-auto max-w-4xl space-y-6 pb-44 md:pb-28">
      <PageHeader
        title={mode === "create" ? "Add New Customer" : "Edit Customer Details"}
        description={mode === "create" ? "Add contact, GSTIN, location, and credit threshold details." : "Update customer contact, location, address, and credit settings."}
      />

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <SectionHeader title="Basic Information" description="Name, primary phone, email, GSTIN, and location details." />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            Customer Name *
            <input
              ref={(element) => { fieldRefs.current.name = element; }}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "customer-name-error" : undefined}
              placeholder="e.g. Rajesh Kumar or Shivam Builders"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={`${cls} ${fieldErrors.name ? "border-red-500" : ""}`}
            />
            {fieldErrors.name && <span id="customer-name-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{fieldErrors.name}</span>}
          </label>
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            Phone Number *
            <input
              ref={(element) => { fieldRefs.current.phone = element; }}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "customer-phone-error" : undefined}
              inputMode="tel"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={`${cls} ${fieldErrors.phone ? "border-red-500" : ""}`}
            />
            {fieldErrors.phone && <span id="customer-phone-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{fieldErrors.phone}</span>}
          </label>
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            Email Address
            <input
              ref={(element) => { fieldRefs.current.email = element; }}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "customer-email-error" : undefined}
              type="email"
              placeholder="e.g. contact@business.com"
              value={form.email || ""}
              onChange={(e) => set("email", e.target.value)}
              className={`${cls} ${fieldErrors.email ? "border-red-500" : ""}`}
            />
            {fieldErrors.email && <span id="customer-email-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{fieldErrors.email}</span>}
          </label>
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            GSTIN / Tax ID
            <input
              ref={(element) => { fieldRefs.current.gstin = element; }}
              aria-invalid={Boolean(fieldErrors.gstin)}
              aria-describedby={fieldErrors.gstin ? "customer-gstin-error" : undefined}
              maxLength={15}
              placeholder="15-digit GSTIN (Optional)"
              value={form.gstin || ""}
              onChange={(e) => set("gstin", e.target.value.toUpperCase())}
              className={`${cls} ${fieldErrors.gstin ? "border-red-500" : ""}`}
            />
            {fieldErrors.gstin && <span id="customer-gstin-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{fieldErrors.gstin}</span>}
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
              ref={(element) => { fieldRefs.current.stateCode = element; }}
              aria-invalid={Boolean(fieldErrors.stateCode)}
              aria-describedby={fieldErrors.stateCode ? "customer-state-code-error" : undefined}
              maxLength={2}
              inputMode="numeric"
              placeholder="2-digit numeric code (e.g. 27)"
              value={form.stateCode || ""}
              onChange={(e) => set("stateCode", e.target.value)}
              className={`${cls} ${fieldErrors.stateCode ? "border-red-500" : ""}`}
            />
            {fieldErrors.stateCode && <span id="customer-state-code-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{fieldErrors.stateCode}</span>}
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
      <div className="fixed inset-x-0 bottom-[74px] z-30 flex gap-3 border-t bg-card p-3 md:static md:justify-end md:border-0 md:bg-transparent md:p-0">
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
          form="customer-create-form"
          aria-busy={saving}
          className="min-h-[48px] flex-[2] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs sm:text-sm font-extrabold text-white cursor-pointer shadow-xs disabled:opacity-60 md:flex-none md:px-8"
        >
          {saving ? "Saving Customer…" : mode === "create" ? "Add Customer" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
