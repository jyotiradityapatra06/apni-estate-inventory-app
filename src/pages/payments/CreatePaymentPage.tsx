import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { customerApi } from "../../api/customer.api";
import invoiceApi from "../../api/invoice.api";
import paymentApi from "../../api/payment.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import { fmt } from "../../utils/currency";

type PaymentField = "customerId" | "invoiceId" | "amount" | "paymentDate" | "referenceNumber" | "bankName";
type PaymentErrors = Partial<Record<PaymentField, string>>;

export default function CreatePaymentPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<PaymentErrors>({});
  const fieldRefs = useRef<Partial<Record<PaymentField, HTMLSelectElement | HTMLInputElement | null>>>({});
  const requestActive = useRef(false);
  const [form, setForm] = useState<any>({
    customerId: params.get("customerId") || "",
    invoiceId: params.get("invoiceId") || "",
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "CASH",
    referenceNumber: "",
    bankName: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([customerApi.getAll(), invoiceApi.getAll()])
      .then(([c, i]) => {
        const custs = c.data || [];
        const invs = (i.data || []).filter((x: any) => ["ISSUED", "PARTIALLY_PAID"].includes(x.status));
        setCustomers(custs);
        setInvoices(invs);

        const targetInvoiceId = params.get("invoiceId") || form.invoiceId;
        const targetCustId = params.get("customerId") || form.customerId;
        const selectedInv = invs.find((x: any) => x.id === targetInvoiceId);

        if (selectedInv) {
          setForm((f: any) => ({
            ...f,
            customerId: selectedInv.customerId || targetCustId,
            invoiceId: selectedInv.id,
            amount: String(selectedInv.balanceDue),
          }));
        } else if (targetCustId) {
          setForm((f: any) => ({ ...f, customerId: targetCustId }));
        }
      })
      .catch((e: any) => {
        const message = e?.message || "Customer and invoice options could not be loaded.";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoadingOptions(false));
  }, [params]);

  const available = invoices.filter((x) => !form.customerId || x.customerId === form.customerId);
  const visibleCustomers = customers.filter((customer) => {
    const query = customerSearch.trim().toLowerCase();
    return !query || [customer.name, customer.phone, customer.gstin].some((value) => value?.toLowerCase().includes(query));
  });
  const selected = invoices.find((x) => x.id === form.invoiceId);
  const selectedCustomer = customers.find((x) => x.id === form.customerId);

  const [saving, setSaving] = useState(false);

  const updateForm = (updates: Record<string, string>) => {
    setForm((current: any) => ({ ...current, ...updates }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(updates).forEach((field) => delete next[field as PaymentField]);
      return next;
    });
    setError("");
  };

  const focusFirstInvalid = (validationErrors: PaymentErrors) => {
    const field = (["customerId", "invoiceId", "amount", "paymentDate", "referenceNumber", "bankName"] as PaymentField[])
      .find((key) => validationErrors[key]);
    if (!field) return;
    requestAnimationFrame(() => {
      const input = fieldRefs.current[field];
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus({ preventScroll: true });
    });
  };

  const validate = (): PaymentErrors => {
    const next: PaymentErrors = {};
    const amount = Number(form.amount);
    const invoice = invoices.find((item) => item.id === form.invoiceId);
    if (!form.customerId) next.customerId = "Select the customer account making this payment.";
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) next.amount = "Enter a received amount greater than zero.";
    if (!form.paymentDate || Number.isNaN(new Date(`${form.paymentDate}T00:00:00`).getTime())) next.paymentDate = "Enter a valid payment date.";
    if (form.invoiceId && (!invoice || invoice.customerId !== form.customerId)) next.invoiceId = "The selected invoice does not belong to this customer.";
    if (invoice && amount > Number(invoice.balanceDue)) next.amount = "Payment amount cannot exceed the invoice outstanding balance.";
    if (form.paymentMethod !== "CASH" && !form.referenceNumber.trim()) next.referenceNumber = "Reference / UTR number is required for non-cash payments.";
    if (["BANK_TRANSFER", "CHEQUE"].includes(form.paymentMethod) && !form.bankName.trim()) next.bankName = "Bank name is required for bank transfer and cheque payments.";
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      setError("Please correct the highlighted payment details.");
      focusFirstInvalid(validationErrors);
      return;
    }
    if (requestActive.current) return;
    requestActive.current = true;
    setSaving(true);
    try {
      const body = {
        customerId: form.customerId,
        invoiceId: form.invoiceId || null,
        amount: Number(form.amount),
        paymentDate: new Date(`${form.paymentDate}T00:00:00`).toISOString(),
        paymentMethod: form.paymentMethod,
        referenceNumber: form.referenceNumber.trim() || null,
        bankName: form.bankName.trim() || null,
        notes: form.notes.trim() || null,
        idempotencyKey: crypto.randomUUID(),
      };
      const r = await paymentApi.create(body);
      toast.success("Payment recorded successfully");
      window.dispatchEvent(new Event("notifications:refresh"));
      nav(`/payments/${r.data.id}/receipt`);
    } catch (e: any) {
      const message = e?.message || "Payment could not be recorded. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      requestActive.current = false;
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 min-h-[46px] w-full rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none";

  return (
    <form id="record-payment-form" noValidate onSubmit={submit} className="mx-auto max-w-2xl space-y-6 pb-44 md:pb-28">
      <PageHeader
        title="Record Payment Receipt"
        description="Record an invoice payment or customer advance."
      />

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm md:grid-cols-2">
        <SectionHeader title="Payment & Invoice Details" description="Select a customer, then optionally apply the receipt to an unpaid invoice." />

        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground md:col-span-2">
          Search Customer
          <input
            type="search"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="Customer name, phone, or GSTIN"
            className={inputClass}
          />
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
          Customer Account *
          <select
            ref={(element) => { fieldRefs.current.customerId = element; }}
            aria-invalid={Boolean(errors.customerId)}
            aria-describedby={errors.customerId ? "payment-customer-error" : undefined}
            disabled={loadingOptions}
            value={form.customerId}
            onChange={(e) => updateForm({ customerId: e.target.value, invoiceId: "", amount: "" })}
            className={`${inputClass} ${errors.customerId ? "border-red-500" : ""}`}
          >
            <option value="">Choose customer…</option>
            {visibleCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
          {errors.customerId && <span id="payment-customer-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{errors.customerId}</span>}
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
          Target Invoice
          <select
            ref={(element) => { fieldRefs.current.invoiceId = element; }}
            aria-invalid={Boolean(errors.invoiceId)}
            aria-describedby={errors.invoiceId ? "payment-invoice-error" : "payment-invoice-help"}
            disabled={!form.customerId || loadingOptions}
            value={form.invoiceId}
            onChange={(e) => {
              const x = invoices.find((i) => i.id === e.target.value);
              updateForm({
                invoiceId: e.target.value,
                amount: x ? String(x.balanceDue) : "",
              });
            }}
            className={`${inputClass} ${errors.invoiceId ? "border-red-500" : ""}`}
          >
            <option value="">Advance / Unallocated Payment</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.invoiceNumber} · Total {fmt(i.totalAmount)} · Paid {fmt(Number(i.totalAmount || 0) - Number(i.balanceDue || 0))} · Outstanding {fmt(i.balanceDue)}
              </option>
            ))}
          </select>
          {errors.invoiceId ? (
            <span id="payment-invoice-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{errors.invoiceId}</span>
          ) : (
            <span id="payment-invoice-help" className="mt-1 block text-[11px] font-semibold normal-case text-muted-foreground">
              Leave as Advance / Unallocated Payment to credit the customer account without changing an invoice.
            </span>
          )}
          {form.customerId && !loadingOptions && available.length === 0 && (
            <span className="mt-2 block rounded-lg bg-amber-50 p-2 text-[11px] font-bold normal-case text-amber-800">
              No unpaid invoices available for this customer. You can record an advance payment.
            </span>
          )}
        </label>

        {selected && (
          <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-4 md:col-span-2 space-y-2">
            <div className="flex justify-between items-center border-b border-amber-200/60 pb-2">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 block">Target Invoice</span>
                <strong className="text-base font-black text-amber-950">{selected.invoiceNumber}</strong>
              </div>
              {selectedCustomer && (
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-amber-800 block">Customer</span>
                  <strong className="text-xs font-bold text-amber-900">{selectedCustomer.name} ({selectedCustomer.phone})</strong>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span className="text-[10px] font-bold text-amber-800 block uppercase">Invoice Total</span>
                <strong className="text-amber-950 font-black">{fmt(selected.totalAmount)}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-800 block uppercase">Already Paid</span>
                <strong className="text-emerald-700 font-black">{fmt(Number(selected.totalAmount || 0) - Number(selected.balanceDue || 0))}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-800 block uppercase">Remaining Balance</span>
                <strong className="text-red-700 font-black text-sm">{fmt(selected.balanceDue)}</strong>
              </div>
            </div>
          </div>
        )}

        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
          Received Amount (₹) *
          <input
            ref={(element) => { fieldRefs.current.amount = element; }}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? "payment-amount-error" : undefined}
            type="number"
            inputMode="decimal"
            min="0.01"
            max={selected ? Number(selected.balanceDue) : undefined}
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => updateForm({ amount: e.target.value })}
            className={`mt-1.5 min-h-[46px] w-full rounded-xl border bg-card px-3.5 text-base font-black text-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none ${errors.amount ? "border-red-500" : "border-border"}`}
          />
          {errors.amount && <span id="payment-amount-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{errors.amount}</span>}
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
          Payment Date *
          <input
            ref={(element) => { fieldRefs.current.paymentDate = element; }}
            aria-invalid={Boolean(errors.paymentDate)}
            aria-describedby={errors.paymentDate ? "payment-date-error" : undefined}
            type="date"
            value={form.paymentDate}
            onChange={(e) => updateForm({ paymentDate: e.target.value })}
            className={`${inputClass} ${errors.paymentDate ? "border-red-500" : ""}`}
          />
          {errors.paymentDate && <span id="payment-date-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{errors.paymentDate}</span>}
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
          Payment Method *
          <select
            value={form.paymentMethod}
            onChange={(e) => {
              updateForm({ paymentMethod: e.target.value });
              setErrors((current) => ({ ...current, referenceNumber: undefined, bankName: undefined }));
            }}
            className={inputClass}
          >
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
          Reference / UTR Number
          <input
            ref={(element) => { fieldRefs.current.referenceNumber = element; }}
            aria-invalid={Boolean(errors.referenceNumber)}
            aria-describedby={errors.referenceNumber ? "payment-reference-error" : undefined}
            placeholder="e.g. UPI Ref or Cheque No."
            value={form.referenceNumber}
            onChange={(e) => updateForm({ referenceNumber: e.target.value })}
            className={`${inputClass} ${errors.referenceNumber ? "border-red-500" : ""}`}
          />
          {errors.referenceNumber && <span id="payment-reference-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{errors.referenceNumber}</span>}
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
          Bank Name
          <input
            ref={(element) => { fieldRefs.current.bankName = element; }}
            aria-invalid={Boolean(errors.bankName)}
            aria-describedby={errors.bankName ? "payment-bank-error" : undefined}
            placeholder="e.g. HDFC Bank, SBI"
            value={form.bankName}
            onChange={(e) => updateForm({ bankName: e.target.value })}
            className={`${inputClass} ${errors.bankName ? "border-red-500" : ""}`}
          />
          {errors.bankName && <span id="payment-bank-error" className="mt-1 block text-[11px] font-bold normal-case text-red-600">{errors.bankName}</span>}
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
          Notes / Remarks
          <input
            placeholder="Optional payment notes"
            value={form.notes}
            onChange={(e) => updateForm({ notes: e.target.value })}
            className={inputClass}
          />
        </label>
      </section>

      {/* Action Footer */}
      <div className="fixed inset-x-0 bottom-[74px] z-30 flex gap-3 border-t bg-card p-3 md:static md:justify-end md:border-0 md:bg-transparent md:p-0">
        <button
          type="button"
          onClick={() => nav(-1)}
          className="min-h-[48px] flex-1 rounded-xl border border-border text-xs sm:text-sm font-extrabold text-muted-foreground hover:bg-muted md:flex-none md:px-6 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="record-payment-form"
          disabled={saving || loadingOptions}
          aria-busy={saving}
          className="min-h-[48px] flex-[2] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs sm:text-sm font-extrabold text-white cursor-pointer shadow-xs md:flex-none md:px-8 disabled:opacity-60"
        >
          {saving ? "Recording..." : "Record Payment"}
        </button>
      </div>
    </form>
  );
}
