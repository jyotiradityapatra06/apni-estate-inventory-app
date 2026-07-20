import { useCallback, useEffect, useState } from "react";
import { deliveryApi } from "../../api/delivery.api";
import { inventoryApi } from "../../api/inventory.api";
import invoiceApi from "../../api/invoice.api";
import { notificationApi } from "../../api/notification.api";
import { expenseApi } from "../../api/expense.api";
import { salesReturnApi } from "../../api/salesReturn.api";
import { purchaseReturnApi } from "../../api/purchaseReturn.api";
import { purchaseApi } from "../../api/purchase.api";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import type { DashboardData, ResourceState } from "./dashboard.types";

const initial = <T,>(data: T): ResourceState<T> => ({ data, loading: true, error: null });
const message = (error: unknown) => error instanceof Error ? error.message : "Could not load this information.";

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const canViewInventory = hasPermission(user, "inventory:view");
  const canViewFinancials = user?.role.toUpperCase() !== "STAFF" && hasPermission(user, "sales:view");
  const canViewDeliveries = ["OWNER", "MANAGER"].includes(user?.role.toUpperCase() ?? "") && hasPermission(user, "deliveries:view");
  const canViewExpenses = hasPermission(user, "expenses:view");
  const canViewSalesReturns = hasPermission(user, "sales-returns:view");
  const canViewPurchaseReturns = hasPermission(user, "purchase-returns:view");

  const [inventory, setInventory] = useState(initial<any[]>([]));
  const [movements, setMovements] = useState(initial<any[]>([]));
  const [deliveries, setDeliveries] = useState(initial<any[]>([]));
  const [activity, setActivity] = useState(initial<any[]>([]));
  const [invoices, setInvoices] = useState(initial<any[]>([]));
  const [expenses, setExpenses] = useState(initial({todayExpenses:0,monthExpenses:0,totalPaid:0,pendingExpenses:0}));
  const [purchases, setPurchases] = useState(initial<{ data: any[]; summary: any }>({ data: [], summary: { totalPurchases: 0, pendingPayments: 0, thisMonthPurchase: 0, totalSuppliers: 0 } }));
  const [salesReturns, setSalesReturns] = useState(initial<any[]>([]));
  const [purchaseReturns, setPurchaseReturns] = useState(initial<any[]>([]));

  const load = useCallback(async () => {
    const tasks: Promise<void>[] = [];
    if (canViewInventory) {
      setInventory((state) => ({ ...state, loading: true, error: null }));
      setMovements((state) => ({ ...state, loading: true, error: null }));
      tasks.push(inventoryApi.getItems().then((response) => setInventory({ data: response.data ?? [], loading: false, error: null })).catch((error) => setInventory((state) => ({ ...state, loading: false, error: message(error) }))));
      tasks.push(inventoryApi.getAllTransactions().then((response) => setMovements({ data: response.data ?? [], loading: false, error: null })).catch((error) => setMovements((state) => ({ ...state, loading: false, error: message(error) }))));
    } else { setInventory({ data: [], loading: false, error: null }); setMovements({ data: [], loading: false, error: null }); }
    if (canViewDeliveries) {
      setDeliveries((state) => ({ ...state, loading: true, error: null }));
      tasks.push(deliveryApi.getDeliveries().then((response) => setDeliveries({ data: response.data ?? [], loading: false, error: null })).catch((error) => setDeliveries((state) => ({ ...state, loading: false, error: message(error) }))));
    } else setDeliveries({ data: [], loading: false, error: null });
    if (canViewFinancials) {
      setInvoices((state) => ({ ...state, loading: true, error: null }));
      setPurchases((state) => ({ ...state, loading: true, error: null }));
      tasks.push(invoiceApi.getAll().then((response) => setInvoices({ data: response.data ?? [], loading: false, error: null })).catch((error) => setInvoices((state) => ({ ...state, loading: false, error: message(error) }))));
      tasks.push(purchaseApi.list().then((response) => setPurchases({ data: { data: response.data ?? [], summary: response.summary }, loading: false, error: null })).catch((error) => setPurchases((state) => ({ ...state, loading: false, error: message(error) }))));
    } else {
      setInvoices({ data: [], loading: false, error: null });
      setPurchases({ data: { data: [], summary: { totalPurchases: 0, pendingPayments: 0, thisMonthPurchase: 0, totalSuppliers: 0 } }, loading: false, error: null });
    }
    if (canViewExpenses) {
      setExpenses((state) => ({ ...state, loading: true, error: null }));
      tasks.push(expenseApi.summary().then((response) => setExpenses({ data: response.data, loading: false, error: null })).catch((error) => setExpenses((state) => ({ ...state, loading: false, error: message(error) }))));
    } else setExpenses({ data: {todayExpenses:0,monthExpenses:0,totalPaid:0,pendingExpenses:0}, loading: false, error: null });
    if (canViewSalesReturns) {
      setSalesReturns((state) => ({ ...state, loading: true, error: null }));
      tasks.push(salesReturnApi.list().then((response) => setSalesReturns({ data: response.data ?? [], loading: false, error: null })).catch((error) => setSalesReturns((state) => ({ ...state, loading: false, error: message(error) }))));
    } else setSalesReturns({ data: [], loading: false, error: null });
    if (canViewPurchaseReturns) {
      setPurchaseReturns((state) => ({ ...state, loading: true, error: null }));
      tasks.push(purchaseReturnApi.list().then((response) => setPurchaseReturns({ data: response.data ?? [], loading: false, error: null })).catch((error) => setPurchaseReturns((state) => ({ ...state, loading: false, error: message(error) }))));
    } else setPurchaseReturns({ data: [], loading: false, error: null });

    setActivity((state) => ({ ...state, loading: true, error: null }));
    tasks.push(notificationApi.getNotifications().then((response) => setActivity({ data: response.data ?? [], loading: false, error: null })).catch((error) => setActivity((state) => ({ ...state, loading: false, error: message(error) }))));
    await Promise.all(tasks);
  }, [canViewDeliveries, canViewExpenses, canViewFinancials, canViewInventory, canViewSalesReturns, canViewPurchaseReturns, user?.id]);

  useEffect(() => { void load(); }, [load]);
  return { inventory, movements, deliveries, activity, invoices, expenses, purchases, salesReturns, purchaseReturns, canViewFinancials, canViewDeliveries, canViewExpenses, canViewSalesReturns, canViewPurchaseReturns, refresh: load };
}
