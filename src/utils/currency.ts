export type NumericValue = number | string | null | undefined;

const numeric = (value: NumericValue) => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const fmt = (value: NumericValue): string => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2,
}).format(numeric(value));

export const fmtK = (value: NumericValue): string => {
  const amount = numeric(value);
  const symbol = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).formatToParts(0).find((part) => part.type === "currency")?.value ?? "INR ";
  if (Math.abs(amount) >= 10_000_000) return `${symbol}${(amount / 10_000_000).toFixed(1)} Cr`;
  if (Math.abs(amount) >= 100_000) return `${symbol}${(amount / 100_000).toFixed(1)} L`;
  if (Math.abs(amount) >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)} K`;
  return fmt(amount);
};

export const formatQuantity = (value: NumericValue, unit?: string) => {
  const text = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(numeric(value));
  return unit ? `${text} ${unit}` : text;
};
