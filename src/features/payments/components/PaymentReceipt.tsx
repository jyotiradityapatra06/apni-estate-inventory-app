import React from "react";
import { Building2, User, FileText, CheckCircle2 } from "lucide-react";
import { fmt } from "../../../utils/currency";
import { BusinessStatusBadge } from "../../../app/components/common/BusinessStatusBadge";

export interface PaymentReceiptData {
  paymentNumber: string;
  paymentDate: string;
  amount: number | string;
  paymentMethod: string;
  referenceNumber?: string | null;
  bankName?: string | null;
  notes?: string | null;
  status: string;
  business?: {
    name?: string;
    address?: string;
    phone?: string;
    gstNumber?: string;
  };
  customer?: {
    name?: string;
    customerCode?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    billingAddress?: string;
  };
  invoice?: {
    invoiceNumber?: string;
    invoiceDate?: string;
    totalAmount?: number | string;
    balanceDue?: number | string;
    status?: string;
  };
  receivedBy?: {
    name?: string;
  };
}

export const PaymentReceipt: React.FC<{ data: PaymentReceiptData }> = ({ data }) => {
  const biz = data.business || {};
  const cust = data.customer || {};
  const inv = data.invoice || {};

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 space-y-6">
      {/* Header & Business Branding */}
      <header className="flex flex-col sm:flex-row justify-between border-b-2 border-slate-900 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="text-orange-600 print:text-foreground" size={28} />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">
              {biz.name || "APNI ESTATE"}
            </h1>
          </div>
          {biz.address && <p className="mt-1 text-xs text-muted-foreground max-w-md leading-relaxed">{biz.address}</p>}
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground font-medium">
            {biz.phone && <span>Phone: {biz.phone}</span>}
            {biz.gstNumber && <span className="font-semibold text-muted-foreground">GSTIN: {biz.gstNumber}</span>}
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
          <span className="inline-block rounded-lg bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 uppercase tracking-widest border border-emerald-200 print:bg-muted print:text-foreground print:border-border">
            OFFICIAL PAYMENT RECEIPT
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-foreground tracking-tight">{data.paymentNumber}</h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Date: {new Date(data.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
          <div className="mt-2 flex justify-start sm:justify-end">
            <BusinessStatusBadge status={data.status} />
          </div>
        </div>
      </header>

      {/* Customer & Payment Summary */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-b border-border text-xs">
        <div className="space-y-2 bg-muted p-4 rounded-xl border border-border print:bg-transparent print:p-0 print:border-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <User size={13} /> Received From Customer
          </span>
          <p className="text-base font-extrabold text-foreground">{cust.name || "Customer Account"}</p>
          {cust.customerCode && <p className="font-semibold text-muted-foreground">Customer Code: {cust.customerCode}</p>}
          {cust.phone && <p className="text-muted-foreground">Phone: {cust.phone}</p>}
          {cust.email && <p className="text-muted-foreground">Email: {cust.email}</p>}
          {cust.gstin && <p className="font-semibold text-foreground uppercase font-mono">GSTIN: {cust.gstin}</p>}
          {cust.billingAddress && <p className="text-muted-foreground mt-1 leading-relaxed">{cust.billingAddress}</p>}
        </div>

        <div className="space-y-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-right print:bg-transparent print:p-0 print:border-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 print:text-muted-foreground block">
            Total Amount Received
          </span>
          <p className="text-3xl font-black text-emerald-700 print:text-foreground">{fmt(data.amount)}</p>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            Payment Mode: <span className="uppercase text-foreground font-black">{data.paymentMethod?.replaceAll("_", " ")}</span>
          </p>
          {data.referenceNumber && <p className="text-muted-foreground">Ref / UTR / Cheque #: {data.referenceNumber}</p>}
          {data.bankName && <p className="text-muted-foreground">Bank: {data.bankName}</p>}
        </div>
      </section>

      {/* Invoice Reference & Settlement Breakdown */}
      {inv && inv.invoiceNumber && (
        <section className="py-4 border-b border-border space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText size={14} /> Settlement Details Against Invoice
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-border rounded-lg">
              <thead className="bg-muted text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="p-3">Invoice Ref</th>
                  <th className="p-3">Invoice Date</th>
                  <th className="p-3 text-right">Invoice Total</th>
                  <th className="p-3 text-right">Amount Received</th>
                  <th className="p-3 text-right">Remaining Balance</th>
                  <th className="p-3 text-center">Invoice Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-foreground">
                <tr>
                  <td className="p-3 font-extrabold text-foreground">{inv.invoiceNumber}</td>
                  <td className="p-3">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="p-3 text-right">{fmt(inv.totalAmount || 0)}</td>
                  <td className="p-3 text-right text-emerald-700 font-extrabold">{fmt(data.amount)}</td>
                  <td className="p-3 text-right text-foreground font-bold">{fmt(inv.balanceDue || 0)}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-black uppercase text-muted-foreground border border-border">
                      {inv.status || "POSTED"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Notes */}
      {data.notes && (
        <section className="py-3 border-b border-border text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Payment Remarks / Notes</span>
          <p className="mt-1 text-muted-foreground font-medium italic">{data.notes}</p>
        </section>
      )}

      {/* Official Signatory Footer */}
      <footer className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs pt-4">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Received By User</span>
          <div className="flex items-center gap-2 text-foreground font-bold">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{data.receivedBy?.name || "System Operator"}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">System generated timestamped payment receipt entry</p>
        </div>

        <div className="text-left sm:text-right space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">For {biz.name || "APNI ESTATE"}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Authorized Signatory</p>
          </div>
          <div className="border-t border-slate-400 w-48 ml-0 sm:ml-auto pt-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Signature / Stamp</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentReceipt;
