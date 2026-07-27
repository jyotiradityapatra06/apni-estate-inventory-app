import React from "react";
import { InvoiceHeader } from "./InvoiceHeader";
import { InvoiceItemsTable } from "./InvoiceItemsTable";
import { InvoiceTaxSummary } from "./InvoiceTaxSummary";
import { InvoiceFooter } from "./InvoiceFooter";
import type { Invoice } from "../invoice.types";

interface ProfessionalInvoiceProps {
  invoice: Invoice;
}

export function ProfessionalInvoice({ invoice }: ProfessionalInvoiceProps) {
  const isGst = invoice.invoiceType === "GST";

  return (
    <article className="invoice-print-root rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white print:rounded-none">
      <InvoiceHeader invoice={invoice} />
      <InvoiceItemsTable items={invoice.items || []} isGst={isGst} />
      <InvoiceTaxSummary invoice={invoice} />
      <InvoiceFooter invoice={invoice} />
    </article>
  );
}
