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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18}/>
            <input 
              aria-label="Search customers" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search customer name, phone number, GSTIN or code…" 
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm sm:text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
            />
          </label>
          <select 
            aria-label="Balance status" 
            value={balance} 
            onChange={e => setBalance(e.target.value)} 
            className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All Accounts</option>
            <option value="DUE">Outstanding Dues Only</option>
            <option value="CLEAR">No Amount Due (Settled)</option>
          </select>
          {(search || balance !== "ALL") && (
            <button 
              onClick={() => { setSearch(""); setBalance("ALL"); }} 
              className="font-extrabold text-xs text-slate-700 hover:bg-slate-50 px-4 h-11 border border-slate-200 rounded-xl cursor-pointer"
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
              <Link to="/customers/new" className="flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 text-xs sm:text-sm font-extrabold text-white transition-colors cursor-pointer">
                + Add First Customer
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table Viewport (>=768px) */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  {["Customer Name & Code", "Phone & Contact", "GSTIN", "Total Orders", "Last Purchase", "Outstanding Due", "Quick Actions"].map(x => (
                    <th key={x} className="px-4 py-3.5 font-black text-xs uppercase tracking-wider text-slate-500">{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map(c => {
                  const custOrders = orders.filter(o => o.customerId === c.id && o.status !== "CANCELLED");
                  const totalOrders = custOrders.length;
                  const lastPurchase = custOrders.length > 0 
                    ? new Date(Math.max(...custOrders.map(o => new Date(o.orderDate).getTime()))).toLocaleDateString("en-IN") 
                    : "—";
                  const hasDue = c.outstandingBalance > 0;

                  return (
                    <tr key={c.id} className={`transition-colors ${hasDue ? "bg-amber-50/20 hover:bg-amber-50/40" : "hover:bg-slate-50/60"}`}>
                      <td className="px-4 py-3.5">
                        <Link to={`/customers/${c.id}`} className="font-black text-slate-900 text-sm sm:text-base hover:text-orange-600 transition-colors block">
                          {c.name}
                        </Link>
                        <p className="text-xs text-slate-400 font-bold uppercase">{c.customerCode}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-orange-600 font-black text-xs sm:text-sm hover:underline">
                          <Phone size={13} />
                          {c.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-extrabold text-xs uppercase">{c.gstin || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-700 font-extrabold text-xs sm:text-sm">{totalOrders} order(s)</td>
                      <td className="px-4 py-3.5 text-slate-500 font-semibold text-xs">{lastPurchase}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${
                          hasDue ? "bg-red-100 text-red-800 border border-red-200" : "bg-slate-100 text-slate-700"
                        }`}>
                          {fmt(c.outstandingBalance)}
                        </span>
                      </td>
                      <td className="relative px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link 
                            to={`/sales-orders/new?customerId=${c.id}`} 
                            className="font-extrabold text-xs text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                          >
                            + Sale
                          </Link>
                          {hasDue && (
                            <Link 
                              to={`/payments/new?customerId=${c.id}`} 
                              className="font-extrabold text-xs text-white bg-[#0F172A] hover:bg-slate-800 px-2.5 py-1.5 rounded-lg shadow-xs transition-colors"
                            >
                              Receive
                            </Link>
                          )}
                          <button 
                            aria-label={`Actions for ${c.name}`} 
                            onClick={() => setMenu(menu === c.id ? "" : c.id)} 
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer ml-1"
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

          {/* Mobile Card Layout Viewport (<768px) */}
          <div className="grid gap-4 md:hidden">
            {visible.map(c => {
              const custOrders = orders.filter(o => o.customerId === c.id && o.status !== "CANCELLED");
              const totalOrders = custOrders.length;
              const hasDue = c.outstandingBalance > 0;

              return (
                <article key={c.id} className={`rounded-2xl border bg-white p-4 shadow-sm space-y-3 ${
                  hasDue ? "border-amber-300/80 bg-amber-50/10" : "border-slate-200"
                }`}>
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <Link to={`/customers/${c.id}`} className="font-black text-slate-900 text-base leading-tight block hover:text-orange-600">
                        {c.name}
                      </Link>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">{c.customerCode} &middot; {c.phone}</p>
                      {c.gstin && <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">GSTIN: {c.gstin}</p>}
                    </div>
                    {canUpdate && (
                      <button 
                        aria-label={`Actions for ${c.name}`} 
                        onClick={() => setMenu(menu === c.id ? "" : c.id)} 
                        className="h-9 w-9 shrink-0 rounded-xl hover:bg-slate-100 flex items-center justify-center cursor-pointer border border-slate-200"
                      >
                        <MoreVertical size={18}/>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-black">Outstanding Dues</span>
                      <strong className={`text-sm font-black mt-0.5 block ${hasDue ? "text-red-700" : "text-slate-950"}`}>
                        {fmt(c.outstandingBalance)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-black">Total Orders</span>
                      <strong className="text-slate-700 text-xs mt-0.5 block font-extrabold">{totalOrders} order(s)</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <Link 
                      to={`/sales-orders/new?customerId=${c.id}`} 
                      className="flex-1 min-h-[44px] flex items-center justify-center rounded-xl bg-orange-600 text-xs font-black text-white hover:bg-orange-700 cursor-pointer press-active"
                    >
                      + Create Sale
                    </Link>
                    {hasDue && (
                      <Link 
                        to={`/payments/new?customerId=${c.id}`} 
                        className="min-h-[44px] px-3.5 flex items-center justify-center rounded-xl bg-[#0F172A] text-xs font-black text-white hover:bg-slate-800 cursor-pointer press-active"
                      >
                        Receive
                      </Link>
                    )}
                    <a 
                      href={`tel:${c.phone}`} 
                      className="px-3.5 min-h-[44px] flex items-center justify-center gap-1 rounded-xl border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
                    >
                      <Phone size={14} />
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
