import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Search, FileDown, ArrowLeft } from "lucide-react";
import { purchaseReturnApi } from "../../api/purchaseReturn.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { PageHeader } from "../../app/components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { fmt } from "../../utils/currency";
import { hasPermission } from "../../utils/permissions";

export default function PurchaseReturnsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = hasPermission(user, "purchase-returns:create");

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (search) q.set("returnNumber", search);
    try {
      const response = await purchaseReturnApi.list(q.toString());
      setData(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase returns could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [search, status]);

  const clear = () => {
    setSearch("");
    setStatus("");
  };

  const exportCSV = () => {
    const headers = ["Return Number", "Date", "Purchase Order", "Supplier", "Reason", "Total Amount", "Status"];
    const rows = data.map((x) => [
      x.returnNumber,
      new Date(x.returnDate).toLocaleDateString("en-IN"),
      x.purchaseOrder?.purchaseOrderNumber || "—",
      x.supplier?.name || "—",
      x.reason,
      x.totalAmount,
      x.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `purchase_returns_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Back button */}
      <button 
        onClick={() => navigate("/purchases")} 
        className="flex min-h-9 items-center gap-2 text-xs font-bold text-muted-foreground hover:text-orange-600 cursor-pointer"
      >
        <ArrowLeft size={14}/>
        Back to Purchases
      </button>

      <PageHeader
        title="Purchase Returns"
        description="View and manage purchase returns back to suppliers."
        actions={
          <div className="flex gap-2.5">
            <button
              onClick={exportCSV}
              disabled={!data.length}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground shadow-sm hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
            >
              <FileDown size={14} /> Export CSV
            </button>
            {canManage && (
              <Link
                to="/purchase-returns/new"
                className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 text-xs font-bold text-white hover:bg-orange-700 shadow-sm transition-colors"
              >
                <Plus size={15} /> Create Return
              </Link>
            )}
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <input
              aria-label="Search return number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search return number..."
              className="h-10 w-full rounded-lg border border-border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </label>
          <select
            aria-label="Return status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-lg border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="">All Statuses</option>
            <option>DRAFT</option>
            <option>COMPLETED</option>
            <option>CANCELLED</option>
          </select>
        </div>
        {(search || status) && (
          <button 
            onClick={clear} 
            className="mt-2.5 font-bold text-xs text-muted-foreground hover:bg-muted px-4 h-10 border rounded-lg cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      ) : error ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center space-y-4">
          <h2 className="font-bold text-red-600">Could not load purchase returns</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={load} className="min-h-10 rounded-xl bg-orange-600 px-4 font-bold text-white text-xs hover:bg-orange-700">
            Try Again
          </button>
        </div>
      ) : !data.length ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center space-y-4">
          <h2 className="font-bold">No purchase returns found</h2>
          <p className="text-sm text-muted-foreground">Record a new return or clear filters.</p>
          {canManage && (
            <Link to="/purchase-returns/new" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-orange-600 px-4 font-bold text-white text-xs hover:bg-orange-700 shadow-sm">
              Create Return
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground border-b">
                <tr>
                  {["Return Number", "Date", "Purchase Order", "Supplier", "Total", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((x) => (
                  <tr key={x.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">{x.returnNumber}</td>
                    <td className="px-4 py-3.5 text-muted-foreground font-medium">{new Date(x.returnDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3.5 text-muted-foreground font-semibold">{x.purchaseOrder?.purchaseOrderNumber || "—"}</td>
                    <td className="px-4 py-3.5 font-medium text-muted-foreground">{x.supplier?.name || "—"}</td>
                    <td className="px-4 py-3.5 font-black text-foreground">{fmt(x.totalAmount)}</td>
                    <td className="px-4 py-3.5">
                      <BusinessStatusBadge status={x.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        className="font-bold text-xs text-orange-600 hover:text-orange-700"
                        to={`/purchase-returns/${x.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid gap-4 md:hidden">
            {data.map((x) => (
              <article key={x.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="font-bold text-sm text-foreground">{x.returnNumber}</span>
                    <h4 className="mt-1 text-sm font-bold text-foreground">{x.supplier?.name || "—"}</h4>
                  </div>
                  <BusinessStatusBadge status={x.status} />
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {new Date(x.returnDate).toLocaleDateString("en-IN")} · PO: {x.purchaseOrder?.purchaseOrderNumber || "—"}
                </p>
                <div className="border-t pt-3 flex justify-between items-center border-border">
                  <strong className="text-base font-black text-foreground">{fmt(x.totalAmount)}</strong>
                  <Link
                    to={`/purchase-returns/${x.id}`}
                    className="flex min-h-9 items-center justify-center rounded-xl border px-4 text-xs font-bold text-muted-foreground hover:bg-muted"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
