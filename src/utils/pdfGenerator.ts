import html2pdf from "html2pdf.js";
import type { Invoice } from "../features/invoices/invoice.types";

/**
 * Generates and triggers an automatic browser download of a professional A4 PDF invoice
 * using the rendered .invoice-print-root DOM element.
 * 
 * Filename format: APNI-ESTATE-{invoiceNumber}.pdf
 */
export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  const element = document.querySelector(".invoice-print-root");

  if (!element) {
    throw new Error("Invoice DOM element (.invoice-print-root) not found");
  }

  const rawNumber = invoice?.invoiceNumber || "Invoice";
  const sanitizedInvoiceNumber = rawNumber.replace(/[\/\\?%*:|"<>]/g, "-").trim();
  const filename = `APNI-ESTATE-${sanitizedInvoiceNumber}.pdf`;

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
  };

  await html2pdf().set(opt).from(element as HTMLElement).save();
}
