import { useState, useEffect } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle, ClipboardList, Search, Plus, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";

import { C } from "../../constants/colors";
import { Badge } from "../../app/components/common/Badge";
import { Card } from "../../app/components/common/Card";
import { SectionLabel } from "../../app/components/common/SectionLabel";
import { Divider } from "../../app/components/common/Divider";
import { useGetInventory, useInventoryMutations } from "../../hooks/useInventory";

export const InventoryPage = () => {
  const [showReconcile, setShowReconcile] = useState(false);
  const [reconcileItemId, setReconcileItemId] = useState("");
  const [reconcileQty, setReconcileQty] = useState("");
  const [reconcileSupplier, setReconcileSupplier] = useState("");
  const [reconcileNote, setReconcileNote] = useState("");

  // Filter States
  const [activeLocation, setActiveLocation] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // CRUD & Stock Adjustment States
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<"IN" | "OUT">("IN");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);

  // Alert message banner states
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Fetch Inventory
  const { data: stockItems, loading, error, refresh } = useGetInventory({
    search: searchQuery,
    location: activeLocation,
  });

  const { createItem, updateItem, deleteItem, adjustStock, loading: mutationLoading } = useInventoryMutations();

  // Add / Edit Form Inputs
  const [materialName, setMaterialName] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  const handleOpenAdd = () => {
    setEditingItem(null);
    setMaterialName("");
    setCategory("Cement");
    setSku("");
    setUnit("Bags");
    setQuantity("0");
    setReorderLevel("100");
    setLocationInput("Godown A");
    setCostPrice("");
    setSellingPrice("");
    setFeedback(null);
    setShowAddEdit(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setMaterialName(item.materialName);
    setCategory(item.category);
    setSku(item.sku);
    setUnit(item.unit);
    setQuantity(String(item.quantity));
    setReorderLevel(String(item.reorderLevel));
    setLocationInput(item.location);
    setCostPrice(item.costPrice ? String(item.costPrice) : "");
    setSellingPrice(item.sellingPrice ? String(item.sellingPrice) : "");
    setFeedback(null);
    setShowAddEdit(true);
  };

  const handleOpenAdjustment = (item: any, type: "IN" | "OUT") => {
    setAdjustingItem(item);
    setAdjustType(type);
    setAdjustQty("");
    setAdjustNote("");
    setFeedback(null);
    setShowAdjust(true);
  };

  const handleOpenDelete = (item: any) => {
    setDeletingItem(item);
    setFeedback(null);
    setShowDeleteConfirm(true);
  };

  // Escape key handler to close dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddEdit(false);
        setShowAdjust(false);
        setShowDeleteConfirm(false);
        setShowReconcile(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mutationLoading) return;
    setFeedback(null);

    const inputData = {
      materialName,
      category,
      sku,
      unit,
      quantity: Number(quantity) || 0,
      reorderLevel: Number(reorderLevel) || 0,
      location: locationInput,
      costPrice: costPrice ? Number(costPrice) : null,
      sellingPrice: sellingPrice ? Number(sellingPrice) : null,
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, inputData);
        setFeedback({ type: "success", msg: "Inventory material updated successfully." });
        toast.success("Material updated");
      } else {
        await createItem(inputData);
        setFeedback({ type: "success", msg: "Inventory material created successfully." });
        toast.success("Material added");
      }
      setShowAddEdit(false);
      refresh();
    } catch (err: any) {
      const msg = err?.message || "This material could not be saved.";
      setFeedback({ type: "error", msg });
      toast.error(msg);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mutationLoading) return;
    setFeedback(null);

    if (!adjustQty || Number(adjustQty) <= 0) {
      const errMsg = "Please enter a valid adjustment quantity greater than zero.";
      setFeedback({ type: "error", msg: errMsg });
      toast.error(errMsg);
      return;
    }

    if (adjustType === "OUT" && Number(adjustQty) > adjustingItem.quantity) {
      const errMsg = "Stock cannot be reduced below zero.";
      setFeedback({ type: "error", msg: errMsg });
      toast.error(errMsg);
      return;
    }

    try {
      await adjustStock(adjustingItem.id, {
        type: adjustType,
        quantity: Number(adjustQty),
        note: adjustNote,
      });
      setFeedback({
        type: "success",
        msg: `Recorded stock ${adjustType === "IN" ? "addition" : "deduction"} for ${adjustingItem.materialName}.`,
      });
      toast.success(adjustType === "IN" ? "Stock added" : "Stock removed");
      setShowAdjust(false);
      refresh();
    } catch (err: any) {
      const msg = err?.message || "Failed to adjust stock.";
      setFeedback({ type: "error", msg });
      toast.error(msg);
    }
  };

  const handleDeleteSubmit = async () => {
    if (mutationLoading) return;
    setFeedback(null);
    try {
      await deleteItem(deletingItem.id);
      setFeedback({ type: "success", msg: `Deleted ${deletingItem.materialName} successfully.` });
      toast.success("Material deleted");
      setShowDeleteConfirm(false);
      refresh();
    } catch (err: any) {
      const msg = err?.message || "Failed to delete item.";
      setFeedback({ type: "error", msg });
      toast.error(msg);
    }
  };

  const lowStock = stockItems.filter((s) => s.quantity < s.reorderLevel);

  if (showReconcile) {
    const handleReconcileSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (mutationLoading) return;
      setFeedback(null);

      if (!reconcileItemId) {
        const errMsg = "Please select a material.";
        setFeedback({ type: "error", msg: errMsg });
        toast.error(errMsg);
        return;
      }

      if (!reconcileQty || Number(reconcileQty) <= 0) {
        const errMsg = "Please enter a valid received quantity greater than zero.";
        setFeedback({ type: "error", msg: errMsg });
        toast.error(errMsg);
        return;
      }

      try {
        const selectedItem = stockItems.find((item) => item.id === reconcileItemId);
        const combinedNote = `Supplier: ${reconcileSupplier || "N/A"}${reconcileNote ? ` · Note: ${reconcileNote}` : ""}`;
        await adjustStock(reconcileItemId, {
          type: "IN",
          quantity: Number(reconcileQty),
          note: combinedNote,
        });

        toast.success(`Successfully stocked in ${reconcileQty} ${selectedItem?.unit || "units"} of ${selectedItem?.materialName}`);
        
        // Reset fields
        setReconcileItemId("");
        setReconcileQty("");
        setReconcileSupplier("");
        setReconcileNote("");
        
        setShowReconcile(false);
        refresh();
      } catch (err: any) {
        const msg = err?.message || "Failed to confirm stock in.";
        setFeedback({ type: "error", msg });
        toast.error(msg);
      }
    };

    return (
      <div className="flex flex-col h-full">
        <div style={{ background: C.blue }} className="px-4 pt-12 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => { setShowReconcile(false); }} className="cursor-pointer">
              <ArrowLeft size={20} color="white" />
            </button>
            <div>
              <div className="text-white/60 text-[11px] uppercase tracking-wider">Inventory Entry</div>
              <div className="text-white text-base font-bold">Incoming Stock</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          <Card className="p-4">
            <h3 style={{ color: C.ink }} className="text-sm font-bold mb-4">Stock-In Form</h3>
            {stockItems.length === 0 ? (
              <div className="text-center py-6">
                <AlertTriangle size={32} color={C.error} className="mx-auto mb-2" />
                <div style={{ color: C.ink }} className="text-sm font-semibold mb-1">No Materials Available</div>
                <div style={{ color: C.muted }} className="text-xs mb-4">You need to add a material to inventory first.</div>
                <button
                  onClick={() => {
                    setShowReconcile(false);
                    handleOpenAdd();
                  }}
                  style={{ background: C.blue }}
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs cursor-pointer"
                >
                  Create Material
                </button>
              </div>
            ) : (
              <form onSubmit={handleReconcileSubmit} className="flex flex-col gap-4 text-xs font-medium">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Select Material</label>
                  <select
                    required
                    value={reconcileItemId}
                    onChange={(e) => setReconcileItemId(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">-- Choose Material --</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.materialName} ({item.location} · Current: {item.quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Received Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="Enter received quantity"
                    value={reconcileQty}
                    onChange={(e) => setReconcileQty(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Supplier Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. UltraTech Cement Ltd"
                    value={reconcileSupplier}
                    onChange={(e) => setReconcileSupplier(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Add Note (Optional)</label>
                  <textarea
                    placeholder="e.g. Gate pass no. 5422, received by security"
                    value={reconcileNote}
                    onChange={(e) => setReconcileNote(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none h-16"
                  />
                </div>

                <button
                  type="submit"
                  disabled={mutationLoading}
                  style={{ background: C.blue }}
                  className="w-full py-3.5 rounded-xl text-white font-bold cursor-pointer disabled:opacity-50 hover:opacity-95 active:scale-[0.98] transition-all duration-200 mt-2"
                >
                  {mutationLoading ? "Confirming..." : "Confirm Stock In"}
                </button>
              </form>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 pb-4">
      {/* Mobile Header */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5 md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/60 text-[11px] uppercase tracking-wider">Inventory</div>
            <div className="text-white text-lg font-bold">Stock Overview</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              style={{ background: "rgba(255,255,255,0.2)" }}
              className="p-2 rounded-lg flex items-center justify-center cursor-pointer text-white"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setShowReconcile(true)}
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.25)" }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer"
            >
              <ClipboardList size={14} color="white" />
              <span className="text-white text-xs font-semibold">Stock In</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-1 md:px-0 py-4 flex flex-col gap-4">
        {/* Success/Error Feedback Alerts */}
        {feedback && (
          <div
            style={{
              background: feedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
              border: `1px solid ${feedback.type === "success" ? C.success : C.error}30`,
            }}
            className="rounded-xl px-4 py-3 flex items-start gap-3 relative"
          >
            {feedback.type === "success" ? (
              <CheckCircle size={16} color={C.success} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={16} color={C.error} className="flex-shrink-0 mt-0.5" />
            )}
            <span style={{ color: feedback.type === "success" ? "#065F46" : "#991B1B" }} className="text-xs font-medium leading-snug">
              {feedback.msg}
            </span>
            <button onClick={() => setFeedback(null)} className="absolute top-2 right-2 text-xs font-bold opacity-40 cursor-pointer">×</button>
          </div>
        )}

        {/* Desktop Toolbar */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div style={{ background: C.white, border: `1px solid ${C.border}` }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-60 text-xs font-medium">
              <Search size={14} color={C.muted} />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-gray-800"
              />
            </div>
            {/* Location Tabs */}
            <div className="flex gap-1">
              {["All", "Godown A", "Main Yard", "Godown B"].map((loc) => (
                <button
                  key={loc}
                  onClick={() => setActiveLocation(loc)}
                  style={{
                    background: activeLocation === loc ? C.blue : C.white,
                    color: activeLocation === loc ? "white" : C.muted,
                    border: `1px solid ${activeLocation === loc ? C.blue : C.border}`,
                  }}
                  className="px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-all"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              style={{ background: C.blue }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg cursor-pointer text-white text-xs font-semibold"
            >
              <Plus size={14} color="white" />
              <span>Add Material</span>
            </button>
            <button
              onClick={() => setShowReconcile(true)}
              style={{ background: C.white, border: `1px solid ${C.border}` }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg cursor-pointer text-gray-700 text-xs font-semibold hover:bg-black/5"
            >
              <ClipboardList size={14} color={C.muted} />
              <span>Incoming Stock</span>
            </button>
          </div>
        </div>

        {/* Mobile Search & Location Filter */}
        <div className="flex flex-col gap-2 md:hidden">
          <div style={{ background: C.white, border: `1px solid ${C.border}` }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium">
            <Search size={14} color={C.muted} />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full text-gray-800"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap py-1">
            {["All", "Godown A", "Main Yard", "Godown B"].map((loc) => (
              <button
                key={loc}
                onClick={() => setActiveLocation(loc)}
                style={{
                  background: activeLocation === loc ? C.blue : C.white,
                  color: activeLocation === loc ? "white" : C.muted,
                  border: `1px solid ${activeLocation === loc ? C.blue : C.border}`,
                }}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all"
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Low Stock Alert banner */}
        {!loading && lowStock.length > 0 && (
          <div style={{ background: "#FEF2F2", border: `1px solid ${C.error}30` }} className="rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} color={C.error} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div style={{ color: "#991B1B" }} className="text-[12px] font-semibold">{lowStock.length} items below reorder threshold</div>
              <div style={{ color: "#B91C1C" }} className="text-[11px]">
                {lowStock.map(s => s.materialName).slice(0, 3).join(", ")} {lowStock.length > 3 ? "and more " : ""}require replenishment.
              </div>
            </div>
          </div>
        )}

        {/* Stock items list/table wrapper */}
        <div>
          <SectionLabel>{loading ? "Loading..." : `${stockItems.length} materials tracked`}</SectionLabel>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 bg-white border border-[rgba(20,18,14,0.1)] rounded-xl gap-2">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <span style={{ color: C.muted }} className="text-xs font-semibold">Loading materials...</span>
            </div>
          )}

          {/* Empty state */}
          {!loading && stockItems.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-[rgba(20,18,14,0.1)] rounded-xl h-48 border-dashed">
              {searchQuery || activeLocation !== "All" ? (
                <>
                  <span style={{ color: C.muted }} className="text-xs">No materials match your current filters</span>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveLocation("All");
                    }}
                    style={{ color: C.blue }}
                    className="text-xs font-bold mt-2 hover:underline cursor-pointer"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <span style={{ color: C.muted }} className="text-xs">No materials added yet</span>
                  <button
                    onClick={handleOpenAdd}
                    style={{ color: C.blue }}
                    className="text-xs font-bold mt-2 hover:underline cursor-pointer"
                  >
                    Add your first material
                  </button>
                </>
              )}
            </div>
          )}

          {/* Mobile Stacked View */}
          {!loading && stockItems.length > 0 && (
            <div className="lg:hidden" style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.white, boxShadow: "0 1px 3px 0 rgba(20, 18, 14, 0.05), 0 1px 2px -1px rgba(20, 18, 14, 0.05)" }}>
              {stockItems.map((item, i) => {
                const available = item.quantity;
                const isCritical = available < item.reorderLevel;
                const pct = Math.min(100, (available / (item.reorderLevel * 2 || 1)) * 100);
                const estDays = isCritical ? 3 : Math.min(15, Math.round(available / (item.reorderLevel || 1) * 7));

                return (
                  <div key={item.id}>
                    {i > 0 && <Divider />}
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span style={{ color: C.ink }} className="text-[13px] font-semibold">{item.materialName}</span>
                            {isCritical && <Badge label="LOW" variant="danger" />}
                          </div>
                          <div style={{ color: C.muted }} className="text-[11px]">{item.category} · {item.sku} · {item.location}</div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div style={{ color: isCritical ? C.error : C.ink, fontFamily: "'Space Grotesk'" }} className="text-base font-bold">{available.toLocaleString("en-IN")}</div>
                          <div style={{ color: C.muted }} className="text-[10px]">{item.unit} avail.</div>
                        </div>
                      </div>
                      <div className="flex gap-3 text-[10px] mb-2">
                        {item.costPrice && <span style={{ color: C.muted }}>Cost: <span style={{ color: C.ink }} className="font-semibold">₹{item.costPrice}</span></span>}
                        <span style={{ color: C.muted }}>Reorder Level: <span style={{ color: C.ink }} className="font-semibold">{item.reorderLevel.toLocaleString("en-IN")}</span></span>
                      </div>
                      <div style={{ background: "#F0EEE6", borderRadius: 99, height: 5 }} className="mb-2">
                        <div style={{ background: isCritical ? C.error : pct > 60 ? C.success : C.warning, borderRadius: 99, width: `${pct}%`, height: "100%", transition: "width 0.3s" }} />
                      </div>
                      <div style={{ background: isCritical ? "#FEF2F2" : "#F0FDF4", borderRadius: 8 }} className="px-3 py-2">
                        <p style={{ color: isCritical ? "#991B1B" : "#065F46" }} className="text-[11px]">
                          ~{estDays} days remaining at average rates
                        </p>
                      </div>

                      {/* Mobile Card Actions row */}
                      <div className="flex gap-1.5 mt-3 pt-3 border-t border-[rgba(20,18,14,0.06)] justify-end">
                        <button
                          onClick={() => handleOpenAdjustment(item, "IN")}
                          className="px-2.5 py-1 rounded bg-green-50 text-[10px] font-semibold text-green-700 cursor-pointer"
                        >
                          + Stock-In
                        </button>
                        <button
                          onClick={() => handleOpenAdjustment(item, "OUT")}
                          className="px-2.5 py-1 rounded bg-red-50 text-[10px] font-semibold text-red-700 cursor-pointer"
                        >
                          - Stock-Out
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1 rounded bg-blue-50 text-[10px] font-semibold text-blue-700 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="px-2.5 py-1 rounded bg-red-50 text-[10px] font-semibold text-red-700 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Desktop Table View */}
          {!loading && stockItems.length > 0 && (
            <div className="hidden lg:block overflow-hidden bg-white border border-[rgba(20,18,14,0.1)] rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ background: C.surface, color: C.muted }} className="font-semibold border-b border-[rgba(20,18,14,0.1)]">
                    <th className="px-4 py-3">Material Name & SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 text-right">Available Qty</th>
                    <th className="px-4 py-3 text-right">Reorder Threshold</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((item) => {
                    const available = item.quantity;
                    const isCritical = available < item.reorderLevel;
                    return (
                      <tr key={item.id} className="border-b last:border-0 border-[rgba(20,18,14,0.06)] hover:bg-black/5">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-900">{item.materialName}</div>
                          <div className="text-[10px] text-gray-500">{item.sku}</div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">{item.category}</td>
                        <td className="px-4 py-3.5 text-gray-700">{item.location}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-900">{available.toLocaleString("en-IN")} {item.unit}</td>
                        <td className="px-4 py-3.5 text-right text-gray-500">{item.reorderLevel.toLocaleString("en-IN")} {item.unit}</td>
                        <td className="px-4 py-3.5">
                          {isCritical ? <Badge label="LOW STOCK" variant="danger" /> : <Badge label="NORMAL" variant="success" />}
                        </td>
                        <td className="px-4 py-3.5 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustment(item, "IN")}
                            style={{ color: C.success }}
                            className="px-2.5 py-1 rounded hover:bg-green-50 text-[10px] font-bold cursor-pointer"
                          >
                            + Stock
                          </button>
                          <button
                            onClick={() => handleOpenAdjustment(item, "OUT")}
                            style={{ color: C.error }}
                            className="px-2.5 py-1 rounded hover:bg-red-50 text-[10px] font-bold cursor-pointer"
                          >
                            - Stock
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            style={{ color: C.blue }}
                            className="px-2.5 py-1 rounded hover:bg-blue-50 text-[10px] font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            style={{ color: C.error }}
                            className="px-2.5 py-1 rounded hover:bg-red-50 text-[10px] font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT MATERIAL */}
      {showAddEdit && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(14,24,35,0.4)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: C.white, borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(20, 18, 14, 0.1), 0 10px 10px -5px rgba(20, 18, 14, 0.04)" }} className="w-full max-w-md p-5 flex flex-col gap-4 max-h-[85%] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span style={{ color: C.ink }} className="text-sm font-bold">{editingItem ? "Edit Material" : "Add New Material"}</span>
              <button onClick={() => setShowAddEdit(false)} className="text-gray-500 font-bold cursor-pointer text-sm">×</button>
            </div>
            <form onSubmit={handleAddEditSubmit} className="flex flex-col gap-3 text-xs font-medium">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Material Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OPC 53 Grade Cement"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    {["Cement", "TMT Bars", "Sand", "Bricks", "Aggregate", "Plywood", "Paint", "Electrical Wire"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CEM-OPC-53"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    {["Bags", "Tonnes", "Cu.Ft", "Pcs", "Sheets", "Liters", "Coils"].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Location</label>
                  <select
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    {["Godown A", "Main Yard", "Godown B"].map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Initial Qty</label>
                  <input
                    type="number"
                    disabled={!!editingItem}
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none disabled:opacity-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Reorder Level</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Cost Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Selling Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={mutationLoading}
                style={{ background: C.blue }}
                className="w-full mt-2 py-3 rounded-xl text-white font-bold cursor-pointer disabled:opacity-50 hover:opacity-95 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {mutationLoading ? (
                  editingItem ? "Saving..." : "Adding..."
                ) : (
                  editingItem ? "Update Material" : "Create Material"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT (STOCK-IN / STOCK-OUT) */}
      {showAdjust && adjustingItem && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(14,24,35,0.4)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: C.white, borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(20, 18, 14, 0.1), 0 10px 10px -5px rgba(20, 18, 14, 0.04)" }} className="w-full max-w-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span style={{ color: C.ink }} className="text-sm font-bold">
                {adjustType === "IN" ? "Stock-In (Add)" : "Stock-Out (Deduct)"}
              </span>
              <button onClick={() => setShowAdjust(false)} className="text-gray-500 font-bold cursor-pointer text-sm">×</button>
            </div>
            <div style={{ background: C.surface }} className="rounded-lg p-3 text-xs">
              <div className="text-gray-500 uppercase text-[9px] mb-0.5">Material</div>
              <div style={{ color: C.ink }} className="font-bold">{adjustingItem.materialName}</div>
              <div className="text-gray-500 mt-1">Current Stock: <span className="font-semibold text-gray-800">{adjustingItem.quantity} {adjustingItem.unit}</span></div>
            </div>
            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase font-bold">Adjustment Qty ({adjustingItem.unit})</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  style={{ background: C.surface, border: `1.5px solid ${adjustType === "IN" ? C.success : C.error}`, color: C.ink }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Supplier delivery, Site delivery"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                disabled={mutationLoading}
                style={{ background: adjustType === "IN" ? C.success : C.error }}
                className="w-full py-3.5 rounded-xl text-white font-bold cursor-pointer disabled:opacity-50 hover:opacity-95 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {mutationLoading ? "Updating stock..." : `Confirm ${adjustType === "IN" ? "Stock-In" : "Stock-Out"}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {showDeleteConfirm && deletingItem && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(14,24,35,0.4)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: C.white, borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(20, 18, 14, 0.1), 0 10px 10px -5px rgba(20, 18, 14, 0.04)" }} className="w-full max-w-sm p-5 flex flex-col gap-3">
            <div style={{ background: "#FEF2F2" }} className="w-12 h-12 rounded-full flex items-center justify-center">
              <AlertTriangle size={22} color={C.error} />
            </div>
            <div style={{ color: C.ink }} className="text-base font-bold">Delete Material?</div>
            <p style={{ color: C.muted }} className="text-xs leading-normal">
              Are you sure you want to delete <span className="font-semibold text-gray-800">{deletingItem.materialName}</span>? This will remove all inventory records and is irreversible.
            </p>
            <div className="flex gap-2 mt-2 text-xs">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ background: C.surface, border: `1px solid ${C.border}`, flex: 1 }}
                className="py-2.5 rounded-lg font-semibold cursor-pointer text-gray-700 hover:bg-black/5 active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={mutationLoading}
                style={{ background: C.error, flex: 1 }}
                className="py-2.5 rounded-lg text-white font-semibold cursor-pointer disabled:opacity-50 hover:opacity-95 active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-red-500/30"
              >
                {mutationLoading ? "Deleting..." : "Delete Material"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InventoryPage;
