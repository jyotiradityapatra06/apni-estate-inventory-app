import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, Search, FileDown } from "lucide-react";
import { salesReturnApi } from "../../api/salesReturn.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { PageHeader } from "../../app/components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { fmt } from "../../utils/currency";
import { hasPermission } from "../../utils/permissions";

export default function SalesReturnsPage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, "sales-returns:create");

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
      const response = await salesReturnApi.list(q.toString());
      setData(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sales returns could not be loaded.");
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
    const headers = ["Return Number", "Date", "Invoice", "Customer", "Reason", "Total Amount", "Status"];
    const rows = data.map((x) => [
      x.returnNumber,
      new Date(x.returnDate).toLocaleDateString("en-IN"),
      x.invoice?.invoiceNumber || "—",
      x.customer?.name || "—",
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
    link.setAttribute("download", `sales_returns_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Sales Returns"
        description="View and manage customer sales returns against invoices."
        actions={
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              disabled={!data.length}
              className="flex min-h-12 items-center gap-2 rounded-lg border border-border bg-card px-4 font-semibold text-muted-foreground shadow-sm hover:bg-muted disabled:opacity-50"
            >
              <FileDown size={19} /> Export CSV
            </button>
            {canManage && (
              <Link
                to="/sales-returns/new"
                className="flex min-h-12 items-center gap-2 rounded-lg bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800"
              >
                <Plus size={19} /> Create Return
              </Link>
            )}
          </div>
        }
      />

      <div className="rounded-xl border bg-card p-3">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative md:col-span-2">
            <Search className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
            <input
              aria-label="Search return number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search return number..."
              className="h-12 w-full rounded-lg border pl-10 pr-3"
            />
          </label>
          <select
            aria-label="Return status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-12 rounded-lg border bg-card px-3"
          >
            <option value="">All Statuses</option>
            <option>DRAFT</option>
            <option>COMPLETED</option>
            <option>CANCELLED</option>
          </select>
        </div>
        {(search || status) && (
          <button onClick={clear} className="mt-2 min-h-11 px-3 font-semibold text-blue-700 hover:text-blue-800">
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
      ) : error ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <h2 className="font-bold text-red-600">Could not load sales returns</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button onClick={load} className="mt-4 min-h-11 rounded-lg bg-blue-700 px-4 font-semibold text-white">
            Try Again
          </button>
        </div>
      ) : !data.length ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <h2 className="font-bold">No sales returns found</h2>
          <p className="mt-1 text-sm text-muted-foreground">Record a new return or clear filters.</p>
          {canManage && (
            <Link to="/sales-returns/new" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 font-semibold text-white">
              Create Return
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                <tr>
                  {["Return Number", "Date", "Invoice", "Customer", "Total", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((x) => (
                  <tr key={x.id} className="hover:bg-muted transition-colors">
                    <td className="px-4 py-4 font-bold text-foreground">{x.returnNumber}</td>
                    <td className="px-4 py-4 text-muted-foreground">{new Date(x.returnDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-4 text-muted-foreground">{x.invoice?.invoiceNumber || "—"}</td>
                    <td className="px-4 py-4 font-medium text-muted-foreground">{x.customer?.name || "—"}</td>
                    <td className="px-4 py-4 font-bold text-foreground">{fmt(x.totalAmount)}</td>
                    <td className="px-4 py-4">
                      <BusinessStatusBadge status={x.status} />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        className="inline-flex min-h-11 items-center px-2 font-semibold text-blue-700 hover:text-blue-800"
                        to={`/sales-returns/${x.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {data.map((x) => (
              <article key={x.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold text-blue-700">{x.returnNumber}</p>
                    <h2 className="mt-1 text-sm font-bold text-foreground">{x.customer?.name || "—"}</h2>
                  </div>
                  <BusinessStatusBadge status={x.status} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(x.returnDate).toLocaleDateString("en-IN")} · Invoice: {x.invoice?.invoiceNumber || "—"}
                </p>
                <p className="mt-3 text-lg font-bold text-foreground">{fmt(x.totalAmount)}</p>
                <Link
                  to={`/sales-returns/${x.id}`}
                  className="mt-4 flex min-h-11 items-center justify-center rounded-lg border font-semibold hover:bg-muted"
                >
                  View Details
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
