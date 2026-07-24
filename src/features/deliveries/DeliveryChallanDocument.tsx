import React from "react";
import { Printer, Truck, MapPin, User, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { formatQuantity } from "../../utils/currency";

interface DeliveryChallanDocumentProps {
  delivery: any;
  business?: {
    name?: string;
    gstNumber?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
}

export const DeliveryChallanDocument: React.FC<DeliveryChallanDocumentProps> = ({ delivery, business }) => {
  if (!delivery) return null;

  const handlePrint = () => {
    window.print();
  };

  const challanNo = delivery.challanNumber || null;
  const isChallanGenerated = !!challanNo;

  const formattedDate = new Date(delivery.scheduledDate || delivery.createdAt || Date.now()).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

  return (
    <div className="space-y-4">
      {/* Action Header (Hidden on Print) */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Delivery Challan (DC)</h3>
            <p className="text-xs text-slate-500">
              {isChallanGenerated ? (
                <span className="font-bold text-green-700">Official Challan: {challanNo}</span>
              ) : (
                <span className="font-semibold text-amber-600">Challan not generated yet</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-4 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          <Printer size={15} />
          <span>Print Challan</span>
        </button>
      </div>

      {/* Printable Document Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#F97316]">
              APNI ESTATE Material Store
            </p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              {business?.name || "APNI ESTATE Building Supplies"}
            </h1>
            {business?.gstNumber && (
              <p className="text-xs text-slate-500 font-semibold mt-1">
                GSTIN: <span className="font-mono text-slate-800">{business.gstNumber}</span>
              </p>
            )}
            {business?.address && (
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm leading-relaxed">
                {business.address}
              </p>
            )}
            {business?.phone && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Phone: {business.phone}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 w-full sm:w-auto">
            <span className="inline-block rounded-lg bg-[#0F172A] px-3 py-1 text-xs font-black text-white uppercase tracking-wider mb-2">
              DELIVERY CHALLAN
            </span>

            <div className="space-y-1 text-xs">
              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-400 font-bold">Challan No:</span>
                {isChallanGenerated ? (
                  <span className="font-black text-slate-900 font-mono">{challanNo}</span>
                ) : (
                  <span className="font-bold text-amber-600 italic">Challan not generated yet</span>
                )}
              </div>

              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-400 font-bold">Delivery Ref:</span>
                <span className="font-bold text-slate-700 font-mono">{delivery.deliveryNumber}</span>
              </div>

              {delivery.salesOrder?.orderNumber && (
                <div className="flex sm:justify-end gap-2">
                  <span className="text-slate-400 font-bold">Sales Order:</span>
                  <span className="font-bold text-slate-700 font-mono">{delivery.salesOrder.orderNumber}</span>
                </div>
              )}

              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-400 font-bold">Date:</span>
                <span className="font-bold text-slate-900">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Site Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Customer / Billed To */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 mb-2">
              <User size={14} className="text-[#F97316]" />
              <span>Customer Details</span>
            </div>
            <strong className="text-sm font-bold text-slate-900 block">
              {delivery.customerName || delivery.customer?.name}
            </strong>
            {(delivery.customerPhone || delivery.customer?.phone) && (
              <p className="text-xs text-slate-600">Phone: {delivery.customerPhone || delivery.customer?.phone}</p>
            )}
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              {delivery.customer?.billingAddress || delivery.deliveryAddress || "Address on record"}
            </p>
          </div>

          {/* Delivery Site / Shipping Address */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 mb-2">
              <MapPin size={14} className="text-[#F97316]" />
              <span>Delivery Site Address</span>
            </div>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              {delivery.deliveryAddress || "Site address specified on order"}
            </p>
            {delivery.receiverName && (
              <p className="text-xs text-slate-600 mt-2">
                Site Receiver: <span className="font-bold text-slate-900">{delivery.receiverName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Logistics & Vehicle Information */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 mb-2">
            <Truck size={14} className="text-[#F97316]" />
            <span>Transport & Logistics Assignment</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Vehicle No.</span>
              <strong className="font-mono text-slate-900 text-sm">
                {delivery.vehicleNumber || "Pending Assignment"}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Vehicle Type</span>
              <strong className="font-bold text-slate-800">
                {delivery.vehicleType || "-"}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Driver Name</span>
              <strong className="font-bold text-slate-800">
                {delivery.driverName || "-"}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Driver Phone</span>
              <strong className="font-bold text-slate-800">
                {delivery.driverPhone || "-"}
              </strong>
            </div>
          </div>
        </div>

        {/* Items Manifest Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Material Dispatch Manifest
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F172A] text-white text-[11px] uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Material & SKU</th>
                  <th className="py-2.5 px-3">Godown</th>
                  <th className="py-2.5 px-3 text-right">Planned Qty</th>
                  <th className="py-2.5 px-3 text-right">Dispatched Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {delivery.items && delivery.items.length > 0 ? (
                  delivery.items.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <strong className="font-bold text-slate-900 block">{item.materialName}</strong>
                        {item.sku && <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {item.godown?.name || delivery.godown?.name || "Central Store"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatQuantity(item.plannedQuantity || item.quantity, item.unit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-green-700 font-bold">
                        {formatQuantity(item.dispatchedQuantity || item.plannedQuantity, item.unit)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">1</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{delivery.materialName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{delivery.godown?.name || "Central Store"}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatQuantity(delivery.quantity, delivery.unit)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-green-700 font-bold">{formatQuantity(delivery.quantity, delivery.unit)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delivery Notes if available */}
        {delivery.notes && (
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
            <span className="font-bold text-slate-700 block mb-0.5">Special Instructions / Notes:</span>
            <p className="text-slate-600">{delivery.notes}</p>
          </div>
        )}

        {/* Footer & Signatures */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-center font-bold">
          <div className="space-y-12">
            <div className="border-b border-slate-300 pb-1 mx-auto max-w-[200px]" />
            <p className="text-slate-600 uppercase text-[10px] tracking-wider">
              Receiver's Signature & Stamp
            </p>
          </div>

          <div className="space-y-12">
            <div className="border-b border-slate-300 pb-1 mx-auto max-w-[200px]" />
            <p className="text-slate-600 uppercase text-[10px] tracking-wider">
              Authorized Signatory ({business?.name || "APNI ESTATE"})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
