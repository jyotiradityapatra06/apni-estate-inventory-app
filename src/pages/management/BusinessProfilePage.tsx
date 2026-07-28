import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Building2, CreditCard, FileText, Loader2, ReceiptText, Save } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { businessApi, BusinessUpdateInput } from "../../api/business.api";
import { useAuth } from "../../hooks/useAuth";

type FormState = Record<Exclude<keyof BusinessUpdateInput, "workerSeatLimit">, string>;

const emptyForm: FormState = {
  name: "", logoUrl: "", phone: "", email: "", website: "", address: "",
  gstNumber: "", state: "", stateCode: "", registrationType: "",
  bankName: "", accountNumber: "", ifscCode: "", branch: "", upiId: "",
  invoiceTerms: "", invoiceFooter: "",
};

type ProfileField = readonly [keyof FormState, string, boolean?, ("email" | "url" | "textarea")?];
type ProfileSection = { title: string; icon: typeof Building2; fields: readonly ProfileField[] };

const sections: ProfileSection[] = [
  { title: "Business Information", icon: Building2, fields: [
    ["name", "Business Name", true], ["phone", "Phone"], ["email", "Email", false, "email"],
    ["website", "Website", false, "url"], ["logoUrl", "Logo URL", false, "url"], ["address", "Address", false, "textarea"],
  ]},
  { title: "GST Configuration", icon: ReceiptText, fields: [
    ["gstNumber", "GSTIN"], ["state", "State"], ["stateCode", "State Code"], ["registrationType", "Registration Type"],
  ]},
  { title: "Payment Information", icon: CreditCard, fields: [
    ["bankName", "Bank Name"], ["accountNumber", "Account Number"], ["ifscCode", "IFSC Code"],
    ["branch", "Branch"], ["upiId", "UPI ID"],
  ]},
  { title: "Invoice Settings", icon: FileText, fields: [
    ["invoiceFooter", "Invoice Footer", false, "textarea"], ["invoiceTerms", "Terms & Conditions", false, "textarea"],
  ]},
];

export default function BusinessProfilePage() {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const canEdit = user?.role === "OWNER";

  useEffect(() => {
    businessApi.getProfile().then((response) => {
      const profile = response.data;
      setForm(Object.fromEntries(Object.keys(emptyForm).map((key) => [key, String(profile[key as keyof typeof profile] ?? "")])) as FormState);
    }).catch((error) => {
      setLoadError(error instanceof Error ? error.message : "Unable to load business profile.");
    }).finally(() => setLoading(false));
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      await businessApi.updateProfile(form);
      await refreshSession();
      toast.success("Business profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save business profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4" role="status"><div className="h-10 w-64 animate-pulse rounded bg-muted"/><div className="h-64 animate-pulse rounded-2xl bg-muted"/></div>;
  if (loadError) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"><p>{loadError}</p><button className="mt-4 min-h-11 font-bold underline" onClick={() => window.location.reload()}>Try again</button></div>;

  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6 pb-28 md:pb-8">
      <header className="flex items-center gap-3">
        <button type="button" onClick={() => navigate("/management")} className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-border" aria-label="Back to management"><ArrowLeft size={20}/></button>
        <div><h1 className="text-2xl font-black text-foreground">Business Profile</h1><p className="text-sm text-muted-foreground">Identity and invoice configuration for your business.</p></div>
      </header>

      {!canEdit && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">Only the business owner can edit these settings.</div>}

      {sections.map(({ title, icon: Icon, fields }) => (
        <section key={title} className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-bold"><Icon className="text-orange-600" size={20}/>{title}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([key, label, required, kind]) => {
              const isTextarea = kind === "textarea";
              const shared = { id: key, value: form[key], disabled: !canEdit, required: Boolean(required), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [key]: event.target.value })) };
              return <label key={key} className={`block ${isTextarea ? "md:col-span-2" : ""}`}><span className="mb-1.5 block text-sm font-bold text-foreground">{label}{required ? " *" : ""}</span>{isTextarea ? <textarea {...shared} rows={4} className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"/> : <input {...shared} type={kind || "text"} className="min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"/>}</label>;
            })}
          </div>
        </section>
      ))}

      {canEdit && <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0"><div className="mx-auto flex max-w-5xl justify-end"><button type="submit" disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 font-bold text-white shadow-lg disabled:opacity-60 md:w-auto">{saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} {saving ? "Saving..." : "Save Business Profile"}</button></div></div>}
    </form>
  );
}
