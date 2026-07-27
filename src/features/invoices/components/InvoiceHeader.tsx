import React from "react";
import { Building2 } from "lucide-react";
import { BusinessStatusBadge } from "../../../app/components/common/BusinessStatusBadge";
import type { Invoice } from "../invoice.types";

interface InvoiceHeaderProps {
  invoice: Invoice;
}

export function InvoiceHeader({ invoice }: InvoiceHeaderProps) {
  const isGst = invoice.invoiceType === "GST";

  return (
    <header className="space-y-6">
      {/* Top Header Row: Business Profile & Invoice Title Badge */}
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-6 sm:flex-row sm:items-start">
        {/* Business Information */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 font-black text-white text-xl shadow-xs print:border print:border-slate-300 print:bg-none print:text-black">
            AE
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
              {invoice.businessName || "APNI ESTATE"}
            </h1>
            {invoice.businessAddress && (
              <p className="max-w-md whitespace-pre-line text-xs font-medium text-muted-foreground leading-relaxed">
                {invoice.businessAddress}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground pt-0.5">
              {invoice.businessPhone && <span>Phone: <strong className="text-foreground">{invoice.businessPhone}</strong></span>}
              {isGst && invoice.businessGstin && (
                <span>GSTIN: <strong className="font-mono text-foreground uppercase">{invoice.businessGstin}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Title & Key Meta */}
        <div className="sm:text-right space-y-1.5 shrink-0">
          <div className="flex items-center gap-2 sm:justify-end">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
              isGst ? "bg-blue-50 text-blue-800 border border-blue-200" : "bg-muted text-muted-foreground border border-border"
            }`}>
              {isGst ? "TAX INVOICE" : "BILL OF SUPPLY"}
            </span>
            <BusinessStatusBadge status={invoice.status} />
          </div>

          <p className="font-mono font-black text-base text-foreground tracking-tight">
            {invoice.invoiceNumber || "N/A"}
          </p>

          <div className="text-xs font-semibold text-muted-foreground space-y-0.5">
            <p>Invoice Date: <strong className="text-foreground">{new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</strong></p>
            {invoice.dueDate && (
              <p>Due Date: <strong className="text-foreground">{new Date(invoice.dueDate).toLocaleDateString("en-IN")}</strong></p>
            )}
          </div>
        </div>
      </div>

      {/* Bill To & Supply Location Row */}
      <div className="grid gap-6 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2 text-xs">
        {/* Customer Bill To Details */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
            Billed To (Customer Details)
          </span>
          <p className="font-black text-foreground text-sm">{invoice.customerName || "Valued Customer"}</p>
          {invoice.customerPhone && <p className="font-bold text-muted-foreground">Phone: {invoice.customerPhone}</p>}
          {invoice.billingAddress && (
            <p className="whitespace-pre-line text-muted-foreground leading-relaxed mt-0.5">
              {invoice.billingAddress}
            </p>
          )}
          {isGst && invoice.customerGstin && (
            <p className="font-mono font-extrabold text-foreground uppercase pt-1">
              GSTIN: {invoice.customerGstin}
            </p>
          )}
        </div>

        {/* Delivery & Place of Supply */}
        <div className="space-y-1 sm:text-right">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
            Delivery & Place of Supply
          </span>
          {invoice.deliveryAddress ? (
            <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
              {invoice.deliveryAddress}
            </p>
          ) : (
            <p className="text-muted-foreground italic">Same as Billing Address</p>
          )}
          {invoice.supplyType && (
            <p className="font-bold text-foreground pt-1">
              Supply Type: <span className="uppercase">{invoice.supplyType}</span>
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
