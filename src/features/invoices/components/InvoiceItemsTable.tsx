import React from "react";
import { fmt, formatQuantity } from "../../../utils/currency";
import type { InvoiceItem } from "../invoice.types";

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  isGst: boolean;
}

export function InvoiceItemsTable({ items, isGst }: InvoiceItemsTableProps) {
  return (
    <div className="space-y-4">
      {/* Desktop Table View (>=640px) */}
      <div className="hidden overflow-hidden rounded-xl border border-border sm:block">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted text-muted-foreground border-b border-border font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Item Description</th>
              <th className="p-3">HSN/SAC</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3 text-right">Rate</th>
              <th className="p-3 text-right">Taxable Value</th>
              {isGst && <th className="p-3 text-center">GST %</th>}
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-muted/50 transition-colors">
                <td className="p-3 text-muted-foreground font-semibold">{idx + 1}</td>
                <td className="p-3">
                  <span className="block font-bold text-foreground">{item.materialName}</span>
                  {item.sku && <span className="text-[10px] text-muted-foreground font-mono">{item.sku}</span>}
                </td>
                <td className="p-3 font-mono text-muted-foreground">{isGst ? item.hsnCode || "—" : "—"}</td>
                <td className="p-3 text-right font-semibold text-foreground">
                  {formatQuantity(item.quantity, item.unit)}
                </td>
                <td className="p-3 text-right text-muted-foreground">{fmt(item.rate)}</td>
                <td className="p-3 text-right font-semibold text-foreground">{fmt(item.taxableAmount)}</td>
                {isGst && (
                  <td className="p-3 text-center">
                    <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                      {item.gstRate}%
                    </span>
                  </td>
                )}
                <td className="p-3 text-right font-black text-foreground">{fmt(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View (<640px) */}
      <div className="space-y-3 sm:hidden">
        {items.map((item, idx) => (
          <div key={item.id || idx} className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-black text-foreground text-sm block">{item.materialName}</span>
                {item.sku && <span className="text-[10px] text-muted-foreground font-mono">{item.sku}</span>}
              </div>
              <strong className="font-black text-foreground text-sm">{fmt(item.lineTotal)}</strong>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-muted-foreground border-t border-border/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Qty & Rate</span>
                <span className="font-semibold text-foreground">
                  {formatQuantity(item.quantity, item.unit)} &times; {fmt(item.rate)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  {isGst ? `HSN (${item.hsnCode || "—"}) · GST` : "Taxable"}
                </span>
                <span className="font-bold text-foreground">
                  {isGst ? `${item.gstRate}% (${fmt(item.taxableAmount)})` : fmt(item.taxableAmount)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
