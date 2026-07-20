import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError";

type DecimalInput = string | number | Prisma.Decimal;

const decimal = (value: DecimalInput | null | undefined) => new Prisma.Decimal(value ?? 0);
export const money = (value: DecimalInput) => decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
export const quantityDecimal = (value: DecimalInput) => decimal(value).toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP);
export const rateDecimal = (value: DecimalInput) => decimal(value).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

export interface TaxLineInput {
  quantity: DecimalInput;
  rate: DecimalInput;
  discountRate?: DecimalInput;
  gstRate?: DecimalInput;
  invoiceType: "GST" | "NON_GST";
  sellerStateCode?: string | null;
  placeOfSupplyCode?: string | null;
}

export const calculateTaxLine = (input: TaxLineInput) => {
  const quantity = quantityDecimal(input.quantity);
  const rate = rateDecimal(input.rate);
  const discountRate = decimal(input.discountRate).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
  const configuredGstRate = decimal(input.gstRate).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
  if (quantity.lte(0)) throw new ApiError(400, "Quantity must be greater than zero.");
  if (rate.lt(0)) throw new ApiError(400, "Rate cannot be negative.");
  if (discountRate.lt(0) || discountRate.gt(100)) throw new ApiError(400, "Discount rate must be between 0 and 100.");
  if (configuredGstRate.lt(0) || configuredGstRate.gt(100)) throw new ApiError(400, "GST rate must be between 0 and 100.");

  const grossAmount = money(quantity.mul(rate));
  const discountAmount = money(grossAmount.mul(discountRate).div(100));
  const taxableAmount = money(grossAmount.minus(discountAmount));
  const gstRate = input.invoiceType === "GST" ? configuredGstRate : decimal(0);

  let supplyType: "INTRA_STATE" | "INTER_STATE" | null = null;
  let cgstRate = decimal(0);
  let sgstRate = decimal(0);
  let igstRate = decimal(0);
  if (input.invoiceType === "GST") {
    if (!input.sellerStateCode || !input.placeOfSupplyCode) {
      throw new ApiError(400, "Seller state code and place of supply are required for a GST document.");
    }
    supplyType = input.sellerStateCode === input.placeOfSupplyCode ? "INTRA_STATE" : "INTER_STATE";
    if (supplyType === "INTRA_STATE") {
      cgstRate = gstRate.div(2);
      sgstRate = gstRate.div(2);
    } else {
      igstRate = gstRate;
    }
  }

  const cgstAmount = money(taxableAmount.mul(cgstRate).div(100));
  const sgstAmount = money(taxableAmount.mul(sgstRate).div(100));
  const igstAmount = money(taxableAmount.mul(igstRate).div(100));
  const lineTotal = money(taxableAmount.plus(cgstAmount).plus(sgstAmount).plus(igstAmount));

  return {
    quantity, rate, grossAmount, discountRate, discountAmount, taxableAmount,
    gstRate, cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount,
    lineTotal, supplyType,
  };
};

export const stateCodeFromGstin = (gstin?: string | null) => {
  const normalized = gstin?.trim().toUpperCase();
  return normalized && /^\d{2}/.test(normalized) ? normalized.slice(0, 2) : null;
};
