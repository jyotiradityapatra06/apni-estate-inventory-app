const styles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700", PENDING: "bg-slate-100 text-slate-700",
  READY: "bg-blue-100 text-blue-800", CONFIRMED: "bg-blue-100 text-blue-800", READY_FOR_DISPATCH: "bg-blue-100 text-blue-800",
  DISPATCHED: "bg-indigo-100 text-indigo-800", ISSUED: "bg-indigo-100 text-indigo-800", OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
  PARTIAL: "bg-amber-100 text-amber-800", PARTIALLY_INVOICED: "bg-amber-100 text-amber-800", PARTIALLY_DELIVERED: "bg-amber-100 text-amber-800", PARTIALLY_PAID: "bg-amber-100 text-amber-800",
  INVOICED: "bg-violet-100 text-violet-800", DELIVERED: "bg-green-100 text-green-800", FULFILLED: "bg-green-100 text-green-800", PAID: "bg-green-100 text-green-800", POSTED: "bg-green-100 text-green-800", COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800", REVERSED: "bg-red-100 text-red-800",
  LOW_STOCK: "bg-amber-100 text-amber-900", OUT_OF_STOCK: "bg-red-100 text-red-800",
  IN_STOCK: "bg-green-100 text-green-800", FULLY_RESERVED: "bg-indigo-100 text-indigo-800",
};
export function BusinessStatusBadge({ status }: { status?: string }) {
  const value = (status || "UNKNOWN").toUpperCase();
  return <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold ${styles[value] || "bg-slate-100 text-slate-700"}`}>{value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>;
}
