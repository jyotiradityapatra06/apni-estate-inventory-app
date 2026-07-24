import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { customerApi } from "../../api/customer.api";
import invoiceApi from "../../api/invoice.api";
import paymentApi from "../../api/payment.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import { fmt } from "../../utils/currency";

export default function CreatePaymentPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
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
        setCustomers(c.data || []);
        setInvoices((i.data || []).filter((x: any) => ["ISSUED", "PARTIALLY_PAID"].includes(x.status)));
        const selected = (i.data || []).find((x: any) => x.id === form.invoiceId);
        if (selected) {
          setForm((f: any) => ({ ...f, customerId: selected.customerId, amount: selected.balanceDue }));
        }
      })
      .catch((e: any) => toast.error(e.message));
  }, []);

  const available = invoices.filter((x) => !form.customerId || x.customerId === form.customerId);
  const selected = invoices.find((x) => x.id === form.invoiceId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected && Number(form.amount) > Number(selected.balanceDue)) {
      return toast.error("Payment amount cannot exceed remaining invoice balance.");
    }
    try {
      const body = {
        ...form,
        paymentDate: new Date(form.paymentDate).toISOString(),
        idempotencyKey: crypto.randomUUID(),
      };
      const r = await paymentApi.create(body);
      toast.success("Payment recorded successfully");
      nav(`/payments/${r.data.id}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const inputClass =
    "mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none";

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6 pb-28">
      <PageHeader
        title="Record Payment Receipt"
        description="Enter payment received from customer against an issued invoice."
      />

      <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm md:grid-cols-2">
        <SectionHeader title="Payment & Invoice Details" description="Select customer account and target invoice." />

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Customer Account *
          <select
            required
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value, invoiceId: "" })}
            className={inputClass}
          >
            <option value="">Choose customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Target Invoice *
          <select
            required
            value={form.invoiceId}
            onChange={(e) => {
              const x = invoices.find((i) => i.id === e.target.value);
              setForm({
                ...form,
                invoiceId: e.target.value,
                customerId: x?.customerId || form.customerId,
                amount: x?.balanceDue || "",
              });
            }}
            className={inputClass}
          >
            <option value="">Choose target invoice…</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.invoiceNumber} · Balance {fmt(i.balanceDue)}
              </option>
            ))}
          </select>
        </label>

        {selected && (
          <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-4 md:col-span-2 space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-800 block">Remaining Invoice Balance</span>
            <strong className="text-2xl font-black text-amber-950 block">{fmt(selected.balanceDue)}</strong>
          </div>
        )}

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Received Amount (₹) *
          <input
            required
            type="number"
            inputMode="decimal"
            min="0.01"
            max={selected ? Number(selected.balanceDue) : undefined}
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base font-black text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
          />
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Payment Date *
          <input
            required
            type="date"
            value={form.paymentDate}
            onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Payment Method *
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            className={inputClass}
          >
            {["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"].map((x) => (
              <option key={x} value={x}>
                {x.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Reference / UTR Number
          <input
            placeholder="e.g. UPI Ref or Cheque No."
            value={form.referenceNumber}
            onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Bank Name
          <input
            placeholder="e.g. HDFC Bank, SBI"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Notes / Remarks
          <input
            placeholder="Optional payment notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={inputClass}
          />
        </label>
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
        <button className="min-h-[48px] flex-[2] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs sm:text-sm font-extrabold text-white cursor-pointer shadow-xs md:flex-none md:px-8">
          Record Payment
        </button>
      </div>
    </form>
  );
}
