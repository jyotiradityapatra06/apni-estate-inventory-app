import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { godownApi } from "../../api/godown.api";
import { PageHeader, SectionHeader } from "../../app/components/common/PageHeader";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { useAuth } from "../../hooks/useAuth";
import type { StockTransfer } from "../../types/godown.types";
import { hasPermission } from "../../utils/permissions";
import { Printer } from "lucide-react";

export function TransferDetailPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { user, business } = useAuth();
  const [data, setData] = useState<StockTransfer | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadTransfer = () => {
    godownApi
      .getTransfers()
      .then((r) => {
        const found = r.data.find((t) => t.id === id);
        if (!found) throw new Error("Stock transfer not found.");
        setData(found);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    loadTransfer();
  }, [id]);

  const completeTransfer = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await godownApi.postTransfer(id);
      toast.success("Stock transfer completed successfully.");
      window.dispatchEvent(new Event("notifications:refresh"));
      loadTransfer();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to complete transfer.");
    } finally {
      setBusy(false);
    }
  };

  const cancelTransfer = async () => {
    if (busy) return;
    const reason = prompt("Enter a cancellation reason (optional):");
    if (reason === null) return; // User cancelled prompt
    setBusy(true);
    try {
      await godownApi.cancelTransfer(id);
      toast.success("Stock transfer draft cancelled.");
      loadTransfer();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel transfer.");
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="rounded-xl bg-red-50 p-5 text-red-800" role="alert">{error}</div>;
  if (!data) return <div className="h-64 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Loading Transfer Details" />;

  const canManage = hasPermission(user, "godowns:transfer");

  return (
    <>
      <div className="space-y-5 pb-16">
      <PageHeader
        title={data.transferNumber}
        description="Stock transfer details and audit trail"
        actions={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()} 
              className="flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <Printer size={15} className="mr-1.5" />
              Print Challan
            </button>
            <BusinessStatusBadge status={data.status} />
            {data.status === "DRAFT" && canManage && (
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={cancelTransfer}
                  className="flex min-h-11 items-center justify-center rounded-lg border border-red-200 px-4 font-semibold text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                >
                  Cancel Draft
                </button>
                <button
                  disabled={busy}
                  onClick={completeTransfer}
                  className="flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {busy ? "Processing…" : "Complete Transfer"}
                </button>
              </div>
            )}
          </div>
        }
      />

      <section className="rounded-xl border bg-white p-5">
        <SectionHeader title="Transfer Information" />
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-sm">
          <Row label="From Godown">
            <Link to={`/godowns/${data.sourceGodown.id}`} className="font-bold text-blue-700 hover:underline">
              {data.sourceGodown.name}
            </Link>
            <p className="text-xs text-slate-500">{data.sourceGodown.godownCode}</p>
          </Row>
          <Row label="To Godown">
            <Link to={`/godowns/${data.destinationGodown.id}`} className="font-bold text-blue-700 hover:underline">
              {data.destinationGodown.name}
            </Link>
            <p className="text-xs text-slate-500">{data.destinationGodown.godownCode}</p>
          </Row>
          <Row label="Transfer Date">
            {new Date(data.transferDate || data.createdAt).toLocaleString("en-IN")}
          </Row>
          <Row label="Created By">
            {data.createdBy?.name || "—"}
          </Row>
          {data.completedAt && (
            <Row label="Completed At">
              {new Date(data.completedAt).toLocaleString("en-IN")}
            </Row>
          )}
          {data.cancelledAt && (
            <Row label="Cancelled At">
              {new Date(data.cancelledAt).toLocaleString("en-IN")}
            </Row>
          )}
          {data.cancellationReason && (
            <div className="sm:col-span-2 md:col-span-3">
              <Row label="Cancellation Reason">
                {data.cancellationReason}
              </Row>
            </div>
          )}
          {data.notes && (
            <div className="sm:col-span-2 md:col-span-3">
              <Row label="Notes">
                {data.notes}
              </Row>
            </div>
          )}
        </dl>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <SectionHeader title="Stock Impact" />
        <div className="mt-4 space-y-3">
          {data.items.map((i) => (
            <article key={i.inventoryItem.id} className="rounded-xl border p-4 bg-white">
              <Link to={`/materials/${i.inventoryItem.id}`} className="font-bold text-blue-700 hover:underline">
                {i.inventoryItem.materialName}
              </Link>
              <p className="text-xs text-slate-500">{i.inventoryItem.sku}</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700">{data.sourceGodown.name}</p>
                  <b className="text-red-800">
                    −{i.quantity} {i.inventoryItem.unit}
                  </b>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs font-semibold text-green-700">{data.destinationGodown.name}</p>
                  <b className="text-green-800">
                    +{i.quantity} {i.inventoryItem.unit}
                  </b>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>

      {/* 10. Printable Delivery/Transfer Challan (A4 Print-only template) */}
      <article className="invoice-print-root hidden print:block bg-white p-8 text-xs">
        <header className="flex justify-between border-b pb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{business?.name || "APNI ESTATE"}</h2>
            {business?.address && <p className="max-w-md text-xs text-slate-500 mt-1 leading-relaxed">{business.address}</p>}
            {business?.phone && <p className="text-xs text-slate-500 mt-1">Phone: {business.phone}</p>}
          </div>
          <div className="text-right">
            <h3 className="text-base font-black text-slate-800 tracking-wider uppercase">DELIVERY CHALLAN</h3>
            <p className="font-bold text-sm text-slate-700 mt-1">{data.transferNumber}</p>
            <p className="text-xs text-slate-500 mt-1">Date: {new Date(data.transferDate || data.createdAt).toLocaleDateString("en-IN")}</p>
          </div>
        </header>

        <section className="grid gap-5 border-b py-6 grid-cols-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Source Warehouse (From)</span>
            <p className="font-bold text-slate-900 text-sm mt-1">{data.sourceGodown.name}</p>
            <p className="text-slate-500 mt-0.5">{data.sourceGodown.godownCode}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Destination Warehouse (To)</span>
            <p className="font-bold text-slate-900 text-sm mt-1">{data.destinationGodown.name}</p>
            <p className="text-slate-500 mt-0.5">{data.destinationGodown.godownCode}</p>
          </div>
        </section>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                {["Material Item", "SKU Code", "Quantity", "Unit"].map((v) => (
                  <th key={v} className="p-3 font-semibold text-slate-500 uppercase tracking-wider">{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((i) => (
                <tr key={i.inventoryItem.id} className="border-b last:border-0">
                  <td className="p-3">
                    <span className="block font-bold text-slate-900">{i.inventoryItem.materialName}</span>
                  </td>
                  <td className="text-slate-600 font-medium">{i.inventoryItem.sku}</td>
                  <td className="text-slate-600 font-medium">{i.quantity}</td>
                  <td className="text-slate-500 font-medium">{i.inventoryItem.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-12 flex justify-between text-xs text-slate-500">
          <div>
            <p>Notes: {data.notes || "No special transfer instructions."}</p>
            <p className="mt-1">Prepared By: {data.createdBy?.name || "System"}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-700">Receiver's Signature</p>
          </div>
        </footer>
      </article>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-800">{children}</dd>
    </div>
  );
}
