export interface InvoiceWhatsAppMessageOptions {
  customerName?: string | null;
  businessName?: string | null;
  invoiceNumber?: string | null;
  totalAmount?: number | string | null;
  balanceDue?: number | string | null;
  invoiceLink?: string | null;
}

/**
 * Normalizes an Indian WhatsApp phone number to standard wa.me format (91XXXXXXXXXX).
 * 
 * Rules:
 * - Strips all non-numeric characters.
 * - Handles leading zeros in Indian local format (e.g. 0919876543210, 09876543210).
 * - Prefixes country code 91 for 10-digit Indian numbers.
 * - Returns empty string for invalid/null/undefined/short phone numbers.
 */
export function normalizeWhatsAppNumber(phone?: string | null): string {
  if (!phone) return "";

  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("091") && cleaned.length === 13) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    const mobileDigit = cleaned[2];
    if (["6", "7", "8", "9"].includes(mobileDigit)) {
      return cleaned;
    }
  }

  return "";
}

/**
 * Creates a valid WhatsApp wa.me URL with optional encoded text message.
 * Returns empty string if the phone number is invalid.
 */
export function createWhatsAppLink(phone?: string | null, message?: string | null): string {
  const normalizedPhone = normalizeWhatsAppNumber(phone);
  if (!normalizedPhone) {
    return "";
  }

  if (message && message.trim().length > 0) {
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  }

  return `https://wa.me/${normalizedPhone}`;
}

/**
 * Formats a professional invoice message for WhatsApp sharing with safe fallbacks.
 */
export function formatInvoiceWhatsAppMessage({
  customerName,
  businessName,
  invoiceNumber,
  totalAmount,
  balanceDue,
  invoiceLink,
}: InvoiceWhatsAppMessageOptions): string {
  const name = customerName?.trim() || "Customer";
  const business = businessName?.trim() || "APNI ESTATE";
  const invNo = invoiceNumber?.trim() || "N/A";

  const total = typeof totalAmount === "number"
    ? totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : (totalAmount != null && String(totalAmount).trim() !== "" ? String(totalAmount) : "0");

  const balance = typeof balanceDue === "number"
    ? balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : (balanceDue != null && String(balanceDue).trim() !== "" ? String(balanceDue) : "0");

  const link = invoiceLink?.trim() || "Not available";

  return `Hello ${name},

Your invoice from ${business} is ready.

Invoice No:
${invNo}

Invoice Amount:
₹${total}

Pending Amount:
₹${balance}

You can view your invoice here:
${link}

Thank you for your business.`;
}
