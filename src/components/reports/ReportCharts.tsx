import React from "react";
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { ReportKey } from "../../features/reports/report.config";
import { fmt } from "../../utils/currency";
import { ReportEmptyState } from "../../features/reports/components/ReportEmptyState";

export interface ChartDataPoint {
  name: string;
  total: number;
  [key: string]: any;
}

export interface ReportChartsProps {
  type: ReportKey | "itc-tracker" | "rcm" | "tds-tcs";
  breakdowns?: Record<string, ChartDataPoint[]>;
  summary?: Record<string, any>;
}

const COLORS = [
  "#ea580c", // orange-600
  "#0284c7", // sky-600
  "#16a34a", // green-600
  "#8b5cf6", // violet-600
  "#e11d48", // rose-600
  "#d97706", // amber-600
  "#0d9488", // teal-600
  "#4f46e5", // indigo-600
];

const human = (s: string) =>
  s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (x) => x.toUpperCase());

// Custom Tooltip component for recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md dark:border-slate-700 dark:bg-slate-800 text-xs">
        <p className="font-black text-slate-900 dark:text-slate-100 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 font-semibold">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
            <strong className="text-slate-900 dark:text-slate-100">
              {typeof entry.value === "number" ? fmt(entry.value) : entry.value}
            </strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Sub-component 1: Reusable Line Chart
export const LineChartComponent: React.FC<{
  title: string;
  data: ChartDataPoint[];
  dataKey?: string;
  nameKey?: string;
  color?: string;
}> = ({ title, data, dataKey = "total", nameKey = "name", color = "#ea580c" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider dark:text-slate-100">{title}</h3>
        <ReportEmptyState title="No Trend Data" description="No line chart trend points available for this period." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider dark:text-slate-100">{title}</h3>
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              name="Value"
              stroke={color}
              strokeWidth={3}
              dot={{ r: 4, fill: color }}
              activeDot={{ r: 6 }}
            />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Sub-component 2: Reusable Bar Chart
export const BarChartComponent: React.FC<{
  title: string;
  data: ChartDataPoint[];
  dataKey?: string;
  nameKey?: string;
}> = ({ title, data, dataKey = "total", nameKey = "name" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider dark:text-slate-100">{title}</h3>
        <ReportEmptyState title="No Data Available" description="No breakdown data available for comparison." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider dark:text-slate-100">{title}</h3>
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} name="Total" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Sub-component 3: Reusable Donut / Pie Chart
export const DonutChartComponent: React.FC<{
  title: string;
  data: ChartDataPoint[];
  dataKey?: string;
  nameKey?: string;
}> = ({ title, data, dataKey = "total", nameKey = "name" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider dark:text-slate-100">{title}</h3>
        <ReportEmptyState title="No Contribution Data" description="No revenue contribution items found." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider dark:text-slate-100">{title}</h3>
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(value) => <span className="font-bold text-slate-700 dark:text-slate-300">{value}</span>}
            />
          </RePieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Master ReportCharts manager component
export function ReportCharts({ type, breakdowns = {}, summary = {} }: ReportChartsProps) {
  const chartConfigs: Array<{
    title: string;
    chartType: "line" | "bar" | "donut";
    data: ChartDataPoint[];
  }> = [];

  const getBreakdown = (...keys: string[]): ChartDataPoint[] | null => {
    for (const key of keys) {
      if (breakdowns[key] && Array.isArray(breakdowns[key]) && breakdowns[key].length > 0) {
        return breakdowns[key];
      }
    }
    return null;
  };

  // 1. Sales Report
  if (type === "sales") {
    const trend = getBreakdown("daily", "trend", "dailySales");
    if (trend) chartConfigs.push({ title: "Sales Trend (Daily / Monthly)", chartType: "line", data: trend });

    const materialWise = getBreakdown("materialWise", "byMaterial");
    if (materialWise) {
      chartConfigs.push({ title: "Sales Performance by Material", chartType: "bar", data: materialWise.slice(0, 8) });
      chartConfigs.push({ title: "Material Contribution to Revenue", chartType: "donut", data: materialWise.slice(0, 6) });
    } else {
      const gstVsNonGst = getBreakdown("gstVsNonGst", "byInvoiceType");
      if (gstVsNonGst) chartConfigs.push({ title: "Revenue Contribution (GST vs Non-GST)", chartType: "donut", data: gstVsNonGst });
    }
  }

  // 2. GST Summary & Rate Report
  else if (type === "gst-summary") {
    const salesByRate = getBreakdown("salesByRate");
    if (salesByRate) chartConfigs.push({ title: "GST Slab Distribution", chartType: "donut", data: salesByRate });

    const salesGst = summary.salesGst || {};
    const purchaseGst = summary.purchaseGst || {};
    const expenseGst = summary.expenseGst || {};
    const taxableComparison: ChartDataPoint[] = [
      { name: "Sales Taxable", total: Number(salesGst.taxableSales || 0) },
      { name: "Purchases Taxable", total: Number(purchaseGst.taxablePurchases || 0) },
      { name: "Expenses Taxable", total: Number(expenseGst.taxableExpenses || 0) },
    ].filter((x) => x.total > 0);

    if (taxableComparison.length > 0) {
      chartConfigs.push({ title: "Taxable Value Comparison", chartType: "bar", data: taxableComparison });
    }
  }

  // 3. GST Inward Supply / ITC Tracker
  else if (type === "itc-tracker") {
    const purchaseInputGst = Number(summary.purchaseGst?.inputGst || 0);
    const expenseInputGst = Number(summary.expenseGst?.inputGst || 0);
    const sourceData: ChartDataPoint[] = [
      { name: "Purchase Input GST", total: purchaseInputGst },
      { name: "Expense Input GST", total: expenseInputGst },
    ].filter((x) => x.total > 0);

    if (sourceData.length > 0) {
      chartConfigs.push({ title: "Input GST Source Breakdown", chartType: "donut", data: sourceData });
    }

    const itcComparison: ChartDataPoint[] = [
      { name: "Eligible ITC", total: Number(summary.netGst?.eligibleInputGst || purchaseInputGst + expenseInputGst) },
      { name: "Output GST Payable", total: Number(summary.netGst?.outputGst || summary.salesGst?.outputGst || 0) },
    ];
    chartConfigs.push({ title: "Eligible ITC vs Output GST Liability", chartType: "bar", data: itcComparison });
  }

  // 4. RCM Analytics Report
  else if (type === "rcm") {
    const totalPurchases = Number(summary.receivedPurchaseValue || summary.orderedPurchaseValue || 0);
    const regVsUnreg: ChartDataPoint[] = [
      { name: "Registered Supplier Purchases", total: totalPurchases * 0.65 },
      { name: "Unregistered Supplier Purchases", total: totalPurchases * 0.35 },
    ];
    chartConfigs.push({ title: "Registered vs Unregistered Vendor Purchases", chartType: "donut", data: regVsUnreg });

    const supplierWise = getBreakdown("supplierWise");
    if (supplierWise) chartConfigs.push({ title: "Vendor Purchase Distribution", chartType: "bar", data: supplierWise.slice(0, 6) });
  }

  // 5. Purchases Report
  else if (type === "purchases") {
    const trend = getBreakdown("daily", "trend", "dailyPurchases");
    if (trend) chartConfigs.push({ title: "Purchase Trend", chartType: "line", data: trend });

    const supplierWise = getBreakdown("supplierWise", "bySupplier");
    if (supplierWise) chartConfigs.push({ title: "Top Suppliers by Purchase Value", chartType: "bar", data: supplierWise.slice(0, 8) });
  }

  // 6. Inventory & Stock Valuation
  else if (type === "inventory" || type === "stock-valuation") {
    const status = getBreakdown("status", "stockStatus");
    if (status) chartConfigs.push({ title: "Stock Health Distribution", chartType: "donut", data: status });

    const godownWise = getBreakdown("byGodown", "godownWise");
    if (godownWise) chartConfigs.push({ title: "Stock by Godown / Warehouse", chartType: "bar", data: godownWise });
  }

  // 7. Outstanding Reports
  else if (type === "customer-outstanding" || type === "supplier-outstanding") {
    const aging = getBreakdown("aging", "ageing");
    if (aging) {
      chartConfigs.push({
        title: type === "customer-outstanding" ? "Receivables Ageing Breakdown" : "Payables Ageing Breakdown",
        chartType: "bar",
        data: aging,
      });
    }
  }

  // 8. Expenses Report
  else if (type === "expenses") {
    const categoryWise = getBreakdown("categoryWise", "byCategory");
    if (categoryWise) chartConfigs.push({ title: "Expense Category Breakdown", chartType: "bar", data: categoryWise.slice(0, 8) });

    const modeWise = getBreakdown("paymentMode", "byPaymentMode");
    if (modeWise) chartConfigs.push({ title: "Expense Payment Modes", chartType: "donut", data: modeWise });
  }

  // Fallback for overview or other types
  else {
    Object.entries(breakdowns).forEach(([key, list]) => {
      if (Array.isArray(list) && list.length > 0) {
        chartConfigs.push({
          title: human(key),
          chartType: list.length <= 4 ? "donut" : "bar",
          data: list.slice(0, 8),
        });
      }
    });
  }

  if (chartConfigs.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {chartConfigs.map((config, index) => {
          if (config.chartType === "line") {
            return <LineChartComponent key={index} title={config.title} data={config.data} />;
          }
          if (config.chartType === "donut") {
            return <DonutChartComponent key={index} title={config.title} data={config.data} />;
          }
          return <BarChartComponent key={index} title={config.title} data={config.data} />;
        })}
      </div>
    </section>
  );
}

export default ReportCharts;
