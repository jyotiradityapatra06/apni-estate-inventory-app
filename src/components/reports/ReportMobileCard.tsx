import { Link } from "react-router";
import type { ReportKey } from "../../features/reports/report.config";
import { fmt } from "../../utils/currency";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";

export interface ReportMobileCardProps {
  type: ReportKey;
  row: Record<string, unknown>;
  source?: string;
}

const human = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, (x) => x.toUpperCase());

export function ReportMobileCard({ type, row, source }: ReportMobileCardProps) {
  const renderCardContent = () => {
    switch (type) {
      case "sales": {
        const customerName = String(row.customerName || "—");
        const invoiceNumber = String(row.invoiceNumber || "—");
        const totalAmount = Number(row.totalAmount || 0);
        const balanceDue = Number(row.balanceDue || 0);
        const invoiceType = String(row.invoiceType || "—");
        const status = String(row.status || "—");

        return (
          <div className="space-y-2.5">
            <div className="flex items-start justify-between border-b border-border pb-2">
              <div>
                <p className="font-extrabold text-foreground text-sm">{customerName}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Inv #: {invoiceNumber}</p>
              </div>
              <BusinessStatusBadge status={status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-muted p-2.5 rounded-xl border border-border font-semibold">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Amount</span>
                <strong className="text-foreground font-black">{fmt(totalAmount)}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Balance Due</span>
                <strong className={balanceDue > 0 ? "text-red-600 font-black" : "text-emerald-700 font-black"}>
                  {fmt(balanceDue)}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground pt-1">
              <span>Type: <strong className="text-muted-foreground uppercase">{invoiceType}</strong></span>
            </div>
          </div>
        );
      }

      case "purchases": {
        const supplierName = String(row.supplierName || "—");
        const poNumber = String(row.purchaseOrderNumber || "—");
        const totalAmount = Number(row.totalAmount || 0);
        const receivedAmount = Number(row.receivedAmount || 0);
        const balanceDue = Number(row.balanceDue || 0);
        const status = String(row.status || "—");

        return (
          <div className="space-y-2.5">
            <div className="flex items-start justify-between border-b border-border pb-2">
              <div>
                <p className="font-extrabold text-foreground text-sm">{supplierName}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">PO #: {poNumber}</p>
              </div>
              <BusinessStatusBadge status={status} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] bg-muted p-2.5 rounded-xl border border-border font-semibold text-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Ordered</span>
                <strong className="text-foreground font-black">{fmt(totalAmount)}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Received</span>
                <strong className="text-emerald-700 font-black">{fmt(receivedAmount)}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Payable</span>
                <strong className={balanceDue > 0 ? "text-red-600 font-black" : "text-muted-foreground font-black"}>
                  {fmt(balanceDue)}
                </strong>
              </div>
            </div>
          </div>
        );
      }

      case "inventory": {
        const materialName = String(row.materialName || "—");
        const sku = String(row.sku || "—");
        const closingQuantity = Number(row.closingQuantity || row.quantity || 0);
        const reorderLevel = Number(row.reorderLevel || 0);
        const stockStatus = String(row.stockStatus || (closingQuantity <= 0 ? "OUT_OF_STOCK" : closingQuantity <= reorderLevel ? "LOW_STOCK" : "IN_STOCK"));

        return (
          <div className="space-y-2.5">
            <div className="flex items-start justify-between border-b border-border pb-2">
              <div>
                <p className="font-extrabold text-foreground text-sm">{materialName}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">SKU: {sku}</p>
              </div>
              <BusinessStatusBadge status={stockStatus} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-muted p-2.5 rounded-xl border border-border font-semibold">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Current Stock</span>
                <strong className="text-foreground font-black text-sm">{closingQuantity} {String(row.unit || "")}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Reorder Level</span>
                <strong className="text-muted-foreground font-bold">{reorderLevel} {String(row.unit || "")}</strong>
              </div>
            </div>
          </div>
        );
      }

      case "customer-outstanding": {
        const name = String(row.name || "—");
        const outstanding = Number(row.outstanding || 0);
        const overdueDays = Number(row.overdueDays || 0);
        const creditStatus = String(row.creditStatus || "OK");

        return (
          <div className="space-y-2.5">
            <div className="flex items-start justify-between border-b border-border pb-2">
              <div>
                <p className="font-extrabold text-foreground text-sm">{name}</p>
                {row.contact && <p className="text-xs text-muted-foreground font-semibold mt-0.5">{String(row.contact)}</p>}
              </div>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                  creditStatus === "OVER_LIMIT" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {creditStatus === "OVER_LIMIT" ? "Limit Exceeded" : "Within Limit"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-muted p-2.5 rounded-xl border border-border font-semibold">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Outstanding Dues</span>
                <strong className="text-red-600 font-black text-sm">{fmt(outstanding)}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Overdue Days</span>
                <strong className={overdueDays > 0 ? "text-amber-700 font-black" : "text-emerald-700 font-bold"}>
                  {overdueDays > 0 ? `${overdueDays} Days` : "Current"}
                </strong>
              </div>
            </div>
          </div>
        );
      }

      case "supplier-outstanding": {
        const name = String(row.name || "—");
        const outstanding = Number(row.outstanding || 0);
        const overdueDays = Number(row.overdueDays || 0);

        return (
          <div className="space-y-2.5">
            <div className="flex items-start justify-between border-b border-border pb-2">
              <div>
                <p className="font-extrabold text-foreground text-sm">{name}</p>
                {row.contact && <p className="text-xs text-muted-foreground font-semibold mt-0.5">{String(row.contact)}</p>}
              </div>
              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-black uppercase text-muted-foreground border border-border">
                Supplier Payable
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-muted p-2.5 rounded-xl border border-border font-semibold">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Payable Balance</span>
                <strong className="text-foreground font-black text-sm">{fmt(outstanding)}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Ageing</span>
                <strong className={overdueDays > 0 ? "text-amber-700 font-black" : "text-emerald-700 font-bold"}>
                  {overdueDays > 0 ? `${overdueDays} Days Overdue` : "Current"}
                </strong>
              </div>
            </div>
          </div>
        );
      }

      case "expenses": {
        const category = typeof row.category === "object" && row.category !== null ? (row.category as any).name : String(row.category || "—");
        const totalAmount = Number(row.totalAmount || 0);
        const paymentStatus = String(row.paymentStatus || "—");
        const paymentMode = String(row.paymentMode || "Unspecified");

        return (
          <div className="space-y-2.5">
            <div className="flex items-start justify-between border-b border-border pb-2">
              <div>
                <p className="font-extrabold text-foreground text-sm">{category}</p>
                {row.expenseNumber && <p className="text-xs text-muted-foreground font-semibold mt-0.5">Exp #: {String(row.expenseNumber)}</p>}
              </div>
              <BusinessStatusBadge status={paymentStatus} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-muted p-2.5 rounded-xl border border-border font-semibold">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Amount</span>
                <strong className="text-foreground font-black text-sm">{fmt(totalAmount)}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Payment Mode</span>
                <strong className="text-muted-foreground font-bold uppercase">{paymentMode}</strong>
              </div>
            </div>
          </div>
        );
      }

      default: {
        // Fallback for general reports (e.g. overview, gst-summary, profit-loss, stock-valuation)
        const keys = Object.keys(row).filter((k) => k !== "id" && typeof row[k] !== "object").slice(0, 6);
        return (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k} className="flex justify-between items-center gap-3 py-1 border-b last:border-0 border-border font-semibold text-xs">
                <span className="text-muted-foreground uppercase text-[10px] font-black">{human(k)}</span>
                <strong className="text-right text-foreground font-black">{String(row[k] ?? "—")}</strong>
              </div>
            ))}
          </div>
        );
      }
    }
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-xs text-xs space-y-3">
      {renderCardContent()}
      {source && (
        <Link
          to={source}
          className="mt-2 flex min-h-[42px] items-center justify-center rounded-xl border border-border text-xs font-extrabold text-muted-foreground hover:bg-muted transition-colors"
        >
          View Source Records →
        </Link>
      )}
    </article>
  );
}

export default ReportMobileCard;
