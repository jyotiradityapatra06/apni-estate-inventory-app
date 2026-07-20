import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppLayout from "../layouts/AppLayout";
import NotFoundPage from "../../pages/not-found/NotFoundPage";
import LoginPage from "../../pages/auth/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import PermissionGuard from "./PermissionGuard";
import DeliveryRouteGuard from "./DeliveryRouteGuard";
import AccessDeniedPage from "../../pages/not-found/AccessDeniedPage";
import { AuthProvider } from "../../context/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { getHomePathForRole } from "../../utils/permissions";
import RoleGuard from "./RoleGuard";

const DashboardPage=lazy(()=>import("../../pages/dashboard/DashboardPage"));
const InventoryPage=lazy(()=>import("../../pages/inventory/InventoryPage"));
const DeliveriesPage=lazy(()=>import("../../pages/deliveries/DeliveriesPage"));
const ManagementPage=lazy(()=>import("../../pages/management/ManagementPage"));
const CustomersPage=lazy(()=>import("../../pages/customers/CustomersPage"));
const SuppliersPage=lazy(()=>import("../../pages/suppliers/SuppliersPage"));
const GodownsPage=lazy(()=>import("../../pages/godowns/GodownsPage"));
const SalesOrdersPage=lazy(()=>import("../../pages/sales-orders/SalesOrdersPage"));
const CreateSalesOrderPage=lazy(()=>import("../../pages/sales-orders/CreateSalesOrderPage"));
const SalesOrderDetailPage=lazy(()=>import("../../pages/sales-orders/SalesOrderDetailPage"));
const SalesReturnsPage=lazy(()=>import("../../pages/returns/SalesReturnsPage"));
const CreateSalesReturnPage=lazy(()=>import("../../pages/returns/CreateSalesReturnPage"));
const SalesReturnDetailPage=lazy(()=>import("../../pages/returns/SalesReturnDetailPage"));
const PurchaseReturnsPage=lazy(()=>import("../../pages/returns/PurchaseReturnsPage"));
const CreatePurchaseReturnPage=lazy(()=>import("../../pages/returns/CreatePurchaseReturnPage"));
const PurchaseReturnDetailPage=lazy(()=>import("../../pages/returns/PurchaseReturnDetailPage"));
const InvoicesPage=lazy(()=>import("../../pages/invoices/InvoicesPage"));
const CreateInvoicePage=lazy(()=>import("../../pages/invoices/CreateInvoicePage"));
const InvoiceDetailPage=lazy(()=>import("../../pages/invoices/InvoiceDetailPage"));
const PurchaseOrdersPage=lazy(()=>import("../../pages/purchases/PurchaseOrdersPage"));
const CreatePurchasePage=lazy(()=>import("../../pages/purchases/CreatePurchasePage"));
const PurchaseDetailsPage=lazy(()=>import("../../pages/purchases/PurchaseDetailsPage"));
const PurchaseHistoryPage=lazy(()=>import("../../pages/purchases/PurchaseHistoryPage"));
const ReceivablesPage=lazy(()=>import("../../pages/financials/ReceivablesPage"));
const PayablesPage=lazy(()=>import("../../pages/financials/PayablesPage"));
const LedgerPage=lazy(()=>import("../../pages/financials/LedgerPage"));
const PaymentHistoryPage=lazy(()=>import("../../pages/financials/PaymentHistoryPage"));
const CustomerCreditPage=lazy(()=>import("../../pages/financials/CustomerCreditPage"));
const ExpensesPage=lazy(()=>import("../../pages/expenses/ExpensesPage"));
const ExpenseFormPage=lazy(()=>import("../../pages/expenses/ExpenseFormPage"));
const ExpenseDetailsPage=lazy(()=>import("../../pages/expenses/ExpenseDetailsPage"));
const ExpenseCategoriesPage=lazy(()=>import("../../pages/expenses/ExpenseCategoriesPage"));
const PaymentsPage=lazy(()=>import("../../pages/payments/PaymentsPage"));
const CreatePaymentPage=lazy(()=>import("../../pages/payments/CreatePaymentPage"));
const PaymentDetailPage=lazy(()=>import("../../pages/payments/PaymentDetailPage"));
const ReportsPage=lazy(()=>import("../../pages/reports/ReportsPage"));
const SalesReportPage=lazy(()=>import("../../pages/reports/SalesReportPage"));
const PurchaseReportPage=lazy(()=>import("../../pages/reports/PurchaseReportPage"));
const InventoryReportPage=lazy(()=>import("../../pages/reports/InventoryReportPage"));
const StockValuationReportPage=lazy(()=>import("../../pages/reports/StockValuationReportPage"));
const CustomerOutstandingReportPage=lazy(()=>import("../../pages/reports/CustomerOutstandingReportPage"));
const SupplierOutstandingReportPage=lazy(()=>import("../../pages/reports/SupplierOutstandingReportPage"));
const ExpenseReportPage=lazy(()=>import("../../pages/reports/ExpenseReportPage"));
const GstSummaryReportPage=lazy(()=>import("../../pages/reports/GstSummaryReportPage"));
const ProfitLossReportPage=lazy(()=>import("../../pages/reports/ProfitLossReportPage"));
const BusinessOverviewReportPage=lazy(()=>import("../../pages/reports/BusinessOverviewReportPage"));
const MaterialDetailPage=lazy(()=>import("../../features/materials/MaterialDetailPage").then(m=>({default:m.MaterialDetailPage})));
const MaterialFormPage=lazy(()=>import("../../features/materials/MaterialFormPage").then(m=>({default:m.MaterialFormPage})));
const CustomerDetailPage=lazy(()=>import("../../features/customers/CustomerDetailPage").then(m=>({default:m.CustomerDetailPage})));
const CustomerFormPage=lazy(()=>import("../../features/customers/CustomerFormPage").then(m=>({default:m.CustomerFormPage})));
const SupplierDetailPage=lazy(()=>import("../../features/suppliers/SupplierDetailPage").then(m=>({default:m.SupplierDetailPage})));
const SupplierFormPage=lazy(()=>import("../../features/suppliers/SupplierFormPage").then(m=>({default:m.SupplierFormPage})));
const GodownDetailPage=lazy(()=>import("../../features/godowns/GodownDetailPage").then(m=>({default:m.GodownDetailPage})));
const GodownFormPage=lazy(()=>import("../../features/godowns/GodownFormPage").then(m=>({default:m.GodownFormPage})));
const TransferListPage=lazy(()=>import("../../features/transfers/TransferListPage").then(m=>({default:m.TransferListPage})));
const TransferFormPage=lazy(()=>import("../../features/transfers/TransferFormPage").then(m=>({default:m.TransferFormPage})));
const TransferDetailPage=lazy(()=>import("../../features/transfers/TransferDetailPage").then(m=>({default:m.TransferDetailPage})));
const RouteLoading=()=> <div className="space-y-3" role="status" aria-label="Loading page"><div className="h-8 w-48 animate-pulse rounded bg-slate-200"/><div className="h-32 animate-pulse rounded-xl bg-slate-200"/><div className="h-32 animate-pulse rounded-xl bg-slate-200"/></div>;

const HomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getHomePathForRole(user?.role)} replace />;
};

export const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoading/>}><Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<AccessDeniedPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Redirect / to role-based home */}
              <Route path="/" element={<HomeRedirect />} />
              
              {/* Permission Guarded Routes */}
              <Route element={<PermissionGuard permission="dashboard:view" />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
              
              <Route element={<PermissionGuard permission="sales:view" />}>
                <Route path="/sales" element={<SalesOrdersPage />} />
                <Route path="/sales-orders" element={<SalesOrdersPage />} />
                <Route path="/sales-orders/:id" element={<SalesOrderDetailPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              </Route>
              <Route element={<PermissionGuard permission="sales-returns:view" />}>
                <Route path="/sales-returns" element={<SalesReturnsPage />} />
                <Route path="/sales-returns/:id" element={<SalesReturnDetailPage />} />
              </Route>
              <Route element={<PermissionGuard permission="sales-returns:create" />}>
                <Route path="/sales-returns/new" element={<CreateSalesReturnPage />} />
              </Route>
              <Route element={<PermissionGuard permission="purchase-returns:view" />}>
                <Route path="/purchase-returns" element={<PurchaseReturnsPage />} />
                <Route path="/purchase-returns/:id" element={<PurchaseReturnDetailPage />} />
              </Route>
              <Route element={<PermissionGuard permission="purchase-returns:create" />}>
                <Route path="/purchase-returns/new" element={<CreatePurchaseReturnPage />} />
              </Route>
              <Route element={<PermissionGuard permission="sales:manage" />}><Route path="/sales-orders/new" element={<CreateSalesOrderPage />} /><Route path="/invoices/new" element={<CreateInvoicePage />} /></Route>
              <Route element={<PermissionGuard permission="purchases:view" />}><Route path="/purchases" element={<PurchaseOrdersPage />} /><Route path="/purchases/:id" element={<PurchaseDetailsPage />} /><Route path="/purchase-history" element={<PurchaseHistoryPage />} /></Route>
              <Route element={<PermissionGuard permission="purchases:manage" />}><Route path="/purchases/new" element={<CreatePurchasePage />} /></Route>
              <Route element={<PermissionGuard permission="financials:view" />}><Route path="/financials/receivables" element={<ReceivablesPage/>}/><Route path="/financials/payables" element={<PayablesPage/>}/><Route path="/financials/ledger" element={<LedgerPage/>}/><Route path="/financials/payments" element={<PaymentHistoryPage/>}/><Route path="/financials/customers/:id" element={<CustomerCreditPage/>}/><Route path="/payments" element={<PaymentsPage/>}/><Route path="/payments/new" element={<CreatePaymentPage/>}/><Route path="/payments/:id" element={<PaymentDetailPage/>}/></Route>
              <Route element={<PermissionGuard permission="expenses:view" />}><Route path="/expenses" element={<ExpensesPage/>}/><Route path="/expenses/:id" element={<ExpenseDetailsPage/>}/><Route path="/expense-categories" element={<ExpenseCategoriesPage/>}/></Route>
              <Route element={<PermissionGuard permission="expenses:manage" />}><Route path="/expenses/new" element={<ExpenseFormPage mode="create"/>}/><Route path="/expenses/:id/edit" element={<ExpenseFormPage mode="edit"/>}/></Route>
              <Route element={<PermissionGuard permission="reports:operational" />}><Route path="/reports" element={<ReportsPage/>}/><Route path="/reports/sales" element={<SalesReportPage/>}/><Route path="/reports/purchases" element={<PurchaseReportPage/>}/><Route path="/reports/inventory" element={<InventoryReportPage/>}/><Route path="/reports/expenses" element={<ExpenseReportPage/>}/></Route>
              <Route element={<PermissionGuard permission="reports:financial" />}><Route path="/reports/overview" element={<BusinessOverviewReportPage/>}/><Route path="/reports/stock-valuation" element={<StockValuationReportPage/>}/><Route path="/reports/customer-outstanding" element={<CustomerOutstandingReportPage/>}/><Route path="/reports/supplier-outstanding" element={<SupplierOutstandingReportPage/>}/><Route path="/reports/gst" element={<GstSummaryReportPage/>}/><Route path="/reports/profit-loss" element={<ProfitLossReportPage/>}/></Route>
              
              <Route element={<PermissionGuard permission="inventory:view" />}>
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/materials" element={<InventoryPage />} />
                <Route path="/materials/:id" element={<MaterialDetailPage />} />
                <Route path="/inventory/:id" element={<MaterialDetailPage />} />
              </Route>
              <Route element={<PermissionGuard permission="inventory:create" />}>
                <Route path="/materials/new" element={<MaterialFormPage mode="create" />} />
              </Route>
              <Route element={<PermissionGuard permission="inventory:update" />}>
                <Route path="/materials/:id/edit" element={<MaterialFormPage mode="edit" />} />
              </Route>

              <Route element={<PermissionGuard permission="customers:view" />}>
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
              </Route>
              <Route element={<PermissionGuard permission="customers:create" />}><Route path="/customers/new" element={<CustomerFormPage mode="create" />} /></Route>
              <Route element={<PermissionGuard permission="customers:update" />}><Route path="/customers/:id/edit" element={<CustomerFormPage mode="edit" />} /></Route>

              <Route element={<PermissionGuard permission="suppliers:view" />}>
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
              </Route>
              <Route element={<PermissionGuard permission="suppliers:create" />}><Route path="/suppliers/new" element={<SupplierFormPage mode="create" />} /></Route>
              <Route element={<PermissionGuard permission="suppliers:update" />}><Route path="/suppliers/:id/edit" element={<SupplierFormPage mode="edit" />} /></Route>

              <Route element={<PermissionGuard permission="godowns:view" />}>
                <Route path="/godowns" element={<GodownsPage />} />
                <Route path="/godowns/:id" element={<GodownDetailPage />} />
                <Route path="/stock-transfers" element={<TransferListPage />} />
                <Route path="/transfers" element={<TransferListPage />} />
                <Route path="/transfers/:id" element={<TransferDetailPage />} />
              </Route>
              <Route element={<PermissionGuard permission="godowns:create" />}><Route path="/godowns/new" element={<GodownFormPage mode="create" />} /></Route>
              <Route element={<PermissionGuard permission="godowns:update" />}><Route path="/godowns/:id/edit" element={<GodownFormPage mode="edit" />} /></Route>
              <Route element={<PermissionGuard permission="godowns:transfer" />}><Route path="/transfers/new" element={<TransferFormPage />} /></Route>
              
              <Route element={<DeliveryRouteGuard />}>
                <Route path="/delivery" element={<DeliveriesPage />} />
                <Route path="/deliveries" element={<DeliveriesPage />} />
              </Route>
              
              {/* Management Page & Redirects */}
              <Route element={<RoleGuard allowedRoles={["OWNER", "MANAGER"]} />}>
                <Route path="/management" element={<ManagementPage />} />
                <Route path="/management/team" element={<ManagementPage />} />
              </Route>
              <Route path="/more" element={<HomeRedirect />} />
              <Route path="/profile" element={<Navigate to="/management" replace />} />
              <Route path="/team" element={<Navigate to="/management/team" replace />} />
              <Route path="/driver" element={<Navigate to="/unauthorized" replace />} />
            </Route>
          </Route>

          {/* Catch-all Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes></Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};
export default AppRouter;
