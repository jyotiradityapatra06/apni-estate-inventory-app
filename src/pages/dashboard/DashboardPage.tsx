import { useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Bell, Search, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, TrendingUp
} from "lucide-react";

import { C } from "../../constants/colors";
import { fmtK } from "../../utils/currency";
import { weekData, invData, alerts } from "../../data/dashboard.mock";
import { Badge } from "../../app/components/common/Badge";
import { Card } from "../../app/components/common/Card";
import { SectionLabel } from "../../app/components/common/SectionLabel";
import { StatChip } from "../../app/components/common/StatChip";
import { Divider } from "../../app/components/common/Divider";

import { useAuth } from "../../hooks/useAuth";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: C.ink, border: "none" }} className="rounded-lg px-3 py-2 text-white text-xs">
        <div className="font-semibold mb-1">{label}</div>
        <div className="flex gap-3">
          <span style={{ color: "#93C5FD" }}>Sales: {fmtK(payload[0]?.value || 0)}</span>
          <span style={{ color: "#6EE7B7" }}>Coll: {fmtK(payload[1]?.value || 0)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { business } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(null);
  const isDemoBusiness = business?.name === "Shri Krishna Traders";

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header - Hidden on md/lg desktop */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5 -mx-0 md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/60 text-[11px] font-medium uppercase tracking-wider">Operating System</div>
            <div className="text-white text-lg font-bold leading-tight">{business?.name || "Shri Krishna Traders"}</div>
          </div>
          <div className="flex items-center gap-2">
            <button style={{ background: "rgba(255,255,255,0.15)" }} className="w-9 h-9 rounded-full flex items-center justify-center relative">
              <Bell size={17} color="white" />
              <span style={{ background: C.error }} className="absolute top-1 right-1 w-2 h-2 rounded-full" />
            </button>
            <button style={{ background: "rgba(255,255,255,0.15)" }} className="w-9 h-9 rounded-full flex items-center justify-center">
              <Search size={17} color="white" />
            </button>
          </div>
        </div>
        {/* Sync status */}
        <div className="flex items-center gap-1.5">
          <div style={{ background: C.success }} className="w-1.5 h-1.5 rounded-full" />
          <span className="text-white/70 text-[11px] font-medium">Live · Last sync 2 min ago</span>
        </div>
      </div>

      <div className="px-1 md:px-0 flex flex-col gap-4">
        {/* KPI Cards Grid */}
        <div>
          <SectionLabel>Today, 10 Jul 2025</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <StatChip label="Today's Sales" value={isDemoBusiness ? "₹14.5L" : "₹0"} sub={isDemoBusiness ? "+12% vs yesterday" : "No sales recorded"} trend={isDemoBusiness ? "up" : null} />
            <StatChip label="Collected" value={isDemoBusiness ? "₹6.1L" : "₹0"} sub={isDemoBusiness ? "₹8.4L pending" : "No collections"} trend={null} />
            <StatChip label="Outstanding" value={isDemoBusiness ? "₹38.2L" : "₹0"} sub={isDemoBusiness ? "-₹2.3L this week" : "No outstanding"} trend={isDemoBusiness ? "down" : null} />
            <StatChip label="Orders Open" value={isDemoBusiness ? "11" : "0"} sub={isDemoBusiness ? "3 unassigned" : "No open orders"} trend={null} />
          </div>
        </div>

        {/* Charts & Allocations Grid */}
        {isDemoBusiness ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly chart */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: C.ink }} className="text-sm font-semibold">Weekly Sales vs Collections</span>
                <div className="flex items-center gap-3 text-[10px] font-medium">
                  <span className="flex items-center gap-1"><span style={{ background: C.blue }} className="w-2 h-2 rounded-sm inline-block" />Sales</span>
                  <span className="flex items-center gap-1"><span style={{ background: C.success }} className="w-2 h-2 rounded-sm inline-block" />Collections</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weekData} barGap={2} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: C.muted, fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: C.muted, fontFamily: "Space Grotesk" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtK(v).replace("₹", "")} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(42,76,214,0.05)" }} />
                  <Bar dataKey="sales" fill={C.blue} radius={[3, 3, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="col" fill={C.success} radius={[3, 3, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ background: C.surface, borderRadius: 8 }} className="px-3 py-2 mt-2">
                <p style={{ color: C.muted }} className="text-[11px]">
                  This week: <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">₹99.0L</span> sales vs <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">₹73.0L</span> collected. Collection rate 73.7%.
                </p>
              </div>
            </Card>

            {/* Inventory allocation */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: C.ink }} className="text-sm font-semibold">Inventory Allocation</span>
                <span style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="text-sm font-bold">₹1,24,50,000</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: 110, height: 110, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={invData} cx="50%" cy="50%" innerRadius={32} outerRadius={48} dataKey="value" strokeWidth={0}>
                        {invData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  {invData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span style={{ background: item.color }} className="w-2 h-2 rounded-sm flex-shrink-0" />
                        <span style={{ color: C.muted }} className="text-[11px]">{item.name}</span>
                      </div>
                      <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-[11px] font-semibold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: C.surface, borderRadius: 8 }} className="px-3 py-2 mt-3">
                <p style={{ color: C.muted }} className="text-[11px]">Cement dominates at 42%. TMT Bar stock estimated 6 days at current rate.</p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-[rgba(20,18,14,0.1)] rounded-xl h-64 border-dashed">
            <div style={{ background: "rgba(42,76,214,0.05)", borderRadius: 999 }} className="w-12 h-12 flex items-center justify-center mb-3 text-blue-600">
              <TrendingUp size={24} color={C.blue} />
            </div>
            <div style={{ color: C.ink }} className="text-sm font-bold mb-1">Your dashboard will update as transactions are recorded</div>
            <p style={{ color: C.muted }} className="text-[11px] max-w-xs leading-normal">
              Create materials, adjust stock, and record payments to start tracking business performance.
            </p>
          </div>
        )}

        {/* Action Required */}
        <div>
          <SectionLabel action={isDemoBusiness ? "See all" : undefined}>Action Required</SectionLabel>
          <div className="flex flex-col gap-3">
            {isDemoBusiness ? (
              alerts.map((a) => {
                const Icon = a.icon;
                const sev = a.severity as "error" | "warning";
                const color = sev === "error" ? C.error : C.warning;
                const bgColor = sev === "error" ? "#FEF2F2" : "#FFFBEB";
                const isOpen = expanded === a.id;
                return (
                  <Card key={a.id} className="overflow-hidden">
                    <button
                      className="w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer animate-none"
                      onClick={() => setExpanded(isOpen ? null : a.id)}
                    >
                      <div style={{ background: bgColor, borderRadius: 8 }} className="w-9 h-9 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={16} color={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge label={a.tag} color={sev === "error" ? "error" : "warning"} />
                        </div>
                        <div style={{ color: C.ink }} className="text-[13px] font-semibold leading-snug">{a.title}</div>
                        <div style={{ color: C.muted }} className="text-[11px] mt-0.5">{a.impact}</div>
                      </div>
                      <div style={{ color: C.muted }} className="flex-shrink-0 mt-1">
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>
                    {isOpen && (
                      <>
                        <Divider />
                        <div className="px-4 py-3">
                          <button
                            onClick={() => {
                              setExpanded(null);
                              if (a.id === 1) {
                                navigate("/inventory");
                              } else if (a.id === 2) {
                                navigate("/deliveries");
                              } else {
                                navigate("/sales");
                              }
                            }}
                            style={{ background: C.blue }}
                            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {a.action} <ArrowUpRight size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </Card>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center bg-white border border-[rgba(20,18,14,0.1)] rounded-xl">
                <span style={{ color: C.muted }} className="text-xs">No alerts right now</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
