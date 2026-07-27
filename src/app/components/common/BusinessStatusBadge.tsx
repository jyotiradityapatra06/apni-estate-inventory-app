const styles: Record<string, string> = {
  DRAFT: "bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-300",
  PENDING: "bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-300",
  READY: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300",
  CONFIRMED: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300",
  READY_FOR_DISPATCH: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300",
  DISPATCHED: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300",
  ISSUED: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300",
  OUT_FOR_DELIVERY: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300",
  PARTIAL: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
  PARTIALLY_INVOICED: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
  PARTIALLY_DELIVERED: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
  PARTIALLY_PAID: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
  INVOICED: "bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300",
  DELIVERED: "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300",
  FULFILLED: "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300",
  PAID: "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300",
  POSTED: "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300",
  COMPLETED: "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300",
  CANCELLED: "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300",
  REVERSED: "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300",
  LOW_STOCK: "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300",
  OUT_OF_STOCK: "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300",
  IN_STOCK: "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300",
  FULLY_RESERVED: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300",
};

export function BusinessStatusBadge({ status }: { status?: string }) {
  const value = (status || "UNKNOWN").toUpperCase();
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold ${
        styles[value] || "bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-300"
      }`}
    >
      {value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}
