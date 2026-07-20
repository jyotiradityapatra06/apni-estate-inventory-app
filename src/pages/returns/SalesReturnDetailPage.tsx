import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeft, Check, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { salesReturnApi } from "../../api/salesReturn.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { PageHeader } from "../../app/components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { fmt } from "../../utils/currency";
import { hasPermission } from "../../utils/permissions";
import { format } from "date-fns";

export default function SalesReturnDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioning, setActioning] = useState(false);

  const canUpdate = hasPermission(user, "sales-returns:update");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await salesReturnApi.get(id!);
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sales return details could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handlePost = async () => {
    if (!window.confirm("Are you sure you want to complete this sales return? This will update stock levels and customer accounts, and cannot be undone.")) return;
    setActioning(true);
    try {
      await salesReturnApi.post(id!);
      toast.success("Sales return completed successfully.");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to complete sales return.");
    } finally {
      setActioning(false);
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt("Please specify a reason for cancellation:");
    if (reason === null) return; // cancelled prompt
    if (!reason.trim()) return toast.error("Cancellation reason is required.");

    setActioning(true);
    try {
      await salesReturnApi.cancel(id!, reason);
      toast.success("Sales return cancelled successfully.");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel sales return.");
    } finally {
      setActioning(false);
    }
  };

  if (loading) return <div className="h-48 animate-pulse rounded-xl bg-slate-200" />;
  if (error || !data) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-10 text-center">
        <h2 className="font-bold text-red-600">Error Loading Return</h2>
        <p className="mt-1 text-sm text-slate-500">{error || "Sales return not found."}</p>
        <button onClick={() => navigate("/sales-returns")} className="mt-4 min-h-11 rounded-lg border px-4 font-semibold">
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl print:p-0 print:max-w-none">
      <div className="flex justify-between items-center print:hidden">
        <button
          onClick={() => navigate("/sales-returns")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} /> Back to Sales Returns
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex min-h-11 items-center gap-2 rounded-lg border bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer size={18} /> Print Note
          </button>

          {data.status === "DRAFT" && canUpdate && (
            <>
              <button
                onClick={handleCancel}
                disabled={actioning}
                className="flex min-h-11 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 size={18} /> Cancel Draft
              </button>
              <button
                onClick={handlePost}
                disabled={actioning}
                className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                <Check size={18} /> Complete Return
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Return Document */}
      <div className="invoice-print-root rounded-xl border bg-white shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="px-8 py-6 border-b bg-slate-50/50 flex justify-between items-start print:bg-white print:px-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">SALES RETURN NOTE</h2>
            <p className="text-slate-500 mt-1">Return No: {data.returnNumber}</p>
          </div>
          <div className="text-right">
            <BusinessStatusBadge status={data.status} />
            <p className="text-sm text-slate-500 mt-2">
              Date: {format(new Date(data.returnDate), "dd MMM yyyy")}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 p-8 print:px-0">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Customer Details</h4>
            <div className="font-semibold text-slate-800">{data.customer.name}</div>
            <div className="text-slate-600 text-sm mt-1">{data.customer.phone}</div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Invoice References</h4>
            <div className="text-sm text-slate-800">
              Against Invoice:{" "}
              <Link to={`/invoices/${data.invoiceId}`} className="font-semibold text-blue-700 hover:underline print:no-underline print:text-slate-800">
                {data.invoice.invoiceNumber}
              </Link>
            </div>
            <div className="text-sm text-slate-600 mt-1">
              Return Reason: <span className="font-medium text-slate-800">{data.reason}</span>
            </div>
          </div>
        </div>

        {/* Return Items List */}
        <div className="border-t">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b print:bg-white">
                <th className="px-8 py-3">Material</th>
                <th className="px-6 py-3 text-right">Returned Qty</th>
                <th className="px-6 py-3 text-right">Rate</th>
                <th className="px-6 py-3 text-right">GST %</th>
                <th className="px-8 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-4">
                    <div className="font-semibold text-slate-900">{item.inventoryItem.materialName}</div>
                    <div className="text-xs text-slate-500">SKU: {item.inventoryItem.sku} · Destination: {item.godown.name}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {Number(item.quantity)} {item.inventoryItem.unit}
                  </td>
                  <td className="px-6 py-4 text-right">{fmt(item.rate)}</td>
                  <td className="px-6 py-4 text-right">{Number(item.gstRate)}%</td>
                  <td className="px-8 py-4 text-right font-bold text-slate-900">{fmt(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="bg-slate-50/50 p-8 border-t flex justify-end print:bg-white print:px-0">
          <div className="w-64 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-800">{fmt(data.subtotal)}</span>
            </div>
            {Number(data.discountTotal) > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount:</span>
                <span>-{fmt(data.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxable Value:</span>
              <span className="font-medium text-slate-800">{fmt(data.taxableTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Value:</span>
              <span className="font-medium text-slate-800">{fmt(data.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t">
              <span>Refund Amount:</span>
              <span>{fmt(data.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Audit Log / Notes */}
        {(data.notes || data.completedBy || data.cancelledBy) && (
          <div className="border-t p-8 bg-slate-50/30 text-xs text-slate-500 space-y-2 print:px-0">
            {data.notes && (
              <div className="text-sm text-slate-600 mb-2">
                <span className="font-semibold text-slate-700">Notes: </span>
                {data.notes}
              </div>
            )}
            <div>Created By: {data.createdBy.name} on {format(new Date(data.createdAt), "dd MMM yyyy HH:mm")}</div>
            {data.completedBy && (
              <div className="text-green-700 font-medium">
                Completed By: {data.completedBy.name} on {format(new Date(data.completedAt), "dd MMM yyyy HH:mm")}
              </div>
            )}
            {data.cancelledBy && (
              <div className="text-red-700 font-medium">
                Cancelled By: {data.cancelledBy.name} on {format(new Date(data.cancelledAt), "dd MMM yyyy HH:mm")}
                {data.cancellationReason && ` (Reason: ${data.cancellationReason})`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
