import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Factory, MoreVertical, Phone, Plus, Search, Landmark, ShoppingBag, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supplierApi } from "../../api/supplier.api";
import { purchaseApi } from "../../api/purchase.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { ConfirmDialog } from "../../app/components/common/ConfirmDialog";
import { StatCard } from "../../app/components/common/Card";
import { EmptyState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { useAuth } from "../../hooks/useAuth";
import type { Supplier } from "../../types/supplier.types";
import { hasPermission } from "../../utils/permissions";
import { fmt } from "../../utils/currency";

export function SupplierListPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const canCreate = hasPermission(user, "suppliers:create");
  const canUpdate = hasPermission(user, "suppliers:update");
  const canDelete = hasPermission(user, "suppliers:delete");

  const [data, setData] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState("");
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError("");
    try {
      const [supplierRes, purchasesRes] = await Promise.all([
        supplierApi.getAll(),
        purchaseApi.list().catch(() => ({ data: [] }))
      ]);
      setData(supplierRes.data || []);
      setPurchases(purchasesRes.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppliers could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    return data.filter(s => {
      const q = search.trim().toLowerCase();
      return (
        (!q || [s.name, s.companyName, s.phone, s.gstin, s.supplierCode, s.contactPerson].some(v => v?.toLowerCase().includes(q))) &&
        (active === "ALL" || (active === "ACTIVE" ? s.isActive : !s.isActive))
      );
    });
  }, [data, search, active]);

  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await supplierApi.remove(deleting.id);
      toast.success("Supplier deactivated");
      setDeleting(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Supplier could not be deactivated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <PageHeader 
        title="Suppliers" 
        description="Manage supplier details and material sources." 
        actions={
          canCreate && (
            <Link to="/suppliers/new" className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer">
              <Plus size={15}/>
              Add Supplier
            </Link>
          )
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Suppliers" value={data.length} helper="Registered vendors list" icon={Factory} />
        <StatCard label="Linked Materials" value={data.filter(s => s.suppliedMaterials.length > 0).length} helper="Active material catalogs" icon={ShoppingBag} />
        <StatCard label="Total Payables" value={fmt(purchases.reduce((sum, p) => sum + (p.status !== "CANCELLED" ? Number(p.balanceDue || 0) : 0), 0))} helper="Outstanding payables balance" icon={Landmark} />
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
            <input 
              aria-label="Search suppliers" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search supplier, phone, GST number or code" 
              className="h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </label>
          <select 
            aria-label="Supplier status" 
            value={active} 
            onChange={e => setActive(e.target.value)} 
            className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All Suppliers</option>
            <option value="ACTIVE">Active Suppliers</option>
            <option value="INACTIVE">Inactive Suppliers</option>
          </select>
          {(search || active !== "ALL") && (
            <button 
              onClick={() => { setSearch(""); setActive("ALL"); }} 
              className="font-bold text-xs text-slate-700 hover:bg-slate-50 px-4 h-10 border rounded-lg cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4}/>
      ) : error ? (
        <EmptyState title="Could not load suppliers" description={error} action={<button onClick={load} className="rounded-xl bg-orange-600 text-white px-4 py-2 font-semibold">Retry</button>} />
      ) : visible.length === 0 ? (
        <EmptyState 
          title="No Suppliers Added" 
          description={data.length ? "Try adjusting filters or search keywords." : "Add suppliers to track purchases and payments."} 
          icon={Factory} 
          action={
            canCreate && (
              <Link to="/suppliers/new" className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 text-xs font-bold text-white transition-colors cursor-pointer">
                Add Supplier
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  {["Supplier", "Phone", "GST Number", "Total Purchases", "Last Purchase", "Outstanding Payable", "Actions"].map(x => (
                    <th key={x} className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500">{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(s => {
                  const supplierPurchases = purchases.filter(p => p.supplierId === s.id && p.status !== "CANCELLED");
                  const totalPurchases = supplierPurchases.length;
                  const lastPurchase = supplierPurchases.length > 0 
                    ? new Date(Math.max(...supplierPurchases.map(p => new Date(p.orderDate).getTime()))).toLocaleDateString("en-IN") 
                    : "—";
                  const outstandingPayable = supplierPurchases.reduce((sum, p) => sum + Number(p.balanceDue || 0), 0);

                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <Link to={`/suppliers/${s.id}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors">
                          {s.name}
                        </Link>
                        <p className="text-xs text-slate-400 font-medium">{s.supplierCode}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <a href={`tel:${s.phone}`} className="text-orange-600 font-semibold hover:underline">
                          {s.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">{s.gstin || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-600 font-semibold">{totalPurchases} PO(s)</td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium">{lastPurchase}</td>
                      <td className={`px-4 py-3.5 font-black ${outstandingPayable > 0 ? "text-red-600" : "text-slate-900"}`}>
                        {fmt(outstandingPayable)}
                      </td>
                      <td className="relative px-4 py-3.5">
                        <div className="flex items-center">
                          <Link to={`/suppliers/${s.id}`} className="font-bold text-xs text-orange-600 hover:text-orange-700 px-3 py-1 hover:bg-slate-50 rounded-lg">
                            View
                          </Link>
                          <button 
                            aria-label={`Actions for ${s.name}`} 
                            onClick={() => setMenu(menu === s.id ? "" : s.id)} 
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                          >
                            <MoreVertical size={16}/>
                          </button>
                          {menu === s.id && (
                            <Actions 
                              view={() => nav(`/suppliers/${s.id}`)} 
                              edit={canUpdate ? () => nav(`/suppliers/${s.id}/edit`) : undefined} 
                              del={canDelete ? () => setDeleting(s) : undefined}
                              onClose={() => setMenu("")}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Viewport */}
          <div className="grid gap-4 md:hidden">
            {visible.map(s => {
              const supplierPurchases = purchases.filter(p => p.supplierId === s.id && p.status !== "CANCELLED");
              const totalPurchases = supplierPurchases.length;
              const outstandingPayable = supplierPurchases.reduce((sum, p) => sum + Number(p.balanceDue || 0), 0);

              return (
                <article key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{s.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{s.supplierCode} &middot; {s.phone}</p>
                    </div>
                    {canUpdate && (
                      <button 
                        aria-label={`Actions for ${s.name}`} 
                        onClick={() => setMenu(menu === s.id ? "" : s.id)} 
                        className="h-8 w-8 shrink-0 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer border"
                      >
                        <MoreVertical size={16}/>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Outstanding Payable</span>
                      <strong className={`text-sm font-black mt-0.5 block ${outstandingPayable > 0 ? "text-red-600" : "text-slate-950"}`}>
                        {fmt(outstandingPayable)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Purchases</span>
                      <strong className="text-slate-700 text-xs mt-0.5 block font-bold">{totalPurchases} PO(s)</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Link to={`/suppliers/${s.id}`} className="flex-1 flex min-h-9 items-center justify-center rounded-xl border text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                      View details
                    </Link>
                    <button 
                      onClick={() => nav(`/purchases/new?supplierId=${s.id}`)}
                      className="flex-1 flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-orange-50 text-xs font-bold text-orange-600 hover:bg-orange-100 cursor-pointer"
                    >
                      Create Purchase
                    </button>
                  </div>
                  {menu === s.id && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <Actions 
                        inline 
                        view={() => nav(`/suppliers/${s.id}`)} 
                        edit={canUpdate ? () => nav(`/suppliers/${s.id}/edit`) : undefined} 
                        del={canDelete ? () => setDeleting(s) : undefined}
                        onClose={() => setMenu("")}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog 
        open={!!deleting} 
        title={`Deactivate ${deleting?.name}?`} 
        description="The supplier will remain in purchase history and can be activated again by editing." 
        confirmLabel={busy ? "Updating…" : "Deactivate Supplier"} 
        destructive 
        onCancel={() => !busy && setDeleting(null)} 
        onConfirm={remove}
      />
    </div>
  );
}

function Actions({ view, edit, del, inline = false, onClose }: { view: () => void; edit?: () => void; del?: () => void; inline?: boolean; onClose: () => void }) {
  const trigger = (fn?: () => void) => {
    if (fn) fn();
    onClose();
  };

  return (
    <div className={inline ? "grid grid-cols-3 gap-2" : "absolute right-4 top-12 z-20 w-36 rounded-xl border bg-white p-1 shadow-lg border-slate-100 text-left"}>
      <button onClick={() => trigger(view)} className="min-h-9 rounded-lg px-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full cursor-pointer">View</button>
      {edit && <button onClick={() => trigger(edit)} className="min-h-9 rounded-lg px-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full cursor-pointer">Edit</button>}
      {del && <button onClick={() => trigger(del)} className="min-h-9 rounded-lg px-3 text-left text-xs font-semibold text-red-600 hover:bg-slate-50 w-full cursor-pointer">Deactivate</button>}
    </div>
  );
}
export default SupplierListPage;
