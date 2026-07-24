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
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              {["PO Number", "Supplier", "Date", "Amount", "Payment Status", "Order Status", "Actions"].map((x) => (
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500" key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((x) => (
              <tr className="border-b last:border-0 hover:bg-slate-50/50 transition-colors" key={x.id}>
                <td className="px-4 py-3.5">
                  <Link className="font-bold text-orange-600 hover:text-orange-700 hover:underline" to={`/purchases/${x.id}`}>
                    {x.purchaseOrderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <span className="block font-bold text-slate-900">{x.supplierName}</span>
                  <span className="text-xs text-slate-400 font-medium">{x.supplierPhone}</span>
                </td>
                <td className="px-4 py-3.5 text-slate-600 font-medium">
                  {new Date(x.orderDate).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3.5 font-black text-slate-950">{fmt(x.totalAmount)}</td>
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
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
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
