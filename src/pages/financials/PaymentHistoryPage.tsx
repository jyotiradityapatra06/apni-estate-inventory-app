import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { financialApi } from "../../api/financial.api";
import { purchaseApi } from "../../api/purchase.api";
import { expenseApi } from "../../api/expense.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { SupplierPaymentReversalDialog } from "../../features/purchases/SupplierPaymentReversalDialog";
import { MobileDataCard } from "../../app/components/mobile/MobileDataCard";
import { MobileFilterDrawer } from "../../app/components/mobile/MobileFilterDrawer";
import { useAuth } from "../../hooks/useAuth";
import { fmt } from "../../utils/currency";
import { hasPermission } from "../../utils/permissions";
import { StatCard } from "../../app/components/common/Card";
import { ArrowDownLeft, ArrowUpRight, DollarSign, Landmark, Plus, CreditCard, Receipt, BarChart3, AlertCircle, Filter } from "lucide-react";
import { EmptyState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";

export default function PaymentHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = hasPermission(user, "financials:manage");

  const [data, setData] = useState<any[]>([]);
  const [receivablesSum, setReceivablesSum] = useState(0);
  const [payablesSum, setPayablesSum] = useState(0);
  const [expensesSum, setExpensesSum] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [party, setParty] = useState("");
  const [mode, setMode] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftParty, setDraftParty] = useState("");
  const [draftMode, setDraftMode] = useState("");

  const [reversing, setReversing] = useState<any>();
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    const q = new URLSearchParams();
    if (party) q.set("partyType", party);
    if (mode) q.set("paymentMode", mode);

    try {
      const [paymentsRes, receivablesRes, payablesRes, expensesRes] = await Promise.all([
        financialApi.payments(q.toString()),
        financialApi.receivables().catch(() => ({ data: { summary: { totalReceivable: 0 } } })),
        financialApi.payables().catch(() => ({ data: { summary: { totalPayable: 0 } } })),
        expenseApi.summary().catch(() => ({ data: { totalPaid: 0 } }))
      ]);

      setData(paymentsRes.data || []);
      setReceivablesSum(receivablesRes.data?.summary?.totalReceivable || 0);
      setPayablesSum(payablesRes.data?.summary?.totalPayable || 0);
      setExpensesSum(expensesRes.data?.totalPaid || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Financial data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [party, mode]);

  const reverse = async (reason: string) => {
    if (!reversing || busy) return;
    setBusy(true);
    try {
      await purchaseApi.reversePayment(reversing.purchaseOrderId, reversing.id, reason);
      toast.success("Supplier payment reversed");
      setReversing(undefined);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment could not be reversed.");
    } finally {
      setBusy(false);
    }
  };

  // Finance metrics calculations
  const moneyReceived = data
    .filter((p) => p.partyType === "CUSTOMER" && p.status !== "REVERSED")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const moneyPaid = data
    .filter((p) => p.partyType === "SUPPLIER" && p.status !== "REVERSED")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const estimatedProfit = moneyReceived - moneyPaid - expensesSum;

  const activeFilterCount = [party, mode].filter(Boolean).length;

  const filtersPanel = (
    <div className="space-y-3">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Party Category
        <select 
          className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" 
          value={draftParty} 
          onChange={e => setDraftParty(e.target.value)}
        >
          <option value="">All customers and suppliers</option>
          <option value="CUSTOMER">Customers Only</option>
          <option value="SUPPLIER">Suppliers Only</option>
        </select>
      </label>

      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Payment Mode
        <select 
          className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" 
          value={draftMode} 
          onChange={e => setDraftMode(e.target.value)}
        >
          <option value="">All payment modes</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK">Bank Transfer</option>
          <option value="CHEQUE">Cheque</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Quick Actions */}
      <PageHeader 
        title="Finance Management" 
        description="Track payments, outstanding balances, expenses, and business performance" 
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {canManage && (
              <button 
                onClick={() => navigate("/payments/new")} 
                className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={15}/>
                Receive Payment
              </button>
            )}
            {canManage && (
              <button 
                onClick={() => navigate("/purchases")} 
                className="flex min-h-10 items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={15}/>
                Pay Supplier
              </button>
            )}
            {hasPermission(user, "expenses:manage") && (
              <button 
                onClick={() => navigate("/expenses/new")} 
                className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Plus size={14}/>
                Add Expense
              </button>
            )}
          </div>
        }
      />

      {/* 2. Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Receivables" value={fmt(receivablesSum)} helper="Customer outstandings" icon={Landmark} />
        <StatCard label="Total Payables" value={fmt(payablesSum)} helper="Supplier outstandings" icon={Landmark} className={payablesSum > 0 ? "border-red-200 bg-red-50/20" : ""} />
        <StatCard label="Money Received" value={fmt(moneyReceived)} helper="Customer collections" icon={ArrowDownLeft} />
        <StatCard label="Money Paid" value={fmt(moneyPaid)} helper="Paid to suppliers" icon={ArrowUpRight} />
        <StatCard label="Expenses" value={fmt(expensesSum)} helper="Business overheads" icon={Receipt} />
        <StatCard label="Estimated Profit" value={fmt(estimatedProfit)} helper="Income less payouts" icon={BarChart3} className={estimatedProfit < 0 ? "border-red-200 bg-red-50/20" : "border-green-200 bg-green-50/20"} />
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Transaction Filters</span>
          <button 
            onClick={() => { setDraftParty(party); setDraftMode(mode); setFilterOpen(true); }} 
            className="flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer shrink-0"
          >
            <Filter size={14}/>
            Filter Logs
            {activeFilterCount > 0 && <span className="rounded-full bg-orange-600 px-1.5 py-0.5 text-[9px] text-white">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Desktop Filter Panel (>=768px) */}
        <div className="hidden md:flex md:flex-wrap md:gap-3 border-t pt-3">
          <select 
            className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" 
            value={party} 
            onChange={e => setParty(e.target.value)}
            aria-label="Filter by Customer or Supplier"
          >
            <option value="">All customers and suppliers</option>
            <option value="CUSTOMER">Customers</option>
            <option value="SUPPLIER">Suppliers</option>
          </select>
          <select 
            className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" 
            value={mode} 
            onChange={e => setMode(e.target.value)}
            aria-label="Filter by Payment Mode"
          >
            <option value="">All payment modes</option>
            <option value="CASH">CASH</option>
            <option value="UPI">UPI</option>
            <option value="BANK">BANK</option>
            <option value="CHEQUE">CHEQUE</option>
            <option value="OTHER">OTHER</option>
          </select>
          {(party || mode) && (
            <button 
              onClick={() => { setParty(""); setMode(""); }} 
              className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 5. Payment Transaction Timeline */}
      {loading ? (
        <LoadingSkeleton rows={4}/>
      ) : error ? (
        <EmptyState title="Could not load financial logs" description={error} action={<button onClick={load} className="rounded-xl bg-orange-600 text-white px-4 py-2 font-semibold">Retry</button>} />
      ) : !data.length ? (
        <EmptyState 
          title="No payments recorded yet" 
          description="Recorded customer receipts and supplier payments will appear here." 
          icon={AlertCircle} 
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b pb-3">Financial Transaction Timeline</h3>
          
          {/* Desktop List (>=768px) */}
          <div className="hidden md:block space-y-3">
            {data.map((x) => {
              const incoming = x.partyType === "CUSTOMER";
              return (
                <article key={`${x.partyType}-${x.id}`} className="rounded-xl bg-slate-50/50 border border-slate-100 p-4 flex flex-row items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-950 text-sm">
                        {incoming ? "Payment received from" : "Payment made to"} {x.party?.name}
                      </strong>
                      {x.status === "REVERSED" && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          REVERSED
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 font-medium">{x.type} &middot; Reference: {x.reference || "N/A"} &middot; Mode: {x.paymentMode}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(x.date).toLocaleDateString("en-IN")} &middot; Logged by {x.createdBy?.name || "System"}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <strong className={`block text-base font-black ${x.status === "REVERSED" ? "text-slate-400 line-through" : incoming ? "text-green-700" : "text-slate-950"}`}>
                      {incoming ? "+" : "−"}{fmt(x.amount)}
                    </strong>
                    {canManage && x.partyType === "SUPPLIER" && x.status === "POSTED" && (
                      <button 
                        onClick={() => setReversing(x)} 
                        className="min-h-[30px] rounded-lg border border-red-200 px-3 text-[10px] font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Reverse Payment
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Mobile Reusable Card Viewport (<768px) */}
          <div className="space-y-3.5 md:hidden">
            {data.map((x) => {
              const incoming = x.partyType === "CUSTOMER";
              return (
                <MobileDataCard
                  key={`${x.partyType}-${x.id}`}
                  title={`${incoming ? "Receipt" : "Payment"}: ${x.party?.name || "Unlinked"}`}
                  subtitle={`Mode: ${x.paymentMode} · Ref: ${x.reference || "N/A"}`}
                  badge={
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      x.status === "REVERSED" 
                        ? "bg-red-100 text-red-700" 
                        : incoming 
                          ? "bg-green-50 text-green-700" 
                          : "bg-slate-900 text-white"
                    }`}>
                      {x.status === "REVERSED" ? "REVERSED" : incoming ? "CUSTOMER IN" : "SUPPLIER OUT"}
                    </span>
                  }
                  primaryMetric={{
                    label: "Amount",
                    value: (
                      <span className={x.status === "REVERSED" ? "text-slate-400 line-through font-black" : incoming ? "text-green-700 font-black" : "text-slate-950 font-black"}>
                        {incoming ? "+" : "−"}{fmt(x.amount)}
                      </span>
                    ),
                    helper: `Date: ${new Date(x.date).toLocaleDateString("en-IN")}`
                  }}
                  secondaryMetrics={[
                    { label: "Party Category", value: incoming ? "Customer" : "Supplier" },
                    { label: "Logged By", value: x.createdBy?.name || "System" }
                  ]}
                  actions={
                    canManage && x.partyType === "SUPPLIER" && x.status === "POSTED" ? (
                      <button 
                        onClick={() => setReversing(x)} 
                        className="w-full min-h-[44px] rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer press-active"
                      >
                        Reverse Supplier Payment
                      </button>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Reusable Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Financial Logs"
        subtitle="Filter transactions by party type & payment mode"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setDraftParty("");
          setDraftMode("");
          setParty("");
          setMode("");
        }}
        onApply={() => {
          setParty(draftParty);
          setMode(draftMode);
          setFilterOpen(false);
        }}
      >
        {filtersPanel}
      </MobileFilterDrawer>

      <SupplierPaymentReversalDialog 
        open={!!reversing} 
        paymentNumber={reversing?.paymentNumber || "payment"} 
        busy={busy} 
        onCancel={() => !busy && setReversing(undefined)} 
        onConfirm={reverse}
      />
    </div>
  );
}

