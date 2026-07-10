import { useState } from "react";
import { ArrowLeft, AlertTriangle, Truck, Navigation, User, Users, Phone, MessageSquare, AlertCircle, Eye, CheckCircle, X } from "lucide-react";

import { C } from "../../constants/colors";
import { deliveries, statusMeta } from "../../data/deliveries.mock";
import { Badge } from "../../app/components/common/Badge";
import { Card } from "../../app/components/common/Card";
import { SectionLabel } from "../../app/components/common/SectionLabel";

export const DeliveriesPage = () => {
  const [selected, setSelected] = useState<number>(1);
  const [showAssign, setShowAssign] = useState(false);
  const [showPOD, setShowPOD] = useState(false);
  const [assigned, setAssigned] = useState(false);

  const active = deliveries.find(d => d.id === selected) || deliveries[0];

  if (showAssign) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.dark }}>
        <div style={{ background: C.darkCard, borderBottom: `1px solid ${C.darkBorder}` }} className="px-4 pt-12 pb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowAssign(false); setAssigned(false); }} className="cursor-pointer">
              <ArrowLeft size={20} color="white" />
            </button>
            <div>
              <div className="text-white/50 text-[11px] uppercase tracking-wider">Dispatch</div>
              <div className="text-white text-base font-bold">Assign Driver & Vehicle</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {!assigned ? (
            <>
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 12 }} className="p-4">
                <div className="text-white/50 text-[11px] mb-1">Trip for</div>
                <div className="text-white text-sm font-semibold">Suresh Infra Pvt Ltd</div>
                <div className="text-white/50 text-[11px]">Red Bricks 15,000 Pcs · Pimpri Industrial Area</div>
              </div>
              <div>
                <div className="text-white/50 text-[11px] font-semibold uppercase tracking-wider mb-2">Available Drivers</div>
                {[
                  { name: "Anil Sharma", trips: 0, avail: true },
                  { name: "Santosh More", trips: 1, avail: true },
                  { name: "Prakash Yadav", trips: 1, avail: false, note: "On MH-12 AB 7890 — ETA 15:30" },
                ].map((d, i) => (
                  <div key={i} style={{ background: C.darkCard, border: `1px solid ${d.avail ? C.darkBorder : C.error + "40"}`, borderRadius: 10, marginBottom: 8 }} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm font-semibold">{d.name}</div>
                      <div className="text-white/50 text-[11px]">{d.avail ? `${d.trips} active trip${d.trips !== 1 ? "s" : ""}` : d.note}</div>
                    </div>
                    {d.avail ? (
                      <Badge label="Available" color="success" />
                    ) : (
                      <Badge label="Busy" color="error" />
                    )}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-white/50 text-[11px] font-semibold uppercase tracking-wider mb-2">Available Vehicles</div>
                {[
                  { reg: "MH-12 XY 1122", cap: "10T", avail: true, load: "Empty" },
                  { reg: "MH-14 GH 2341", cap: "8T", avail: false, load: "Loading — ETA 16:00" },
                  { reg: "MH-09 ZZ 8890", cap: "12T", avail: true, load: "Empty" },
                ].map((v, i) => (
                  <div key={i} style={{ background: C.darkCard, border: `1px solid ${v.avail ? C.darkBorder : C.warning + "40"}`, borderRadius: 10, marginBottom: 8 }} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk'" }} className="text-white text-sm font-bold">{v.reg}</div>
                      <div className="text-white/50 text-[11px]">Capacity {v.cap} · {v.load}</div>
                    </div>
                    {v.avail ? <Badge label="Available" color="success" /> : <Badge label="Busy" color="warning" />}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setAssigned(true)}
                style={{ background: C.blue }}
                className="w-full py-4 rounded-xl text-white font-bold text-base cursor-pointer"
              >
                Assign Anil Sharma · MH-12 XY 1122
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-8">
              <div style={{ background: "rgba(16,185,129,0.15)" }} className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={40} color={C.success} />
              </div>
              <div className="text-white text-lg font-bold mb-1">Driver Assigned</div>
              <div className="text-white/60 text-sm mb-1">Anil Sharma · MH-12 XY 1122</div>
              <div className="text-white/40 text-xs mb-6">Dispatched 10 Jul 2025, 14:52 · By Dispatch Team</div>
              <button onClick={() => { setShowAssign(false); setAssigned(false); }} style={{ background: C.blue }} className="w-full py-3.5 rounded-xl text-white font-bold cursor-pointer">
                Back to Fleet
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: C.dark }}>
      {/* Mobile Map - Hidden on desktop lg */}
      <div className="lg:hidden" style={{ height: 260, position: "relative", background: "#0E1823", overflow: "hidden", flexShrink: 0 }}>
        {/* Fake map SVG */}
        <svg width="100%" height="100%" viewBox="0 0 360 260" preserveAspectRatio="none">
          {/* Grid lines */}
          {[40, 80, 120, 160, 200, 240].map(y => <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
          {[60, 120, 180, 240, 300].map(x => <line key={x} x1={x} y1="0" x2={x} y2="260" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
          {/* Roads */}
          <path d="M0,140 Q80,130 160,145 Q240,158 360,150" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
          <path d="M0,90 Q90,85 180,100 Q270,115 360,105" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
          <path d="M120,0 Q125,65 130,130 Q135,190 140,260" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
          <path d="M240,0 Q245,65 250,130 Q255,190 255,260" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none" />
          {/* NH16 label */}
          <text x="50" y="133" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Space Grotesk">NH16</text>
          {/* Planned route */}
          <path d="M60,175 Q100,160 130,148 Q170,132 200,120 Q230,110 270,95" stroke={C.blue} strokeWidth="2.5" fill="none" strokeDasharray="5,3" opacity="0.6" />
          {/* Actual route */}
          <path d="M60,175 Q95,162 120,152" stroke={C.blue} strokeWidth="3" fill="none" />
          {/* Start marker */}
          <circle cx="60" cy="175" r="7" fill={C.success} />
          <text x="60" y="178" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">S</text>
          {/* Truck marker */}
          <circle cx="130" cy="150" r="10" fill={C.blue} />
          <text x="130" y="154" textAnchor="middle" fill="white" fontSize="10">🚚</text>
          {/* Destination */}
          <circle cx="270" cy="95" r="7" fill={C.error} />
          <text x="270" y="98" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">D</text>
          {/* Labels */}
          <text x="68" y="192" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Plus Jakarta Sans">Start Yard</text>
          <text x="248" y="112" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Plus Jakarta Sans">Ram Traders</text>
        </svg>

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-3" style={{ background: "linear-gradient(to bottom, rgba(14,24,35,0.95), transparent)" }}>
          <div>
            <div className="text-white/50 text-[11px] uppercase tracking-wider">Fleet</div>
            <div className="text-white text-base font-bold">Live Delivery</div>
          </div>
          <button style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${C.darkBorder}` }} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer">
            <Navigation size={15} color="white" />
          </button>
        </div>

        {/* Vehicle info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3" style={{ background: "linear-gradient(to top, rgba(14,24,35,0.95), transparent)" }}>
          <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}` }} className="rounded-xl px-3 py-2.5 flex items-center gap-3">
            <div style={{ background: "rgba(42,76,214,0.2)" }} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck size={15} color={C.blue} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span style={{ color: "white", fontFamily: "'Space Grotesk'" }} className="text-[12px] font-bold">MH-12 AB 7890</span>
                <Badge label="ON THE WAY" color="blue" />
              </div>
              <div className="text-white/50 text-[10px]">Prakash Yadav · 42 km/h · Updated 1m ago</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div style={{ color: C.success, fontFamily: "'Space Grotesk'" }} className="text-sm font-bold">14:45</div>
              <div className="text-white/40 text-[10px]">ETA</div>
            </div>
          </div>
          {/* Exception banner */}
          <div style={{ background: "rgba(255,179,0,0.15)", border: `1px solid rgba(255,179,0,0.3)` }} className="rounded-lg px-3 py-2 mt-2 flex items-center gap-2">
            <AlertTriangle size={13} color={C.warning} className="flex-shrink-0" />
            <span style={{ color: C.warning }} className="text-[11px] font-medium">8-minute delay — traffic obstruction on NH16</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 lg:p-0 flex-1 overflow-y-auto">
        {/* Left Column: Delivery pipeline */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <SectionLabel>
            <span className="text-white/50">Delivery Pipeline — {deliveries.length} trips</span>
          </SectionLabel>
          {deliveries.map(d => {
            const meta = statusMeta[d.status as keyof typeof statusMeta];
            const isSel = selected === d.id;
            return (
              <div
                key={d.id}
                style={{ background: C.darkCard, border: `1px solid ${isSel ? C.blue : C.darkBorder}`, borderRadius: 12 }}
                className="overflow-hidden"
              >
                <button className="w-full text-left px-4 py-3 cursor-pointer" onClick={() => setSelected(isSel ? 0 : d.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ background: meta.bg, color: meta.color }} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-white text-[13px] font-semibold">{d.customer}</div>
                      <div className="text-white/50 text-[11px]">{d.material}</div>
                      <div className="text-white/40 text-[11px]">{d.site}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {d.eta && <div style={{ color: d.status === "delivered" ? C.success : "white", fontFamily: "'Space Grotesk'" }} className="text-sm font-bold">{d.eta}</div>}
                      <div className="text-white/40 text-[10px]">{d.status === "delivered" ? "Delivered" : "ETA"}</div>
                    </div>
                  </div>
                  {d.driver ? (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div style={{ background: "rgba(255,255,255,0.08)" }} className="w-5 h-5 rounded-full flex items-center justify-center">
                        <User size={10} color="rgba(255,255,255,0.5)" />
                      </div>
                      <span style={{ fontFamily: "'Space Grotesk'" }} className="text-white/50 text-[11px]">{d.driver} · {d.vehicle}</span>
                    </div>
                  ) : (
                    <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 6 }} className="mt-2 px-2 py-1 inline-flex items-center gap-1">
                      <AlertCircle size={10} color={C.error} />
                      <span style={{ color: C.error }} className="text-[10px] font-semibold">No driver assigned</span>
                    </div>
                  )}
                </button>

                {/* Mobile-only expanded action drawer */}
                {isSel && (
                  <div style={{ borderTop: `1px solid ${C.darkBorder}` }} className="lg:hidden px-4 py-3 flex flex-col gap-2">
                    {d.status === "awaiting" && (
                      <button onClick={() => setShowAssign(true)} style={{ background: C.blue }} className="w-full py-2.5 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                        <Users size={13} /> Assign Driver & Vehicle
                      </button>
                    )}
                    {d.status === "delivered" && (
                      <button onClick={() => setShowPOD(true)} style={{ background: "rgba(16,185,129,0.15)", border: `1px solid ${C.success}40` }} className="w-full py-2.5 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                        <Eye size={13} color={C.success} />
                        <span style={{ color: C.success }}>View Proof of Delivery</span>
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.darkBorder}`, flex: 1 }} className="py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                        <Phone size={12} color="rgba(255,255,255,0.5)" />
                        <span className="text-white/60 text-[11px]">Call</span>
                      </button>
                      <button style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.darkBorder}`, flex: 1 }} className="py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                        <MessageSquare size={12} color="rgba(255,255,255,0.5)" />
                        <span className="text-white/60 text-[11px]">Message</span>
                      </button>
                      <button style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`, flex: 1 }} className="py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                        <AlertTriangle size={12} color={C.error} />
                        <span style={{ color: C.error }} className="text-[11px]">Escalate</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Desktop Map & Active details card */}
        <div className="hidden lg:flex lg:col-span-7 flex-col gap-4">
          <SectionLabel>
            <span className="text-white/50">Tracking Details</span>
          </SectionLabel>

          {/* Map view on desktop */}
          <div style={{ height: 260, position: "relative", background: "#0E1823", overflow: "hidden", borderRadius: 12 }}>
            <svg width="100%" height="100%" viewBox="0 0 360 260" preserveAspectRatio="none">
              {[40, 80, 120, 160, 200, 240].map(y => <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
              {[60, 120, 180, 240, 300].map(x => <line key={x} x1={x} y1="0" x2={x} y2="260" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
              <path d="M0,140 Q80,130 160,145 Q240,158 360,150" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
              <path d="M0,90 Q90,85 180,100 Q270,115 360,105" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
              <path d="M120,0 Q125,65 130,130 Q135,190 140,260" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
              <path d="M240,0 Q245,65 250,130 Q255,190 255,260" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none" />
              <text x="50" y="133" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Space Grotesk">NH16</text>
              <path d="M60,175 Q100,160 130,148 Q170,132 200,120 Q230,110 270,95" stroke={C.blue} strokeWidth="2.5" fill="none" strokeDasharray="5,3" opacity="0.6" />
              <path d="M60,175 Q95,162 120,152" stroke={C.blue} strokeWidth="3" fill="none" />
              <circle cx="60" cy="175" r="7" fill={C.success} />
              <text x="60" y="178" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">S</text>
              <circle cx="130" cy="150" r="10" fill={C.blue} />
              <text x="130" y="154" textAnchor="middle" fill="white" fontSize="10">🚚</text>
              <circle cx="270" cy="95" r="7" fill={C.error} />
              <text x="270" y="98" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">D</text>
              <text x="68" y="192" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Plus Jakarta Sans">Start Yard</text>
              <text x="248" y="112" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Plus Jakarta Sans">Ram Traders</text>
            </svg>
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3" style={{ background: "linear-gradient(to top, rgba(14,24,35,0.95), transparent)" }}>
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}` }} className="rounded-xl px-3 py-2.5 flex items-center gap-3">
                <div style={{ background: "rgba(42,76,214,0.2)" }} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck size={15} color={C.blue} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "white", fontFamily: "'Space Grotesk'" }} className="text-[12px] font-bold">{active.vehicle || "N/A"}</span>
                    <Badge label={active.status.toUpperCase()} color="blue" />
                  </div>
                  <div className="text-white/50 text-[10px]">{active.driver || "Unassigned"} · ETA {active.eta || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed information card */}
          {active ? (
            <Card dark={true} className="p-5 flex flex-col gap-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-white font-bold text-sm">{active.customer}</h3>
                  <p className="text-white/50 text-xs mt-0.5">{active.site}</p>
                </div>
                <div className="text-right">
                  <span className="text-white font-semibold text-xs">{active.material}</span>
                </div>
              </div>

              {active.exception && (
                <div style={{ background: "rgba(255,179,0,0.15)", border: `1px solid rgba(255,179,0,0.3)` }} className="rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertTriangle size={13} color={C.warning} className="flex-shrink-0" />
                  <span style={{ color: C.warning }} className="text-[11px] font-medium">{active.exception}</span>
                </div>
              )}

              <div style={{ borderTop: `1px solid ${C.darkBorder}` }} className="pt-4 flex flex-col gap-3">
                {active.status === "awaiting" && (
                  <button onClick={() => setShowAssign(true)} style={{ background: C.blue }} className="w-full py-2.5 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                    <Users size={13} /> Assign Driver & Vehicle
                  </button>
                )}
                {active.status === "delivered" && (
                  <button onClick={() => setShowPOD(true)} style={{ background: "rgba(16,185,129,0.15)", border: `1px solid ${C.success}40` }} className="w-full py-2.5 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                    <Eye size={13} color={C.success} />
                    <span style={{ color: C.success }}>View Proof of Delivery</span>
                  </button>
                )}
                <div className="flex gap-2">
                  <button style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.darkBorder}`, flex: 1 }} className="py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                    <Phone size={12} color="rgba(255,255,255,0.5)" />
                    <span className="text-white/60 text-[11px]">Call {active.driver || "Customer"}</span>
                  </button>
                  <button style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.darkBorder}`, flex: 1 }} className="py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                    <MessageSquare size={12} color="rgba(255,255,255,0.5)" />
                    <span className="text-white/60 text-[11px]">Message</span>
                  </button>
                  <button style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`, flex: 1 }} className="py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                    <AlertTriangle size={12} color={C.error} />
                    <span style={{ color: C.error }} className="text-[11px]">Escalate</span>
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <Card dark={true} className="p-8 text-center border-dashed">
              <span className="text-white/50 text-xs">Select a trip from the pipeline to monitor details.</span>
            </Card>
          )}
        </div>
      </div>

      {/* POD sheet */}
      {showPOD && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end animate-none" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div style={{ background: C.darkCard, borderTop: `1px solid ${C.darkBorder}` }} className="rounded-t-2xl p-5 max-h-[70%] overflow-y-auto max-w-lg mx-auto w-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white text-base font-bold">Proof of Delivery</span>
              <button onClick={() => setShowPOD(false)} className="cursor-pointer"><X size={20} color="rgba(255,255,255,0.5)" /></button>
            </div>
            <div style={{ background: "rgba(16,185,129,0.1)", borderRadius: 10 }} className="p-3 mb-4 flex items-center gap-2">
              <CheckCircle size={16} color={C.success} />
              <span style={{ color: C.success }} className="text-sm font-semibold">Delivered Successfully</span>
            </div>
            {[
              { label: "Recipient", value: "Vikram Shyam (Store Manager)" },
              { label: "Timestamp", value: "10 Jul 2025, 11:28:45 IST" },
              { label: "GPS Location", value: "18.5089°N, 73.8122°E" },
              { label: "Qty Delivered", value: "5 Tonnes (as per PO)" },
              { label: "Audit Record", value: "#DEL-2025-1042" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${C.darkBorder}` }}>
                <span className="text-white/50 text-xs">{label}</span>
                <span style={{ color: "white", fontFamily: label === "Audit Record" || label === "Timestamp" ? "'Space Grotesk'" : undefined }} className="text-xs font-semibold text-right max-w-[55%]">{value}</span>
              </div>
            ))}
            <div className="mt-4 flex gap-2">
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, flex: 1, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="text-white/30 text-[11px]">Signature captured</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, flex: 1, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="text-white/30 text-[11px]">Photo on file</span>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8 }} className="px-3 py-2 mt-3">
              <span className="text-white/40 text-[10px]">Immutable record · Cannot be modified · Synced to audit log</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DeliveriesPage;
