import { Prisma } from "@prisma/client";
import { calculateTaxLine, money, TaxLineInput } from "./gstCalculation.service";

export interface InvoiceCalculationLine extends TaxLineInput {
  key: string;
}

export const calculateInvoice = (lines: InvoiceCalculationLine[], roundToRupee = false) => {
  const calculatedLines = lines.map((line) => ({ key: line.key, ...calculateTaxLine(line) }));
  const sum = (field: keyof (typeof calculatedLines)[number]) => calculatedLines.reduce(
    (total, line) => total.plus(line[field] instanceof Prisma.Decimal ? line[field] as Prisma.Decimal : 0),
    new Prisma.Decimal(0)
  );
  const subtotal = money(sum("grossAmount"));
  const discountTotal = money(sum("discountAmount"));
  const taxableTotal = money(sum("taxableAmount"));
  const cgstTotal = money(sum("cgstAmount"));
  const sgstTotal = money(sum("sgstAmount"));
  const igstTotal = money(sum("igstAmount"));
  const taxTotal = money(cgstTotal.plus(sgstTotal).plus(igstTotal));
  const beforeRoundOff = money(taxableTotal.plus(taxTotal));
  const roundedTotal = roundToRupee ? beforeRoundOff.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP) : beforeRoundOff;
  const roundOff = money(roundedTotal.minus(beforeRoundOff));
  const totalAmount = money(beforeRoundOff.plus(roundOff));
  return { calculatedLines, subtotal, discountTotal, taxableTotal, cgstTotal, sgstTotal, igstTotal, taxTotal, roundOff, totalAmount };
};
