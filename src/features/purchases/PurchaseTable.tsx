import { Link } from "react-router";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { fmt } from "../../utils/currency";
import type { PurchaseOrder } from "./purchase.types";

export function PurchaseTable({ data }: { data: PurchaseOrder[] }) {
  return (
    <>
      {/* Desktop Table Viewport */}
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

      {/* Mobile Card Viewport */}
      <div className="grid gap-4 md:hidden">
        {data.map((x) => (
          <Link 
            to={`/purchases/${x.id}`} 
            key={x.id} 
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition-shadow block space-y-3"
          >
            <div className="flex justify-between items-start gap-3">
              <span className="font-bold text-sm text-slate-900">{x.purchaseOrderNumber}</span>
              <BusinessStatusBadge status={x.status}/>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm leading-tight">{x.supplierName}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Date: {new Date(x.orderDate).toLocaleDateString("en-IN")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3 border-slate-100">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Amount</span>
                <strong className="text-slate-950 text-sm mt-0.5 block">{fmt(x.totalAmount)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Payment</span>
                <span className="mt-0.5 block"><BusinessStatusBadge status={x.paymentStatus}/></span>
              </div>
            </div>
            <span className="flex min-h-9 items-center justify-center rounded-xl border text-xs font-bold text-slate-700 hover:bg-slate-50">
              View Details
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
