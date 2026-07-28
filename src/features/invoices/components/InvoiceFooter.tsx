import React from "react";
import { Link } from "react-router";
import type { Invoice } from "../invoice.types";

interface InvoiceFooterProps {
  invoice: Invoice;
}

/**
 * Converts a number to Indian Rupees words representation.
 * Example: 85000 -> "Eighty Five Thousand Rupees Only"
 */
export function numberToWordsINR(amount: number): string {
  const value = Math.floor(Math.abs(amount || 0));
  if (value === 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
  }

  let num = value;
  let result = "";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore > 0) result += convertLessThanThousand(crore) + " Crore ";
  if (lakh > 0) result += convertLessThanThousand(lakh) + " Lakh ";
  if (thousand > 0) result += convertLessThanThousand(thousand) + " Thousand ";
  if (num > 0) result += convertLessThanThousand(num);

  return `${result.trim()} Rupees Only`;
}

export function InvoiceFooter({ invoice }: InvoiceFooterProps) {
  const amountInWords = numberToWordsINR(invoice.totalAmount);
  const hasPaymentDetails = Boolean(invoice.bankName || invoice.bankAccountNumber || invoice.bankIfscCode || invoice.bankBranch || invoice.businessUpiId);
  const hasTerms = Boolean(invoice.notes || invoice.terms);

  return (
    <footer className="space-y-6 pt-4 border-t border-border">
      {/* Amount in Words Highlight */}
      <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
          Amount in Words
        </span>
        <strong className="text-foreground font-black text-sm block mt-0.5">
          {amountInWords}
        </strong>
      </div>

      {hasPaymentDetails && <div className="text-xs">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="mb-2 block border-b border-border pb-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Payment Information</span>
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {invoice.bankName && <p><strong>Bank:</strong> {invoice.bankName}</p>}
            {invoice.bankAccountNumber && <p><strong>Account:</strong> {invoice.bankAccountNumber}</p>}
            {invoice.bankIfscCode && <p><strong>IFSC:</strong> {invoice.bankIfscCode}</p>}
            {invoice.bankBranch && <p><strong>Branch:</strong> {invoice.bankBranch}</p>}
            {invoice.businessUpiId && <p><strong>UPI:</strong> {invoice.businessUpiId}</p>}
          </div>
        </div>
      </div>}

      {hasTerms && <div className="text-xs">
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block border-b border-border pb-1.5">
            Terms & Notes
          </span>
          {invoice.notes && (
            <p className="text-muted-foreground font-medium">
              <strong className="text-foreground font-bold">Notes:</strong> {invoice.notes}
            </p>
          )}
          {invoice.terms && <p className="text-muted-foreground font-medium whitespace-pre-line leading-relaxed">
            <strong className="text-foreground font-bold">Terms:</strong>{" "}
            {invoice.terms}
          </p>}
        </div>
      </div>}

      {invoice.invoiceFooter && <p className="whitespace-pre-line text-center text-xs font-medium text-muted-foreground">{invoice.invoiceFooter}</p>}

      {/* Bottom References & Authorized Signatory Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-border text-xs text-muted-foreground">
        <div className="space-y-1">
          {invoice.salesOrder && (
            <p>
              Sales Order Ref:{" "}
              <Link
                className="invoice-order-link font-bold text-orange-600 hover:underline"
                to={`/sales-orders/${invoice.salesOrder.id}`}
              >
                {invoice.salesOrder.orderNumber}
              </Link>
            </p>
          )}
          {invoice.payments?.length ? (
            <p className="font-semibold text-foreground">
              Receipt References: {invoice.payments.map((p) => p.paymentNumber).join(", ")}
            </p>
          ) : null}
          <p className="text-[10px] text-muted-foreground italic pt-1">
            This is a computer-generated tax invoice issued by {invoice.businessName || "APNI ESTATE"}.
          </p>
        </div>

        {/* Signatory Box */}
        <div className="sm:text-right pt-6 sm:pt-0">
          <div className="h-12 flex items-end sm:justify-end pb-1">
            <span className="text-[10px] text-muted-foreground italic font-mono">[ Digital Stamp / Signature ]</span>
          </div>
          <p className="font-extrabold text-foreground border-t border-border pt-1">
            For {invoice.businessName || "APNI ESTATE"}
          </p>
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Authorised Signatory
          </span>
        </div>
      </div>
    </footer>
  );
}
