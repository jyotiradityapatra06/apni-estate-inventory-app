import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowRight, AlertTriangle, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { godownApi } from "../../api/godown.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import type { Godown } from "../../types/godown.types";

export function TransferFormPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [source, setSource] = useState(params.get("from") || "");
  const [destination, setDestination] = useState("");
  const [material, setMaterial] = useState(params.get("materialId") || "");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    godownApi
      .getAll()
      .then((r) => setGodowns((r.data || []).filter((g) => g.isActive)))
      .catch((e) => setError(e.message));
  }, []);

  const src = godowns.find((g) => g.id === source);
  const dest = godowns.find((g) => g.id === destination);
  const balance = src?.stockBalances.find((b) => b.inventoryItem.id === material);
  const available = Math.max(0, Number(balance?.quantity || 0) - Number(balance?.reservedQuantity || 0));
  const amount = Number(quantity || 0);

  const materials = useMemo(
    () => src?.stockBalances.filter((b) => b.quantity - b.reservedQuantity > 0) || [],
    [src]
  );

  const validate = () => {
    if (!src || !dest || !balance || amount <= 0) return "Please complete all transfer details.";
    if (src.id === dest.id) return "From and To Godowns must be different.";
    if (amount > available) return `Only ${available} ${balance.inventoryItem.unit} are available in ${src.name}.`;
    return "";
  };

  const next = (e:React.FormEvent) => {
    e.preventDefault();
    const message = validate();
    if (message) setError(message);
    else {
      setError("");
      setReview(true);
    }
  };

  const submit = async () => {
    if (saving) return;
    const message = validate();
    if (message) return setError(message);
    setSaving(true);
    try {
      const draft = await godownApi.createTransfer({
        sourceGodownId: source,
        destinationGodownId: destination,
        notes: notes || undefined,
        items: [{ inventoryItemId: material, quantity: amount }],
      });
      const posted = await godownApi.postTransfer(draft.data.id);
      toast.success("Stock transferred successfully");
      window.dispatchEvent(new Event("notifications:refresh"));
      nav(`/transfers/${posted.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stock transfer failed.");
      setReview(false);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none";

  return (
    <form onSubmit={next} className="mx-auto max-w-3xl space-y-6 pb-28">
      <PageHeader
        title="Transfer Stock"
        description="Move available material between active warehouses / godowns."
      />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          <AlertTriangle size={18} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <SectionHeader title="Transfer Details" description="Select source godown, material, destination, and transfer quantity." />

        <div className="grid gap-5 md:grid-cols-2">
          {/* Source Godown */}
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            From Godown (Source)
            <select
              required
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setMaterial("");
                setQuantity("");
              }}
              className={inputClass}
            >
              <option value="">Choose source warehouse…</option>
              {godowns.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          {/* Material Selection */}
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Select Material
            <select
              required
              disabled={!source}
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className={inputClass}
            >
              <option value="">
                {source ? "Choose available material…" : "First choose a source godown"}
              </option>
              {materials.map((b) => (
                <option key={b.id} value={b.inventoryItem.id}>
                  {b.inventoryItem.materialName} · {b.quantity - b.reservedQuantity} {b.inventoryItem.unit} available
                </option>
              ))}
            </select>
          </label>

          {/* Destination Godown */}
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            To Godown (Destination)
            <select
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={inputClass}
            >
              <option value="">Choose destination warehouse…</option>
              {godowns
                .filter((g) => g.id !== source)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </label>

          {/* Transfer Quantity */}
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Transfer Quantity {balance ? `(${balance.inventoryItem.unit})` : ""}
            <input
              required
              type="number"
              inputMode="decimal"
              min="0.001"
              step="0.001"
              max={available || undefined}
              placeholder={`Max ${available} ${balance ? balance.inventoryItem.unit : ""}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base font-black text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
            />
          </label>

          {/* Source Balance Stat Cards */}
          {balance && (
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4 text-center md:col-span-2">
              <Stat label="Physical Stock" value={`${balance.quantity} ${balance.inventoryItem.unit}`} />
              <Stat label="Reserved Stock" value={`${balance.reservedQuantity} ${balance.inventoryItem.unit}`} />
              <Stat label="Net Available" value={`${available} ${balance.inventoryItem.unit}`} isGreen />
            </div>
          )}

          {/* Notes */}
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 md:col-span-2">
            Notes / Transfer Reason (Optional)
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Site supply transfer or warehouse rebalancing"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
            />
          </label>
        </div>
      </section>

      {/* Footer Actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))] md:static md:justify-end md:border-0 md:bg-transparent md:p-0">
        <button
          type="button"
          onClick={() => nav(-1)}
          className="min-h-[48px] flex-1 rounded-xl border border-slate-200 text-xs sm:text-sm font-extrabold text-slate-700 hover:bg-slate-50 md:flex-none md:px-6"
        >
          Cancel
        </button>
        <button className="min-h-[48px] flex-[2] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs sm:text-sm font-extrabold text-white cursor-pointer shadow-sm md:flex-none md:px-8">
          Review Transfer
        </button>
      </div>

      {/* Confirmation Modal */}
      {review && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="w-full rounded-t-2xl bg-white p-6 sm:max-w-md sm:rounded-2xl space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-[#F97316]">Confirmation</p>
                <h2 className="text-lg font-black text-slate-900">Confirm Stock Transfer</h2>
              </div>
            </div>

            <dl className="space-y-3 rounded-xl bg-slate-50 p-4 text-xs sm:text-sm">
              <Row label="Material" value={balance?.inventoryItem.materialName || ""} />
              <Row label="Transfer Quantity" value={`${amount} ${balance?.inventoryItem.unit || ""}`} highlight />
              <Row label="From Godown" value={src?.name || ""} />
              <Row label="To Godown" value={dest?.name || ""} />
            </dl>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReview(false)}
                className="flex-1 min-h-[48px] rounded-xl border border-slate-200 text-xs sm:text-sm font-extrabold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={submit}
                className="flex-[2] min-h-[48px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs sm:text-sm font-extrabold text-white cursor-pointer shadow-sm disabled:opacity-60"
              >
                {saving ? "Transferring…" : "Confirm Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function Stat({ label, value, isGreen = false }: { label: string; value: string; isGreen?: boolean }) {
  return (
    <div>
      <span className="text-[10px] font-black uppercase text-slate-400 block">{label}</span>
      <strong className={`text-xs sm:text-sm font-black mt-0.5 block ${isGreen ? "text-green-700" : "text-slate-900"}`}>
        {value}
      </strong>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <dt className="text-xs font-extrabold text-slate-500 uppercase">{label}:</dt>
      <dd className={`font-black ${highlight ? "text-base text-orange-600" : "text-slate-900"}`}>{value}</dd>
    </div>
  );
}
