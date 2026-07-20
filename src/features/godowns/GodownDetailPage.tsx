import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { godownApi } from "../../api/godown.api";
import { inventoryApi, type StockTransactionData } from "../../api/inventory.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { useAuth } from "../../hooks/useAuth";
import type { Godown } from "../../types/godown.types";
import { hasPermission } from "../../utils/permissions";
import { stockStatus } from "../materials/stockCalculations";
import { StatCard } from "../../app/components/common/Card";
import { ArrowLeft, ArrowLeftRight, Pencil, Warehouse, Landmark, ShieldAlert, AlertTriangle } from "lucide-react";

export function GodownDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Godown | null>(null);
  const [tx, setTx] = useState<StockTransactionData[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([godownApi.getById(id), inventoryApi.getAllTransactions()])
      .then(([g, t]) => {
        setData(g.data);
        setTx((t.data || []).filter((x) => x.godown?.id === id));
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="rounded-xl bg-red-50 p-5 text-red-800" role="alert">{error}</div>;
  if (!data) return <div className="h-64 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Loading Godown details" />;

  const rows = data.stockBalances;
  const state = (b: typeof rows[number]) =>
    stockStatus({
      quantity: b.quantity,
      minimumStockLevel: b.inventoryItem.minimumStockLevel || 0,
      godownStocks: [b],
    });

  // Calculate stats
  const totalQty = rows.reduce((sum, b) => sum + b.quantity, 0);

  // Format full address
  const addressParts = [
    data.address,
    data.city,
    data.state,
    data.pincode ? `PIN: ${data.pincode}` : "",
  ].filter(Boolean);
  const fullAddress = addressParts.join(", ");

  return (
    <div className="space-y-6 pb-16">
      {/* Back button */}
      <button 
        onClick={() => navigate("/godowns")} 
        className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer"
      >
        <ArrowLeft size={14}/>
        Back to Godowns
      </button>

      <PageHeader
        title={data.name}
        description={`Code: ${data.godownCode}${data.isDefault ? " (Default Warehouse)" : ""}`}
        actions={
          <div className="flex gap-2">
            {hasPermission(user, "godowns:transfer") && (
              <Link
                to={`/transfers/new?from=${data.id}`}
                className="flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <ArrowLeftRight size={14} className="mr-1.5" />
                Transfer Stock
              </Link>
            )}
            {hasPermission(user, "godowns:update") && (
              <Link
                to={`/godowns/${data.id}/edit`}
                className="flex min-h-10 items-center justify-center rounded-xl bg-orange-600 px-4 text-xs font-bold text-white hover:bg-orange-700 shadow-sm transition-colors"
              >
                <Pencil size={13} className="mr-1.5" />
                Edit
              </Link>
            )}
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Materials Stored" value={rows.filter((b) => b.quantity > 0).length} icon={Warehouse} />
        <StatCard label="Total Quantity" value={totalQty.toLocaleString("en-IN")} icon={Warehouse} />
        <StatCard label="Low Stock Count" value={rows.filter((b) => state(b) === "LOW_STOCK").length} icon={ShieldAlert} />
        <StatCard label="Out of Stock Items" value={rows.filter((b) => state(b) === "OUT_OF_STOCK").length} icon={AlertTriangle} />
      </div>

      {/* Godown Info card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Location & Contact Details</h3>
        <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-sm">
          <div className="border-b last:border-0 pb-2">
            <dt className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address</dt>
            <dd className="mt-1 font-semibold text-slate-800">{fullAddress || "—"}</dd>
          </div>
          <div className="border-b last:border-0 pb-2">
            <dt className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Person</dt>
            <dd className="mt-1 font-semibold text-slate-800">{data.contactPerson || "—"}</dd>
          </div>
          <div className="border-b last:border-0 pb-2">
            <dt className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</dt>
            <dd className="mt-1 font-semibold text-slate-800">{data.phone || "—"}</dd>
          </div>
          {data.notes && (
            <div className="sm:col-span-2 md:col-span-3 border-b last:border-0 pb-2">
              <dt className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Internal Notes</dt>
              <dd className="mt-1 font-semibold text-slate-800 italic">"{data.notes}"</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Stock list */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Available Stock in warehouse</h3>
        
        {/* Desktop list */}
        <div className="hidden overflow-hidden rounded-xl border border-slate-100 md:block">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                {["Material", "Physical", "Reserved", "Available", "Minimum Level", "Status"].map((x) => (
                  <th key={x} className="p-3 font-semibold text-slate-500 uppercase tracking-wider">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="p-3">
                    <Link to={`/materials/${b.inventoryItem.id}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors">
                      {b.inventoryItem.materialName}
                    </Link>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{b.inventoryItem.sku}</p>
                  </td>
                  <td className="text-slate-600 font-medium">
                    {b.quantity} {b.inventoryItem.unit}
                  </td>
                  <td className="text-slate-500 font-medium">
                    {b.reservedQuantity} {b.inventoryItem.unit}
                  </td>
                  <td className="font-black text-slate-900">
                    {Math.max(0, b.quantity - b.reservedQuantity)} {b.inventoryItem.unit}
                  </td>
                  <td className="text-slate-500 font-medium">
                    {b.inventoryItem.minimumStockLevel || 0} {b.inventoryItem.unit}
                  </td>
                  <td>
                    <BusinessStatusBadge status={state(b)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="grid gap-3 md:hidden">
          {rows.map((b) => (
            <article key={b.id} className="rounded-xl border p-4 bg-slate-50/50 space-y-2 text-xs">
              <Link to={`/materials/${b.inventoryItem.id}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors">
                {b.inventoryItem.materialName}
              </Link>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{b.inventoryItem.sku}</p>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Available</span>
                <b className="text-sm font-black text-slate-900">
                  {Math.max(0, b.quantity - b.reservedQuantity)} {b.inventoryItem.unit}
                </b>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Physical {b.quantity} &middot; Reserved {b.reservedQuantity} &middot; Min {b.inventoryItem.minimumStockLevel || 0}
              </p>
              <div className="pt-1">
                <BusinessStatusBadge status={state(b)} />
              </div>
            </article>
          ))}
        </div>
        {!rows.length && <p className="py-8 text-center text-slate-400 text-xs">No materials stored in this warehouse.</p>}
      </section>

      {/* Recent activity */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Warehouse Activity Logs</h3>
        <div className="space-y-3">
          {tx.slice(0, 10).map((x) => {
            const incoming = !["OUT", "TRANSFER_OUT"].includes(x.type);
            return (
              <div key={x.id} className="flex justify-between gap-3 rounded-xl bg-slate-50/50 border border-slate-100 p-3 text-xs">
                <div>
                  <b className="text-slate-900 font-bold uppercase tracking-wide">{x.type.replaceAll("_", " ")}</b>
                  <p className="text-slate-600 font-medium mt-0.5">{x.inventoryItem?.materialName}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    {x.reason || "Warehouse transaction"} &middot; {new Date(x.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <b className={`font-black text-sm ${incoming ? "text-green-700" : "text-slate-800"}`}>
                  {incoming ? "+" : "−"}
                  {x.quantity} {x.inventoryItem?.unit}
                </b>
              </div>
            );
          })}
          {!tx.length && <p className="py-5 text-center text-slate-400 text-xs">No recent transaction logs in this warehouse.</p>}
        </div>
      </section>
    </div>
  );
}
export default GodownDetailPage;
