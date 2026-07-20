import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MoreVertical, Phone, Plus, Search, Users, DollarSign, UserCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { customerApi } from "../../api/customer.api";
import salesOrderApi from "../../api/salesOrder.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { ConfirmDialog } from "../../app/components/common/ConfirmDialog";
import { StatCard } from "../../app/components/common/Card";
import { EmptyState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { useAuth } from "../../hooks/useAuth";
import type { Customer } from "../../types/customer.types";
import { hasPermission } from "../../utils/permissions";
import { fmt } from "../../utils/currency";

export function CustomerListPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const canCreate = hasPermission(user, "customers:create");
  const canUpdate = hasPermission(user, "customers:update");
  const canDelete = hasPermission(user, "customers:delete");

  const [data, setData] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [balance, setBalance] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState("");
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError("");
    try {
      const [customerRes, ordersRes] = await Promise.all([
        customerApi.getAll(),
        salesOrderApi.getAll().catch(() => ({ data: [] }))
      ]);
      setData(customerRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Customers could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    return data.filter(c => {
      const q = search.trim().toLowerCase();
      const match = !q || [c.name, c.phone, c.gstin, c.customerCode].some(v => v?.toLowerCase().includes(q));
      return match && (balance === "ALL" || (balance === "DUE" ? c.outstandingBalance > 0 : c.outstandingBalance <= 0));
    });
  }, [data, search, balance]);

  const due = data.filter(c => c.outstandingBalance > 0);

  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await customerApi.remove(deleting.id);
      toast.success("Customer deleted");
      setDeleting(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Customer could not be deleted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <PageHeader 
        title="Customers" 
        description="Manage customer details, contact information and outstanding amounts." 
        actions={
          canCreate && (
            <Link to="/customers/new" className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer">
              <Plus size={15}/>
              Add Customer
            </Link>
          )
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Customers" value={data.length} helper="Active registered clients" icon={Users} />
        <StatCard label="Due Balances" value={due.length} helper="Pending outstanding accounts" icon={UserCheck} className={due.length > 0 ? "border-amber-200 bg-amber-50/20" : ""} />
        <StatCard label="Amount to Receive" value={fmt(due.reduce((s, c) => s + c.outstandingBalance, 0))} helper="Total outstanding receivables" icon={DollarSign} />
      </div>

      {/* Filter panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
            <input 
              aria-label="Search customers" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search name, phone, GST number or code" 
              className="h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </label>
          <select 
            aria-label="Balance status" 
            value={balance} 
            onChange={e => setBalance(e.target.value)} 
            className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All balances</option>
            <option value="DUE">Amount Due</option>
            <option value="CLEAR">No Amount Due</option>
          </select>
          {(search || balance !== "ALL") && (
            <button 
              onClick={() => { setSearch(""); setBalance("ALL"); }} 
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
        <EmptyState title="Could not load customers" description={error} action={<button onClick={load} className="rounded-xl bg-orange-600 text-white px-4 py-2 font-semibold">Retry</button>} />
      ) : visible.length === 0 ? (
        <EmptyState 
          title="No Customers Added" 
          description={data.length ? "Try adjusting filters or search keywords." : "Start managing your construction clients."} 
          icon={Users} 
          action={
            canCreate && (
              <Link to="/customers/new" className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 text-xs font-bold text-white transition-colors cursor-pointer">
                Add Customer
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table Viewport */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  {["Customer", "Phone", "GST Number", "Total Orders", "Last Purchase", "Outstanding Amount", "Actions"].map(x => (
                    <th key={x} className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500">{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(c => {
                  const custOrders = orders.filter(o => o.customerId === c.id && o.status !== "CANCELLED");
                  const totalOrders = custOrders.length;
                  const lastPurchase = custOrders.length > 0 
                    ? new Date(Math.max(...custOrders.map(o => new Date(o.orderDate).getTime()))).toLocaleDateString("en-IN") 
                    : "—";

                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <Link to={`/customers/${c.id}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors">
                          {c.name}
                        </Link>
                        <p className="text-xs text-slate-400 font-medium">{c.customerCode}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <a href={`tel:${c.phone}`} className="text-orange-600 font-semibold hover:underline">
                          {c.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">{c.gstin || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-600 font-semibold">{totalOrders} order(s)</td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium">{lastPurchase}</td>
                      <td className={`px-4 py-3.5 font-black ${c.outstandingBalance > 0 ? "text-red-600" : "text-slate-900"}`}>
                        {fmt(c.outstandingBalance)}
                      </td>
                      <td className="relative px-4 py-3.5">
                        <div className="flex items-center">
                          <Link to={`/customers/${c.id}`} className="font-bold text-xs text-orange-600 hover:text-orange-700 px-3 py-1 hover:bg-slate-50 rounded-lg">
                            View
                          </Link>
                          <button 
                            aria-label={`Actions for ${c.name}`} 
                            onClick={() => setMenu(menu === c.id ? "" : c.id)} 
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                          >
                            <MoreVertical size={16}/>
                          </button>
                          {menu === c.id && (
                            <Menu 
                              view={() => nav(`/customers/${c.id}`)} 
                              edit={canUpdate ? () => nav(`/customers/${c.id}/edit`) : undefined} 
                              del={canDelete ? () => setDeleting(c) : undefined}
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

          {/* Mobile Card Layout Viewport */}
          <div className="grid gap-4 md:hidden">
            {visible.map(c => {
              const custOrders = orders.filter(o => o.customerId === c.id && o.status !== "CANCELLED");
              const totalOrders = custOrders.length;
              return (
                <article key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{c.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{c.customerCode} &middot; {c.phone}</p>
                    </div>
                    {canUpdate && (
                      <button 
                        aria-label={`Actions for ${c.name}`} 
                        onClick={() => setMenu(menu === c.id ? "" : c.id)} 
                        className="h-8 w-8 shrink-0 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer border"
                      >
                        <MoreVertical size={16}/>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Outstanding</span>
                      <strong className={`text-sm font-black mt-0.5 block ${c.outstandingBalance > 0 ? "text-red-600" : "text-slate-950"}`}>
                        {fmt(c.outstandingBalance)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Orders</span>
                      <strong className="text-slate-700 text-xs mt-0.5 block font-bold">{totalOrders} order(s)</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Link to={`/customers/${c.id}`} className="flex-1 flex min-h-9 items-center justify-center rounded-xl border text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                      View details
                    </Link>
                    <a href={`tel:${c.phone}`} className="px-4 flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-orange-50 text-xs font-bold text-orange-600 hover:bg-orange-100 cursor-pointer">
                      <Phone size={13}/>
                      Call
                    </a>
                  </div>
                  {menu === c.id && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <Menu 
                        inline 
                        view={() => nav(`/customers/${c.id}`)} 
                        edit={canUpdate ? () => nav(`/customers/${c.id}/edit`) : undefined} 
                        del={canDelete ? () => setDeleting(c) : undefined}
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
        title={`Delete ${deleting?.name}?`} 
        description="This customer may be linked to active sales orders or invoices. This action cannot be undone." 
        confirmLabel={busy ? "Deleting…" : "Delete Customer"} 
        destructive 
        onCancel={() => !busy && setDeleting(null)} 
        onConfirm={remove}
      />
    </div>
  );
}

function Menu({ view, edit, del, inline = false, onClose }: { view: () => void; edit?: () => void; del?: () => void; inline?: boolean; onClose: () => void }) {
  const trigger = (fn?: () => void) => {
    if (fn) fn();
    onClose();
  };

  return (
    <div className={inline ? "grid grid-cols-3 gap-2" : "absolute right-4 top-12 z-20 w-36 rounded-xl border bg-white p-1 shadow-lg border-slate-100 text-left"}>
      <button onClick={() => trigger(view)} className="min-h-9 rounded-lg px-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full cursor-pointer">View</button>
      {edit && <button onClick={() => trigger(edit)} className="min-h-9 rounded-lg px-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full cursor-pointer">Edit</button>}
      {del && <button onClick={() => trigger(del)} className="min-h-9 rounded-lg px-3 text-left text-xs font-semibold text-red-600 hover:bg-slate-50 w-full cursor-pointer">Delete</button>}
    </div>
  );
}
export default CustomerListPage;
