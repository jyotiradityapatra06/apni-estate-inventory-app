import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, Pencil, Landmark, Package, Boxes, Layers, Clock, AlertTriangle, ArrowLeftRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { godownApi } from "../../api/godown.api";
import { inventoryApi, type InventoryItemData, type StockTransactionData } from "../../api/inventory.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { QuantityDisplay } from "../../app/components/common/BusinessPrimitives";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { PageHeader } from "../../app/components/common/PageHeader";
import { StatCard } from "../../app/components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import type { Godown } from "../../types/godown.types";
import { hasPermission } from "../../utils/permissions";
import { StockMovementDialog } from "./StockMovementDialog";
import { availableStock, godownAvailable, minimumStock, physicalStock, reservedStock, stockStatus } from "./stockCalculations";
import { fmt } from "../../utils/currency";

const dateTime = (value: string) => new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const friendly = (value?: string | null) => value ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Stock adjustment";

export function MaterialDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [material, setMaterial] = useState<InventoryItemData | null>(null);
  const [transactions, setTransactions] = useState<StockTransactionData[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [movement, setMovement] = useState<"IN" | "OUT" | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "transactions">("overview");

  const canUpdate = hasPermission(user, "inventory:update");
  const canIn = hasPermission(user, "stock:in");
  const canOut = hasPermission(user, "stock:out");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [item, history, godownResponse] = await Promise.all([
        inventoryApi.getItem(id),
        inventoryApi.getTransactions(id),
        godownApi.getAll()
      ]);
      setMaterial(item.data);
      setTransactions(history.data ?? []);
      setGodowns(godownResponse.data.filter((row) => row.isActive));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load this material.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (loading && !material) return <LoadingSkeleton rows={8}/>;
  if (error || !material) return <ErrorState message={error || "Material not found."} onRetry={load}/>;

  const info = [
    ["Category", material.category],
    ["Unit", material.unit],
    ["SKU", material.sku],
    ["Brand", material.brand],
    ["HSN", material.hsnCode],
    ["GST rate", material.taxRate == null ? null : `${material.taxRate}%`],
    ["Purchase price", material.costPrice == null ? null : fmt(material.costPrice)],
    ["Selling price", material.sellingPrice == null ? null : fmt(material.sellingPrice)],
    ["Preferred supplier", material.defaultSupplier?.name]
  ] as Array<[string, React.ReactNode]>;

  // Calculations for summary metrics
  const totalQty = availableStock(material);
  const stockVal = totalQty * (material.costPrice || 0);
  const locationText = material.godownStocks?.map(gs => gs.godown.name).join(", ") || "No warehouse";

  const getTimelineEventTitle = (entry: StockTransactionData) => {
    if (entry.type === "TRANSFER_IN" || entry.type === "TRANSFER_OUT") return "Transfer Completed";
    if (entry.referenceType === "INVOICE") return "Sale Completed";
    if (entry.type === "IN") return "Stock Added";
    return "Adjustment Made";
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* Back button */}
      <button 
        onClick={() => navigate("/materials")} 
        className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer"
      >
        <ArrowLeft size={14}/>
        Back to Materials
      </button>

      {/* Header */}
      <PageHeader 
        title={material.materialName} 
        description={`SKU: ${material.sku} &middot; Category: ${material.category}`} 
        actions={
          <div className="flex items-center gap-2">
            <BusinessStatusBadge status={stockStatus(material)}/>
            {canUpdate && (
              <button 
                onClick={() => navigate(`/materials/${id}/edit`)} 
                className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Pencil size={14}/>
                Edit Material
              </button>
            )}
          </div>
        }
      />

      {/* Summary StatCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Current Stock" value={<QuantityDisplay value={physicalStock(material)} unit={material.unit}/>} helper="Total quantity in hand" icon={Package} />
        <StatCard label="Stock Value" value={fmt(stockVal)} helper="Asset value based on cost price" icon={Landmark} />
        <StatCard label="Location" value={material.godownStocks?.length || 0} helper={locationText} icon={Boxes} />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 -mb-px" aria-label="Tabs">
          {(["overview", "timeline", "transactions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 text-xs font-bold border-b-2 uppercase tracking-wider cursor-pointer ${
                activeTab === tab 
                  ? "border-orange-500 text-orange-600" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab === "timeline" ? "Stock Movement" : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Details Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Material Information</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              {info.filter(([, value]) => value !== null && value !== undefined && value !== "").map(([label, value]) => (
                <div key={label} className="border-b last:border-0 pb-2">
                  <dt className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Godowns list */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Warehouse balances</h3>
            <div className="space-y-4">
              {material.godownStocks?.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-slate-900">{row.godown.name}</span>
                    <BusinessStatusBadge status={godownAvailable(row) <= 0 ? "OUT_OF_STOCK" : godownAvailable(row) <= minimumStock(material) ? "LOW_STOCK" : "IN_STOCK"}/>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                      <strong className="block text-slate-900 mt-0.5"><QuantityDisplay value={row.quantity} unit={material.unit}/></strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Reserved</span>
                      <strong className="block text-slate-900 mt-0.5"><QuantityDisplay value={row.reservedQuantity ?? 0} unit={material.unit}/></strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Available</span>
                      <strong className="block text-slate-900 mt-0.5"><QuantityDisplay value={godownAvailable(row)} unit={material.unit}/></strong>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {canIn && (
                      <button onClick={() => setMovement("IN")} className="flex-1 min-h-[30px] rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                        Stock In
                      </button>
                    )}
                    {canOut && (
                      <button onClick={() => setMovement("OUT")} className="flex-1 min-h-[30px] rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                        Stock Out
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!material.godownStocks?.length && (
                <EmptyState title="No godown balances" description="Add this material to a warehouse to record inventory." />
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm max-w-xl">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3 mb-4">Stock Movement Timeline</h3>
          
          <div className="relative border-l border-slate-100 pl-5 space-y-5">
            {transactions.length > 0 ? (
              transactions.map((entry) => {
                const incoming = ["IN", "TRANSFER_IN"].includes(entry.type);
                const title = getTimelineEventTitle(entry);
                return (
                  <div key={entry.id} className="relative text-xs">
                    {/* Bullet marker */}
                    <div className={`absolute -left-[24.5px] top-0.5 h-2.5 w-2.5 rounded-full border bg-white ${incoming ? "border-green-600" : "border-orange-500"}`} />
                    
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-bold text-slate-950">{title}</p>
                        <p className="text-slate-500 mt-0.5">{entry.godown?.name || "Warehouse not selected"}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{dateTime(entry.createdAt)}</p>
                      </div>
                      <span className={`font-black ${incoming ? "text-green-700" : "text-slate-800"}`}>
                        {incoming ? "+" : "−"}<QuantityDisplay value={entry.quantity} unit={material.unit}/>
                      </span>
                    </div>
                    {entry.note && (
                      <p className="mt-1 bg-slate-50 p-2 rounded-lg text-slate-500 text-[11px] font-medium italic">"{entry.note}"</p>
                    )}
                  </div>
                );
              })
            ) : (
              <EmptyState title="No movement logs" description="Vitals like sales, stock additions, and transfer logs will appear here." />
            )}
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Detailed Transactions</h3>
          
          {!transactions.length ? (
            <EmptyState title="No transactions recorded" description="Stock transactions will appear here." />
          ) : (
            <>
              {/* Mobile Transactions List */}
              <div className="space-y-3 md:hidden">
                {transactions.map((entry) => {
                  const incoming = ["IN", "TRANSFER_IN"].includes(entry.type);
                  return (
                    <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-2">
                      <div className="flex justify-between font-bold">
                        <span>{incoming ? "Stock In" : "Stock Out"}</span>
                        <span className={incoming ? "text-green-700" : "text-slate-800"}>
                          {incoming ? "+" : "−"}<QuantityDisplay value={entry.quantity} unit={material.unit}/>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <div>Warehouse: <span className="text-slate-700">{entry.godown?.name || "—"}</span></div>
                        <div>User: <span className="text-slate-700">{entry.user?.name || "—"}</span></div>
                        <div className="col-span-2">Date: <span className="text-slate-700">{dateTime(entry.createdAt)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b">
                    <tr>
                      <th className="p-3 font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="font-semibold text-slate-500 uppercase tracking-wider">Warehouse</th>
                      <th className="font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                      <th className="font-semibold text-slate-500 uppercase tracking-wider">Reason / Notes</th>
                      <th className="font-semibold text-slate-500 uppercase tracking-wider">User</th>
                      <th className="font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((entry) => (
                      <tr key={entry.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-medium text-slate-900">{dateTime(entry.createdAt)}</td>
                        <td className="font-bold text-slate-900">{["IN", "TRANSFER_IN"].includes(entry.type) ? "Stock In" : "Stock Out"}</td>
                        <td className="text-slate-600 font-medium">{entry.godown?.name ?? "—"}</td>
                        <td className="font-black text-slate-900"><QuantityDisplay value={entry.quantity} unit={material.unit}/></td>
                        <td className="text-slate-500 font-medium italic">"{friendly(entry.reason || entry.note)}"</td>
                        <td className="text-slate-600 font-semibold">{entry.user?.name ?? "—"}</td>
                        <td className="text-slate-500 font-medium">{entry.referenceType ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      <StockMovementDialog 
        open={!!movement} 
        type={movement ?? "IN"} 
        materials={[material]} 
        initialMaterial={material} 
        godowns={godowns} 
        onClose={() => setMovement(null)} 
        onSuccess={load}
      />
    </div>
  );
}
export default MaterialDetailPage;
