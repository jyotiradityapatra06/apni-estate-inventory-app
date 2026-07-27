import { Link, useNavigate } from "react-router";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { MobileDataCard } from "../../app/components/mobile/MobileDataCard";
import { fmt } from "../../utils/currency";
import type { PurchaseOrder } from "./purchase.types";

export function PurchaseTable({ data }: { data: PurchaseOrder[] }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop Table Viewport (>=768px) */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground border-b">
            <tr>
              {["PO Number", "Supplier", "Date", "Amount", "Payment Status", "Order Status", "Actions"].map((x) => (
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground" key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((x) => (
              <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors" key={x.id}>
                <td className="px-4 py-3.5">
                  <Link className="font-bold text-orange-600 hover:text-orange-700 hover:underline" to={`/purchases/${x.id}`}>
                    {x.purchaseOrderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <span className="block font-bold text-foreground">{x.supplierName}</span>
                  <span className="text-xs text-muted-foreground font-medium">{x.supplierPhone}</span>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground font-medium">
                  {new Date(x.orderDate).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3.5 font-black text-foreground">{fmt(x.totalAmount)}</td>
                <td className="px-4 py-3.5">
                  <BusinessStatusBadge status={x.paymentStatus}/>
                </td>
                <td className="px-4 py-3.5">
                  <BusinessStatusBadge status={x.status}/>
                </td>
                <td className="px-4 py-3.5">
                  <Link to={`/purchases/${x.id}`} className="font-bold text-xs text-orange-600 hover:text-orange-700">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Reusable Card Viewport (<768px) */}
      <div className="space-y-3.5 md:hidden">
        {data.map((x) => (
          <MobileDataCard
            key={x.id}
            title={x.purchaseOrderNumber}
            subtitle={`PO Date: ${new Date(x.orderDate).toLocaleDateString("en-IN")}`}
            badge={
              <div className="flex flex-col items-end gap-1">
                <BusinessStatusBadge status={x.status} />
                <BusinessStatusBadge status={x.paymentStatus} />
              </div>
            }
            onClick={() => navigate(`/purchases/${x.id}`)}
            primaryMetric={{
              label: "Total Purchase Amount",
              value: fmt(x.totalAmount),
              helper: x.balanceDue > 0 ? `Balance Due: ${fmt(x.balanceDue)}` : "Fully Paid"
            }}
            secondaryMetrics={[
              { label: "Supplier", value: x.supplierName },
              { label: "Payment Status", value: x.paymentStatus }
            ]}
            metadata={[
              { label: "Supplier Contact", value: x.supplierPhone || "—" }
            ]}
            actions={
              <>
                <button
                  onClick={() => navigate(`/purchases/${x.id}`)}
                  className="flex-1 min-h-[44px] rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer press-active"
                >
                  View PO Details
                </button>
                {x.status !== "RECEIVED" && x.status !== "CANCELLED" && (
                  <button
                    onClick={() => navigate(`/purchases/${x.id}?action=receive`)}
                    className="flex-1 min-h-[44px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs font-bold text-white cursor-pointer press-active"
                  >
                    Receive Stock
                  </button>
                )}
              </>
            }
          />
        ))}
      </div>
    </>
  );
}

export default PurchaseTable;
