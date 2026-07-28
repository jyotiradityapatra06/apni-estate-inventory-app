import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MoreVertical, Phone, Plus, Search, Users, DollarSign, UserCheck, ShoppingBag, FilePlus, MessageCircle, BookOpen } from "lucide-react";
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
import { createWhatsAppLink } from "../../utils/whatsapp";

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
            <Link to="/customers/new" className="flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer">
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
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="relative">
            <Search className="absolute left-3.5 top-3 text-muted-foreground" size={18}/>
            <input 
              aria-label="Search customers" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search customer name, phone number, GSTIN or code…" 
              className="h-11 w-full rounded-xl border border-border pl-10 pr-4 text-sm sm:text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-muted-foreground"
            />
          </label>
          <select 
            aria-label="Balance status" 
            value={balance} 
            onChange={e => setBalance(e.target.value)} 
            className="h-11 rounded-xl border border-border bg-card px-3.5 text-xs sm:text-sm font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All Accounts</option>
            <option value="DUE">Outstanding Dues Only</option>
            <option value="CLEAR">No Amount Due (Settled)</option>
          </select>
          {(search || balance !== "ALL") && (
            <button 
              onClick={() => { setSearch(""); setBalance("ALL"); }} 
              className="font-extrabold text-xs text-muted-foreground hover:bg-muted px-4 h-11 border border-border rounded-xl cursor-pointer"
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
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground border-b">
                <tr>
                  {["Customer Name & Code", "Phone & Contact", "GSTIN", "Total Orders", "Last Purchase", "Outstanding Due", "Quick Actions"].map(x => (
                    <th key={x} className="px-4 py-3.5 font-black text-xs uppercase tracking-wider text-muted-foreground">{x}</th>
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
                    <tr key={c.id} className={`transition-colors ${hasDue ? "bg-amber-50/20 hover:bg-amber-50/40" : "hover:bg-muted/60"}`}>
                      <td className="px-4 py-3.5">
                        <Link to={`/customers/${c.id}`} className="font-black text-foreground text-sm sm:text-base hover:text-orange-600 transition-colors block">
                          {c.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-bold uppercase">{c.customerCode}</span>
                          {c.allowCredit === false ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700 uppercase border border-red-200">Credit Blocked</span>
                          ) : c.creditLimit > 0 && c.outstandingBalance > c.creditLimit ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 uppercase border border-amber-300">Limit Exceeded</span>
                          ) : c.creditLimit > 0 ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 uppercase border border-emerald-200">Within Limit</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-orange-600 font-black text-xs sm:text-sm hover:underline">
                          <Phone size={13} />
                          {c.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground font-extrabold text-xs uppercase">{c.gstin || "—"}</td>
                      <td className="px-4 py-3.5 text-muted-foreground font-extrabold text-xs sm:text-sm">{totalOrders} order(s)</td>
                      <td className="px-4 py-3.5 text-muted-foreground font-semibold text-xs">{lastPurchase}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${
                          hasDue ? "bg-red-100 text-red-800 border border-red-200" : "bg-muted text-muted-foreground"
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
                            className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center cursor-pointer ml-1"
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
                <article key={c.id} className={`rounded-2xl border bg-card p-4 shadow-sm space-y-3 ${
                  hasDue ? "border-amber-300/80 bg-amber-50/10" : "border-border"
                }`}>
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <Link to={`/customers/${c.id}`} className="font-black text-foreground text-base leading-tight block hover:text-orange-600">
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground font-bold mt-0.5">{c.customerCode} · {c.phone}</p>
                      {c.gstin && <p className="text-[10px] text-muted-foreground font-extrabold uppercase mt-0.5">GSTIN: {c.gstin}</p>}
                    </div>
                    {canUpdate && (
                      <button 
                        aria-label={`Actions for ${c.name}`} 
                        onClick={() => setMenu(menu === c.id ? "" : c.id)} 
                        className="h-9 w-9 shrink-0 rounded-xl hover:bg-muted flex items-center justify-center cursor-pointer border border-border"
                      >
                        <MoreVertical size={18}/>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-border">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-black">Outstanding Dues</span>
                      <strong className={`text-sm font-black mt-0.5 block ${hasDue ? "text-red-700" : "text-foreground"}`}>
                        {fmt(c.outstandingBalance)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-black">Total Orders</span>
                      <strong className="text-muted-foreground text-xs mt-0.5 block font-extrabold">{totalOrders} order(s)</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <Link
                      to={`/invoices/new?customerId=${c.id}`}
                      className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-2 text-center text-xs font-black text-white hover:bg-orange-700 cursor-pointer press-active"
                    >
                      <FilePlus size={14} />
                      Create Invoice
                    </Link>
                    <Link 
                      to={`/sales-orders/new?customerId=${c.id}`} 
                      className="min-h-[44px] flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-2 text-center text-xs font-black text-orange-800 cursor-pointer press-active"
                    >
                      Create Sales Order
                    </Link>
                    <Link
                      to={`/payments/new?customerId=${c.id}`}
                      className="min-h-[44px] flex items-center justify-center rounded-xl bg-[#0F172A] px-2 text-center text-xs font-black text-white hover:bg-slate-800 cursor-pointer press-active"
                    >
                      Receive Payment
                    </Link>
                    <a
                      href={createWhatsAppLink(c.phone, `Hello ${c.name},` ) || `tel:${c.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2 text-xs font-black text-emerald-800 cursor-pointer press-active"
                    >
                      <MessageCircle size={14} />
                      WhatsApp
                    </a>
                    <Link
                      to={`/financials/ledger?customerId=${c.id}`}
                      className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-2 text-xs font-black text-purple-800 cursor-pointer press-active"
                    >
                      <BookOpen size={14} />
                      Ledger
                    </Link>
                    <a 
                      href={`tel:${c.phone}`} 
                      className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-border px-2 text-xs font-black text-muted-foreground hover:bg-muted cursor-pointer press-active"
                    >
                      <Phone size={14} />
                      Call
                    </a>
                  </div>

                  {menu === c.id && (
                    <div className="mt-2 pt-2 border-t border-border">
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
    <div className={inline ? "grid grid-cols-3 gap-2" : "absolute right-4 top-12 z-20 w-36 rounded-xl border bg-card p-1 shadow-lg border-border text-left"}>
      <button onClick={() => trigger(view)} className="min-h-9 rounded-lg px-3 text-left text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground w-full cursor-pointer">View</button>
      {edit && <button onClick={() => trigger(edit)} className="min-h-9 rounded-lg px-3 text-left text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground w-full cursor-pointer">Edit</button>}
      {del && <button onClick={() => trigger(del)} className="min-h-9 rounded-lg px-3 text-left text-xs font-semibold text-red-600 hover:bg-muted w-full cursor-pointer">Delete</button>}
    </div>
  );
}
export default CustomerListPage;
