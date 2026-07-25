import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { ReportKey } from "../../features/reports/report.config";
import { fmt } from "../../utils/currency";

export interface ReportChartsProps {
  type: ReportKey;
  breakdowns?: Record<string, Array<{ name: string; total: number }>>;
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

export function ReportCharts({ type, breakdowns = {} }: ReportChartsProps) {
  const chartConfigs: Array<{
    title: string;
    chartType: "line" | "bar" | "pie";
    data: Array<{ name: string; total: number }>;
  }> = [];

  const getBreakdown = (...keys: string[]) => {
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
    if (trend) {
      chartConfigs.push({ title: "Sales Trend", chartType: "line", data: trend });
    }

    const gstVsNonGst = getBreakdown("byInvoiceType", "gstVsNonGst", "salesByRate");
    if (gstVsNonGst) {
      chartConfigs.push({ title: "GST vs Non-GST Invoices", chartType: "pie", data: gstVsNonGst });
    }

    const customerWise = getBreakdown("byCustomer", "customerWise", "topCustomers");
    if (customerWise) {
      chartConfigs.push({ title: "Top Customers by Revenue", chartType: "bar", data: customerWise.slice(0, 8) });
    }
  }

  // 2. Purchases Report
  else if (type === "purchases") {
    const trend = getBreakdown("daily", "trend", "dailyPurchases");
    if (trend) {
      chartConfigs.push({ title: "Purchase Trend", chartType: "line", data: trend });
    }

    const supplierWise = getBreakdown("bySupplier", "supplierWise", "topSuppliers");
    if (supplierWise) {
      chartConfigs.push({ title: "Top Suppliers by Purchase Value", chartType: "bar", data: supplierWise.slice(0, 8) });
    }
  }

  // 3. Inventory & Stock Valuation
  else if (type === "inventory" || type === "stock-valuation") {
    const status = getBreakdown("status", "stockStatus", "health");
    if (status) {
      chartConfigs.push({ title: "Stock Health Distribution", chartType: "pie", data: status });
    }

    const byGodown = getBreakdown("byGodown", "godownWise");
    if (byGodown) {
      chartConfigs.push({ title: "Stock by Godown / Warehouse", chartType: "bar", data: byGodown });
    }
  }

  // 4. Customer Outstanding & Supplier Outstanding
  else if (type === "customer-outstanding" || type === "supplier-outstanding") {
    const aging = getBreakdown("aging", "ageing", "agingBuckets");
    if (aging) {
      chartConfigs.push({
        title: type === "customer-outstanding" ? "Receivables Ageing Breakdown" : "Payables Ageing Breakdown",
        chartType: "bar",
        data: aging,
      });
    }
  }

  // 5. Expenses Report
  else if (type === "expenses") {
    const categoryWise = getBreakdown("byCategory", "categoryWise", "expenseCategories");
    if (categoryWise) {
      chartConfigs.push({ title: "Expense Category Breakdown", chartType: "bar", data: categoryWise.slice(0, 8) });
    }

    const modeWise = getBreakdown("byPaymentMode", "paymentModes");
    if (modeWise) {
      chartConfigs.push({ title: "Expense Payment Modes", chartType: "pie", data: modeWise });
    }
  }

  // General fallback for overview or gst-summary
  else {
    Object.entries(breakdowns).forEach(([key, list]) => {
      if (Array.isArray(list) && list.length > 0) {
        chartConfigs.push({
          title: human(key),
          chartType: list.length <= 4 ? "pie" : "bar",
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
        {chartConfigs.map((config, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider dark:text-slate-100">
              {config.title}
            </h3>

            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                {config.chartType === "line" ? (
                  <LineChart data={config.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) => [fmt(val), "Amount"]}
                      contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid #cbd5e1" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#ea580c"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#ea580c" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : config.chartType === "pie" ? (
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={config.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="total"
                      nameKey="name"
                    >
                      {config.data.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [fmt(val), "Total"]}
                      contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid #cbd5e1" }}
                    />
                  </PieChart>
                ) : (
                  <BarChart data={config.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) => [fmt(val), "Total"]}
                      contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid #cbd5e1" }}
                    />
                    <Bar dataKey="total" fill="#ea580c" radius={[6, 6, 0, 0]}>
                      {config.data.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ReportCharts;
