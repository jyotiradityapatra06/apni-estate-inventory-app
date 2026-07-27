import React from "react";
import { fmt } from "../../../utils/currency";
import type { Invoice } from "../invoice.types";

interface InvoiceTaxSummaryProps {
  invoice: Invoice;
}

export function InvoiceTaxSummary({ invoice }: InvoiceTaxSummaryProps) {
  const isGst = invoice.invoiceType === "GST";
  const hasCgst = Number(invoice.cgstTotal || 0) > 0;
  const hasSgst = Number(invoice.sgstTotal || 0) > 0;
  const hasIgst = Number(invoice.igstTotal || 0) > 0;

  return (
    <section className="ml-auto w-full max-w-sm rounded-xl border border-border bg-card p-4 text-xs space-y-2 shadow-xs">
      <Row label="Subtotal" value={fmt(invoice.subtotal)} />
      {Number(invoice.discountTotal || 0) > 0 && (
        <Row label="Discount Total" value={`-${fmt(invoice.discountTotal)}`} className="text-emerald-700 font-bold" />
      )}
      <Row label="Taxable Value" value={fmt(invoice.taxableTotal)} className="font-bold text-foreground" />

      {isGst && (
        <>
          {hasCgst && <Row label="CGST (Central Tax)" value={fmt(invoice.cgstTotal)} />}
          {hasSgst && <Row label="SGST (State Tax)" value={fmt(invoice.sgstTotal)} />}
          {hasIgst && <Row label="IGST (Integrated Tax)" value={fmt(invoice.igstTotal)} />}
          {!hasCgst && !hasSgst && !hasIgst && Number(invoice.taxTotal || 0) > 0 && (
            <Row label="Total GST Tax" value={fmt(invoice.taxTotal)} />
          )}
        </>
      )}

      {Number(invoice.roundOff || 0) !== 0 && (
        <Row label="Round Off" value={fmt(invoice.roundOff)} />
      )}

      <div className="border-t border-border pt-2 mt-2">
        <Row
          label="Grand Total"
          value={fmt(invoice.totalAmount)}
          isLarge
          valueClassName="text-orange-600 text-base"
        />
      </div>

      <Row label="Amount Paid" value={fmt(invoice.amountPaid)} className="text-emerald-700 font-bold" />
      <Row
        label="Balance Due"
        value={fmt(invoice.balanceDue)}
        isLarge
        valueClassName={Number(invoice.balanceDue) > 0 ? "text-red-600 text-base" : "text-emerald-700 text-base"}
      />
    </section>
  );
}

function Row({
  label,
  value,
  isLarge = false,
  className = "",
  valueClassName = "",
}: {
  label: string;
  value: string;
  isLarge?: boolean;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-0.5 ${isLarge ? "font-black text-sm text-foreground" : "font-semibold text-muted-foreground"} ${className}`}>
      <span>{label}</span>
      <b className={`font-mono font-black ${valueClassName || "text-foreground"}`}>{value}</b>
    </div>
  );
}
