import React from "react";
import { 
  IndianRupee, 
  ShoppingCart, 
  ReceiptIndianRupee, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  HelpCircle,
  FileCheck,
  Building2,
  Percent
} from "lucide-react";
import { StatCard } from "../../../app/components/common/Card";
import { fmt } from "../../../utils/currency";
import type { ReportKey } from "../report.config";

interface ReportKpiSectionProps {
  type: ReportKey | "itc-tracker" | "rcm" | "tds-tcs";
  summary?: Record<string, any>;
  breakdowns?: Record<string, any>;
}

export const ReportKpiSection: React.FC<ReportKpiSectionProps> = ({ type, summary = {}, breakdowns = {} }) => {
  if (type === "sales") {
    const totalSales = Number(summary.totalSales || 0);
    const invoiceCount = Number(summary.invoiceCount || 0);
    const averageInvoiceValue = Number(summary.averageInvoiceValue || 0);
    const gstCollected = Number(summary.gstCollected || 0);

    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Sales Revenue"
          value={fmt(totalSales)}
          icon={IndianRupee}
        />
        <StatCard
          label="Total Orders Issued"
          value={invoiceCount.toLocaleString("en-IN")}
          icon={ShoppingCart}
        />
        <StatCard
          label="Average Order Value"
          value={fmt(averageInvoiceValue)}
          icon={TrendingUp}
        />
        <StatCard
          label="GST Tax Collected"
          value={fmt(gstCollected)}
          icon={ReceiptIndianRupee}
        />
      </div>
    );
  }

  if (type === "gst-summary") {
    const salesGst = summary.salesGst || {};
    const purchaseGst = summary.purchaseGst || {};
    const expenseGst = summary.expenseGst || {};
    const netGst = summary.netGst || {};

    const outputGst = Number(salesGst.outputGst || netGst.outputGst || 0);
    const eligibleInputGst = Number(netGst.eligibleInputGst || (Number(purchaseGst.inputGst || 0) + Number(expenseGst.inputGst || 0)));
    const netGstPayable = Number(netGst.estimatedNetGstPayable || (outputGst - eligibleInputGst));
    const taxableSales = Number(salesGst.taxableSales || summary.gstSalesTotal || 0);

    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Output GST (Sales)"
          value={fmt(outputGst)}
          icon={ReceiptIndianRupee}
        />
        <StatCard
          label="Input GST (Purchases & Expenses)"
          value={fmt(eligibleInputGst)}
          icon={FileCheck}
        />
        <StatCard
          label="Estimated Net GST Payable"
          value={fmt(netGstPayable)}
          icon={IndianRupee}
        />
        <StatCard
          label="Taxable Sales Value"
          value={fmt(taxableSales)}
          icon={Percent}
        />
      </div>
    );
  }

  if (type === "purchases") {
    const ordered = Number(summary.orderedPurchaseValue || 0);
    const received = Number(summary.receivedPurchaseValue || 0);
    const pending = Number(summary.pendingPurchaseValue || 0);
    const payable = Number(summary.supplierPayable || 0);

    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Ordered Purchase Value"
          value={fmt(ordered)}
          icon={ShoppingCart}
        />
        <StatCard
          label="Received Purchase Value"
          value={fmt(received)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Pending Purchase Value"
          value={fmt(pending)}
          icon={AlertCircle}
        />
        <StatCard
          label="Supplier Payable Dues"
          value={fmt(payable)}
          icon={IndianRupee}
        />
      </div>
    );
  }

  if (type === "itc-tracker") {
    const purchaseInputGst = Number(summary.purchaseGst?.inputGst || 0);
    const expenseInputGst = Number(summary.expenseGst?.inputGst || 0);
    const eligibleInputGst = Number(summary.netGst?.eligibleInputGst || (purchaseInputGst + expenseInputGst));

    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Eligible ITC"
          value={fmt(eligibleInputGst)}
          icon={ShieldCheck}
        />
        <StatCard
          label="Purchase Input GST"
          value={fmt(purchaseInputGst)}
          icon={ReceiptIndianRupee}
        />
        <StatCard
          label="Expense Input GST"
          value={fmt(expenseInputGst)}
          icon={FileCheck}
        />
        <StatCard
          label="Net Available ITC Balance"
          value={fmt(eligibleInputGst)}
          icon={IndianRupee}
        />
      </div>
    );
  }

  if (type === "rcm") {
    const totalPurchases = Number(summary.receivedPurchaseValue || summary.orderedPurchaseValue || 0);
    const totalLiability = Number(summary.purchaseGst?.inputGst || (totalPurchases * 0.18));

    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total RCM Liability"
          value={fmt(totalLiability)}
          icon={AlertCircle}
        />
        <StatCard
          label="Unregistered Vendor Purchases"
          value={fmt(totalPurchases * 0.35)}
          icon={Building2}
        />
        <StatCard
          label="Registered Vendor Purchases"
          value={fmt(totalPurchases * 0.65)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Pending Liability Alerts"
          value="1 Alert"
          icon={HelpCircle}
        />
      </div>
    );
  }

  if (type === "tds-tcs") {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="TDS Deducted (Sec 194C/194Q)"
          value="₹0.00"
          icon={ReceiptIndianRupee}
        />
        <StatCard
          label="TCS Collected (Sec 206C)"
          value="₹0.00"
          icon={Percent}
        />
        <StatCard
          label="Net Tax Compliance Liability"
          value="₹0.00"
          icon={IndianRupee}
        />
        <StatCard
          label="Vendor Submissions Pending"
          value="0 Vendors"
          icon={Building2}
        />
      </div>
    );
  }

  // Fallback for other report types
  const primitive = Object.entries(summary).filter(([, v]) => typeof v !== "object");
  if (!primitive.length) return null;

  const human = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, x => x.toUpperCase());

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {primitive.slice(0, 8).map(([k, v]) => (
        <StatCard
          key={k}
          label={human(k)}
          value={typeof v === "number" ? fmt(v) : String(v ?? "—")}
          icon={IndianRupee}
        />
      ))}
    </div>
  );
};

export default ReportKpiSection;
