import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { customerApi } from "../../../api/customer.api";
import inventoryApi, { InventoryItemData } from "../../../api/inventory.api";
import invoiceApi from "../../../api/invoice.api";
import { PageHeader, SectionHeader } from "../../../app/components/common/PageHeader";
import { calculateOrder } from "../../sales-orders/salesOrderCalculations";
import type { Customer } from "../../../types/customer.types";
import { fmt } from "../../../utils/currency";

type DirectLine = { inventoryItemId: string; quantity: string; rate: string; discountRate: string };

export default function DirectInvoiceForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<InventoryItemData[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [lines, setLines] = useState<DirectLine[]>([]);
  const [invoiceType, setInvoiceType] = useState<"GST" | "NON_GST">(params.get("type")?.toUpperCase() === "NON_GST" ? "NON_GST" : "GST");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([customerApi.getAll(), inventoryApi.getItems()])
      .then(([customerResponse, inventoryResponse]) => {
        setCustomers(customerResponse.data.filter((customer) => customer.isActive));
        setMaterials(inventoryResponse.data.filter((item) => item.isActive));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Billing information could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  const customer = customers.find((item) => item.id === customerId);
  const filteredCustomers = customers.filter((item) => {
    const query = customerSearch.trim().toLowerCase();
    return !query || [item.name, item.phone, item.gstin].some((value) => value?.toLowerCase().includes(query));
  });
  const availableMaterials = materials.filter((item) => {
    const query = materialSearch.trim().toLowerCase();
    return !lines.some((line) => line.inventoryItemId === item.id) &&
      (!query || [item.materialName, item.sku, item.category].some((value) => value?.toLowerCase().includes(query)));
  });
  const summary = useMemo(() => calculateOrder(lines.map((line) => {
    const material = materials.find((item) => item.id === line.inventoryItemId);
    return { ...line, gstRate: String(material?.taxRate ?? 0) };
  }), invoiceType), [lines, materials, invoiceType]);

  const addMaterial = (inventoryItemId: string) => {
    if (!inventoryItemId) return;
    const material = materials.find((item) => item.id === inventoryItemId);
    if (!material) return;
    setLines((current) => [...current, {
      inventoryItemId,
      quantity: "1",
      rate: String(material.sellingPrice ?? 0),
      discountRate: "0",
    }]);
    setMaterialSearch("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!customerId) return setError("Select a customer.");
    if (!lines.length) return setError("Add at least one material.");
    for (const line of lines) {
      const material = materials.find((item) => item.id === line.inventoryItemId)!;
      if (Number(line.quantity) <= 0) return setError(`Quantity for ${material.materialName} must be greater than zero.`);
      if (Number(line.rate) < 0) return setError(`Rate for ${material.materialName} cannot be negative.`);
      if (invoiceType === "GST" && (!material.hsnCode?.trim() || material.taxRate === null || material.taxRate === undefined)) {
        return setError(`GST/HSN configuration is missing for ${material.materialName}.`);
      }
    }
    setSaving(true);
    try {
      const response = await invoiceApi.create({
        invoiceMode: "DIRECT",
        customerId,
        invoiceType,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes || undefined,
        terms: terms || undefined,
        directItems: lines,
      });
      toast.success(`Draft Invoice ${response.data.invoiceNumber} created.`);
      window.dispatchEvent(new Event("notifications:refresh"));
      navigate(`/invoices/${response.data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invoice could not be created.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "mt-1.5 min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base font-semibold text-foreground outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";
  if (loading) return <div className="space-y-4" role="status"><div className="h-10 w-64 animate-pulse rounded bg-muted"/><div className="h-64 animate-pulse rounded-2xl bg-muted"/></div>;

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6 pb-44 md:pb-28">
      <PageHeader title="Create Direct Invoice" description="Bill a customer immediately without creating a Sales Order." />
      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800"><AlertTriangle size={18}/>{error}</div>}

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <SectionHeader title="Customer & Bill Category" description="Choose the customer and GST classification." />
        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">Search Customer
          <input type="search" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Name, phone or GSTIN" className={inputClass}/>
        </label>
        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">Select Customer *
          <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClass}>
            <option value="">Choose customer…</option>
            {filteredCustomers.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.phone}</option>)}
          </select>
        </label>
        {customer && <div className="rounded-xl border border-border bg-muted p-4 text-sm"><strong>{customer.name}</strong><p className="text-muted-foreground">{customer.phone}{customer.gstin ? ` · GSTIN: ${customer.gstin}` : ""}</p></div>}
        <div className="grid gap-3 sm:grid-cols-2">
          {(["GST", "NON_GST"] as const).map((value) => <button key={value} type="button" onClick={() => setInvoiceType(value)} className={`min-h-[76px] rounded-xl border p-4 text-left ${invoiceType === value ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500/20" : "border-border"}`}><span className="flex items-center justify-between font-black">{value === "GST" ? "GST Tax Invoice" : "Non-GST Bill"}{invoiceType === value && <CheckCircle2 size={18} className="text-orange-600"/>}</span><small className="text-muted-foreground">{value === "GST" ? "HSN with CGST/SGST/IGST" : "Bill of Supply without tax"}</small></button>)}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <SectionHeader title="Invoice Items" description="Add inventory materials, quantities, and selling rates." />
        <input type="search" value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)} placeholder="Search material or SKU" className={inputClass}/>
        <select value="" onChange={(e) => addMaterial(e.target.value)} className={inputClass}>
          <option value="">Add a material…</option>
          {availableMaterials.map((item) => <option key={item.id} value={item.id}>{item.materialName} — {item.sku} · Stock {item.quantity} {item.unit}</option>)}
        </select>
        {!lines.length && <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"><Plus className="mx-auto mb-2"/>Add at least one material.</div>}
        <div className="space-y-3">
          {lines.map((line, index) => {
            const material = materials.find((item) => item.id === line.inventoryItemId)!;
            return <article key={line.inventoryItemId} className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="mb-3 flex items-start justify-between"><div><strong>{material.materialName}</strong><p className="text-xs text-muted-foreground">SKU {material.sku}{invoiceType === "GST" && material.hsnCode ? ` · HSN ${material.hsnCode} · GST ${material.taxRate ?? 0}%` : ""}</p></div><button type="button" aria-label={`Remove ${material.materialName}`} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-red-600"><Trash2 size={18}/></button></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {([["quantity", "Quantity"], ["rate", "Rate"], ["discountRate", "Discount %"]] as const).map(([key, label]) => <label key={key} className="text-xs font-bold text-muted-foreground">{label}<input type="number" min={key === "rate" ? "0" : "0.001"} step="0.001" value={line[key]} onChange={(e) => setLines((current) => current.map((item, lineIndex) => lineIndex === index ? { ...item, [key]: e.target.value } : item))} className={inputClass}/></label>)}
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <SectionHeader title="Payment Terms" description="Optional due date, notes, and invoice terms." />
        <div className="grid gap-4 md:grid-cols-2"><label className="text-xs font-bold text-muted-foreground">Due Date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass}/></label><label className="text-xs font-bold text-muted-foreground">Terms<input value={terms} onChange={(e) => setTerms(e.target.value)} className={inputClass}/></label><label className="text-xs font-bold text-muted-foreground md:col-span-2">Notes<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} py-3`}/></label></div>
      </section>

      <section className="ml-auto max-w-lg space-y-2 rounded-2xl bg-slate-950 p-5 text-white"><SummaryRow label="Subtotal" value={fmt(summary.subtotal)}/><SummaryRow label="Discount" value={fmt(summary.discount)}/>{invoiceType === "GST" && <SummaryRow label="GST Tax" value={fmt(summary.tax)}/>}<div className="border-t border-slate-700 pt-2"><SummaryRow label="Grand Total" value={fmt(summary.total)} large/></div></section>
      <div className="fixed inset-x-0 bottom-[74px] z-30 flex gap-3 border-t bg-card p-3 md:static md:justify-end md:border-0 md:bg-transparent md:p-0"><button type="button" onClick={() => navigate(-1)} className="min-h-12 flex-1 rounded-xl border border-border font-bold md:flex-none md:px-6">Cancel</button><button type="submit" disabled={saving || !customerId || !lines.length} className="min-h-12 flex-[2] rounded-xl bg-orange-600 px-6 font-black text-white disabled:opacity-60 md:flex-none">{saving ? "Creating…" : invoiceType === "GST" ? "Create Direct GST Invoice" : "Create Direct Non-GST Bill"}</button></div>
    </form>
  );
}

function SummaryRow({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return <div className={`flex justify-between ${large ? "text-lg font-black text-orange-400" : "text-sm text-slate-300"}`}><span>{label}</span><strong>{value}</strong></div>;
}
