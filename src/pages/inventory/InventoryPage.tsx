import { useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle, Camera, Paperclip, ClipboardList } from "lucide-react";

import { C } from "../../constants/colors";
import { stockItems } from "../../data/inventory.mock";
import { Badge } from "../../app/components/common/Badge";
import { Card } from "../../app/components/common/Card";
import { SectionLabel } from "../../app/components/common/SectionLabel";
import { Divider } from "../../app/components/common/Divider";

export const InventoryPage = () => {
  const [showReconcile, setShowReconcile] = useState(false);
  const [reconcileStep, setReconcileStep] = useState(0);
  const [shortage, setShortage] = useState(false);
  const [reconciled, setReconciled] = useState(false);

  const lowStock = stockItems.filter(s => s.qty - s.reserved < s.reorder);

  if (showReconcile) {
    return (
      <div className="flex flex-col h-full">
        <div style={{ background: C.blue }} className="px-4 pt-12 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => { setShowReconcile(false); setReconcileStep(0); setReconciled(false); }} className="cursor-pointer">
              <ArrowLeft size={20} color="white" />
            </button>
            <div>
              <div className="text-white/60 text-[11px] uppercase tracking-wider">Supplier Verification</div>
              <div className="text-white text-base font-bold">Incoming Shipment</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {!reconciled ? (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: C.ink }} className="text-sm font-bold">PO Reference</span>
                  <span style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="text-sm font-bold">PO-2025-0192</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span style={{ color: C.muted }} className="text-xs">Supplier</span>
                  <span style={{ color: C.ink }} className="text-xs font-semibold">UltraTech Cement Ltd</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span style={{ color: C.muted }} className="text-xs">Vehicle</span>
                  <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-xs font-semibold">MH-12 CD 4521</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: C.muted }} className="text-xs">Challan No.</span>
                  <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-xs font-semibold">CH-47821</span>
                </div>
              </Card>
              <SectionLabel>Quantity Verification</SectionLabel>
              <Card className="p-4">
                <div style={{ color: C.ink }} className="text-sm font-semibold mb-3">OPC 53 Grade Cement</div>
                <div className="flex gap-3 mb-3">
                  <div style={{ background: C.surface }} className="flex-1 rounded-xl p-3">
                    <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-wide mb-1">Expected</div>
                    <div style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-xl font-bold">1,000</div>
                    <div style={{ color: C.muted }} className="text-[11px]">Bags</div>
                  </div>
                  <div style={{ background: shortage ? "#FEF2F2" : "#ECFDF5", border: `1.5px solid ${shortage ? C.error : C.success}` }} className="flex-1 rounded-xl p-3">
                    <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-wide mb-1">Received</div>
                    <div style={{ color: shortage ? C.error : C.success, fontFamily: "'Space Grotesk'" }} className="text-xl font-bold">{shortage ? "960" : "1,000"}</div>
                    <div style={{ color: C.muted }} className="text-[11px]">Bags</div>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.muted }} className="text-[11px] mb-1">Accepted</div>
                    <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">{shortage ? "940" : "1,000"}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.muted }} className="text-[11px] mb-1">Damaged</div>
                    <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ color: shortage ? C.warning : C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">{shortage ? "20" : "0"}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.muted }} className="text-[11px] mb-1">Short</div>
                    <div style={{ background: shortage ? "#FEF2F2" : C.surface, borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ color: shortage ? C.error : C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">{shortage ? "40" : "0"}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShortage(!shortage)}
                  style={{ background: shortage ? "#FEF2F2" : "#ECFDF5", border: `1px solid ${shortage ? C.error : C.success}`, color: shortage ? C.error : C.success }}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {shortage ? "Shortage recorded — Tap to clear" : "Simulate shortage scenario"}
                </button>
              </Card>
              {shortage && (
                <div style={{ background: "#FEF2F2", border: `1px solid ${C.error}20` }} className="rounded-xl px-4 py-3 flex gap-3">
                  <AlertTriangle size={16} color={C.error} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div style={{ color: "#991B1B" }} className="text-xs font-semibold mb-0.5">Discrepancy Detected</div>
                    <p style={{ color: "#991B1B" }} className="text-[11px]">40 bags short. Dispute note will be raised with UltraTech Cement Ltd. Credit note of ₹15,400 will be requested.</p>
                  </div>
                </div>
              )}
              <Card className="p-4">
                <div style={{ color: C.muted }} className="text-[11px] font-semibold uppercase tracking-wide mb-2">Attachments</div>
                <button style={{ background: C.surface, border: `1.5px dashed ${C.border}` }} className="w-full py-3 rounded-xl flex items-center justify-center gap-2 mb-2 cursor-pointer">
                  <Camera size={15} color={C.muted} />
                  <span style={{ color: C.muted }} className="text-sm">Take Photo</span>
                </button>
                <button style={{ background: C.surface, border: `1.5px dashed ${C.border}` }} className="w-full py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                  <Paperclip size={15} color={C.muted} />
                  <span style={{ color: C.muted }} className="text-sm">Attach Document</span>
                </button>
              </Card>
              <button
                onClick={() => setReconciled(true)}
                style={{ background: C.blue }}
                className="w-full py-4 rounded-xl text-white font-bold cursor-pointer"
              >
                {shortage ? "Save & Raise Dispute" : "Verify & Accept Shipment"}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-8">
              <div style={{ background: shortage ? "#FEF2F2" : "#ECFDF5" }} className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
                {shortage ? <AlertTriangle size={36} color={C.error} /> : <CheckCircle size={36} color={C.success} />}
              </div>
              <div style={{ color: C.ink }} className="text-lg font-bold mb-1">{shortage ? "Dispute Raised" : "Shipment Verified"}</div>
              <div style={{ color: C.muted }} className="text-sm mb-1">PO-2025-0192 · UltraTech Cement Ltd</div>
              <div style={{ color: C.muted }} className="text-xs mb-2">Verified by Suresh Patil · 10 Jul 2025, 11:15</div>
              {shortage && <div style={{ color: C.muted }} className="text-xs mb-5">Credit note request: ₹15,400 sent to supplier</div>}
              <div style={{ background: C.surface, borderRadius: 10 }} className="w-full px-4 py-3 mb-4">
                <div className="flex justify-between text-xs">
                  <span style={{ color: C.muted }}>Stock updated</span>
                  <span style={{ color: C.success, fontFamily: "'Space Grotesk'" }} className="font-semibold">+{shortage ? "940" : "1,000"} Bags</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: C.muted }}>Audit entry</span>
                  <span style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="font-semibold">#STK-2025-0391</span>
                </div>
              </div>
              <button onClick={() => { setShowReconcile(false); setReconcileStep(0); setReconciled(false); setShortage(false); }} style={{ background: C.blue }} className="w-full py-3.5 rounded-xl text-white font-bold cursor-pointer">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 pb-4">
      {/* Mobile Header - Hidden on md/lg desktop */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5 md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/60 text-[11px] uppercase tracking-wider">Inventory</div>
            <div className="text-white text-lg font-bold">Stock Overview</div>
          </div>
          <button
            onClick={() => setShowReconcile(true)}
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.25)" }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer"
          >
            <ClipboardList size={14} color="white" />
            <span className="text-white text-xs font-semibold">Verify Shipment</span>
          </button>
        </div>
      </div>

      <div className="px-1 md:px-0 py-4 flex flex-col gap-4">
        {/* Desktop Toolbar */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-2">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
            {["All", "Godown A", "Main Yard", "Godown B"].map(loc => (
              <button key={loc} style={{ background: loc === "All" ? C.blue : C.white, color: loc === "All" ? "white" : C.muted, border: `1px solid ${loc === "All" ? C.blue : C.border}` }} className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap cursor-pointer">
                {loc}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowReconcile(true)}
            style={{ background: C.blue }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg cursor-pointer text-white text-xs font-semibold"
          >
            <ClipboardList size={14} color="white" />
            <span>Verify Shipment</span>
          </button>
        </div>

        {/* Alert banner */}
        {lowStock.length > 0 && (
          <div style={{ background: "#FEF2F2", border: `1px solid ${C.error}30` }} className="rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} color={C.error} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div style={{ color: "#991B1B" }} className="text-[12px] font-semibold">{lowStock.length} items below reorder threshold</div>
              <div style={{ color: "#B91C1C" }} className="text-[11px]">M-Sand and Cement require immediate reorder</div>
            </div>
            <button style={{ background: C.error }} className="px-3 py-1.5 rounded-lg text-white text-[11px] font-semibold flex-shrink-0 cursor-pointer">
              Reorder
            </button>
          </div>
        )}

        {/* Mobile-only Location filter */}
        <div className="flex gap-2 md:hidden">
          {["All", "Godown A", "Main Yard", "Godown B"].map(loc => (
            <button key={loc} style={{ background: loc === "All" ? C.blue : C.white, color: loc === "All" ? "white" : C.muted, border: `1px solid ${loc === "All" ? C.blue : C.border}` }} className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap cursor-pointer">
              {loc}
            </button>
          ))}
        </div>

        {/* Stock items list/table wrapper */}
        <div>
          <SectionLabel>{stockItems.length} materials tracked</SectionLabel>

          {/* Mobile Stacked View */}
          <div className="lg:hidden" style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white }}>
            {stockItems.map((item, i) => {
              const available = item.qty - item.reserved;
              const isCritical = available < item.reorder;
              const pct = Math.min(100, (available / (item.reorder * 2)) * 100);
              return (
                <div key={item.id}>
                  {i > 0 && <Divider />}
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ color: C.ink }} className="text-[13px] font-semibold">{item.material}</span>
                          {isCritical && <Badge label="LOW" color="error" />}
                        </div>
                        <div style={{ color: C.muted }} className="text-[11px]">{item.grade} · {item.location} · Updated {item.updated}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div style={{ color: isCritical ? C.error : C.ink, fontFamily: "'Space Grotesk'" }} className="text-base font-bold">{available.toLocaleString("en-IN")}</div>
                        <div style={{ color: C.muted }} className="text-[10px]">{item.unit} avail.</div>
                      </div>
                    </div>
                    <div className="flex gap-3 text-[10px] mb-2">
                      <span style={{ color: C.muted }}>Reserved: <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">{item.reserved.toLocaleString("en-IN")} {item.unit}</span></span>
                      <span style={{ color: C.muted }}>Reorder at: <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="font-semibold">{item.reorder.toLocaleString("en-IN")}</span></span>
                    </div>
                    <div style={{ background: "#F0EEE6", borderRadius: 99, height: 5 }} className="mb-2">
                      <div style={{ background: isCritical ? C.error : pct > 60 ? C.success : C.warning, borderRadius: 99, width: `${pct}%`, height: "100%", transition: "width 0.3s" }} />
                    </div>
                    <div style={{ background: isCritical ? "#FEF2F2" : "#F0FDF4", borderRadius: 8 }} className="px-3 py-2">
                      <p style={{ color: isCritical ? "#991B1B" : "#065F46" }} className="text-[11px]">
                        ~{item.daysLeft} days remaining at current sales rate · <em>Estimate based on 7-day avg.</em>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden bg-white border border-[rgba(20,18,14,0.1)] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr style={{ background: C.surface, color: C.muted }} className="font-semibold border-b border-[rgba(20,18,14,0.1)]">
                  <th className="px-4 py-3">Material & Grade</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Available Qty</th>
                  <th className="px-4 py-3 text-right">Reserved</th>
                  <th className="px-4 py-3 text-right">Reorder Point</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Estimate Remaining</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((item) => {
                  const available = item.qty - item.reserved;
                  const isCritical = available < item.reorder;
                  return (
                    <tr key={item.id} className="border-b last:border-0 border-[rgba(20,18,14,0.06)] hover:bg-black/5">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{item.material}</div>
                        <div className="text-[10px] text-gray-500">{item.grade}</div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700">{item.location}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-900">{available.toLocaleString("en-IN")} {item.unit}</td>
                      <td className="px-4 py-3.5 text-right text-gray-500">{item.reserved.toLocaleString("en-IN")} {item.unit}</td>
                      <td className="px-4 py-3.5 text-right text-gray-500">{item.reorder.toLocaleString("en-IN")} {item.unit}</td>
                      <td className="px-4 py-3.5">
                        {isCritical ? <Badge label="LOW STOCK" color="error" /> : <Badge label="NORMAL" color="success" />}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={isCritical ? "text-red-600 font-semibold" : "text-green-700 font-semibold"}>
                          ~{item.daysLeft} days ({item.updated})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InventoryPage;
