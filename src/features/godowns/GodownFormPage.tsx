import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { godownApi } from "../../api/godown.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import type { GodownInput } from "../../types/godown.types";

const empty: GodownInput = {
  name: "",
  godownCode: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  contactPerson: "",
  phone: "",
  notes: "",
  isDefault: false,
  isActive: true,
};

const cls = "mt-2 min-h-12 w-full rounded-lg border px-3 text-base bg-white";
const phoneRegex = /^(?:\+91[ -]?)?[6-9]\d{9}$/;

export function GodownFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const first = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<GodownInput>(empty);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit") {
      godownApi
        .getById(id)
        .then((r) =>
          setForm({
            name: r.data.name,
            godownCode: r.data.godownCode || "",
            address: r.data.address || "",
            city: r.data.city || "",
            state: r.data.state || "",
            pincode: r.data.pincode || "",
            contactPerson: r.data.contactPerson || "",
            phone: r.data.phone || "",
            notes: r.data.notes || "",
            isDefault: r.data.isDefault,
            isActive: r.data.isActive,
          })
        )
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.phone && !phoneRegex.test(form.phone.replace(/\s/g, ""))) {
      setError("Enter a valid Indian phone number.");
      first.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setSaving(true);
    try {
      const r = mode === "create" ? await godownApi.create(form) : await godownApi.update(id, form);
      toast.success(mode === "create" ? "Godown added" : "Godown updated");
      nav(`/godowns/${r.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Godown could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-slate-200" />;

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5 pb-24">
      <PageHeader
        title={mode === "create" ? "Add Godown" : "Edit Godown"}
        description="Add storage-location and contact details. Stock is managed separately."
      />
      {error && <p className="rounded-lg bg-red-50 p-3 font-semibold text-red-800" role="alert">{error}</p>}
      <section className="rounded-xl border bg-white p-5">
        <SectionHeader title="Godown Details" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Godown name *
            <input
              ref={first}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={cls}
              placeholder="e.g. Pune Central Godown"
            />
          </label>
          <label className="text-sm font-semibold">
            Godown Code (Unique)
            <input
              value={form.godownCode || ""}
              onChange={(e) => setForm({ ...form, godownCode: e.target.value })}
              className={cls}
              placeholder="e.g. PN-01 (Auto-generated if blank)"
            />
          </label>
          <label className="text-sm font-semibold">
            Contact person
            <input
              value={form.contactPerson || ""}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className={cls}
              placeholder="e.g. Rajesh Kumar"
            />
          </label>
          <label className="text-sm font-semibold">
            Phone number
            <input
              inputMode="tel"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={cls}
              placeholder="e.g. 9876543210"
            />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Address
            <textarea
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={`${cls} min-h-20 p-3`}
              placeholder="Building, street address"
            />
          </label>
          <label className="text-sm font-semibold">
            City
            <input
              value={form.city || ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={cls}
              placeholder="e.g. Pune"
            />
          </label>
          <label className="text-sm font-semibold">
            State
            <input
              value={form.state || ""}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className={cls}
              placeholder="e.g. Maharashtra"
            />
          </label>
          <label className="text-sm font-semibold">
            Pincode
            <input
              value={form.pincode || ""}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className={cls}
              placeholder="e.g. 411001"
            />
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={!!form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="h-5 w-5 rounded border-slate-300"
              />
              Default Godown
            </label>
            {mode === "edit" && (
              <label className="flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300"
                />
                Active
              </label>
            )}
          </div>
          <label className="text-sm font-semibold md:col-span-2">
            Notes
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={`${cls} min-h-24 p-3`}
              placeholder="Internal notes about storage capacity or directions"
            />
          </label>
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-[72px] z-30 flex gap-3 border-t bg-white p-3 md:static md:justify-end md:border-0 md:bg-transparent">
        <button
          type="button"
          onClick={() => nav(-1)}
          className="min-h-12 flex-1 rounded-lg border px-5 font-semibold md:flex-none"
        >
          Cancel
        </button>
        <button
          disabled={saving}
          className="min-h-12 flex-[2] rounded-lg bg-blue-700 px-6 font-semibold text-white md:flex-none disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "create" ? "Add Godown" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
