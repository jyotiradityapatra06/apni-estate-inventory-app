import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppLayout from "../layouts/AppLayout";
import DashboardPage from "../../pages/dashboard/DashboardPage";
import SalesPage from "../../pages/sales/SalesPage";
import InventoryPage from "../../pages/inventory/InventoryPage";
import DeliveriesPage from "../../pages/deliveries/DeliveriesPage";
import ManagementPage from "../../pages/management/ManagementPage";
import NotFoundPage from "../../pages/not-found/NotFoundPage";
import LoginPage from "../../pages/auth/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";
import PermissionGuard from "./PermissionGuard";
import AccessDeniedPage from "../../pages/not-found/AccessDeniedPage";
import { AuthProvider } from "../../context/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { getHomePathForRole } from "../../utils/permissions";

const HomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getHomePathForRole(user?.role)} replace />;
};

export const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
                <Route path="/sales" element={<SalesPage />} />
              </Route>
              
              <Route element={<PermissionGuard permission="inventory:view" />}>
                <Route path="/inventory" element={<InventoryPage />} />
              </Route>
              
              <Route element={<PermissionGuard permission="deliveries:view" />}>
                <Route path="/deliveries" element={<DeliveriesPage />} />
              </Route>
              
              {/* Management Page & Redirects */}
              <Route path="/management" element={<ManagementPage />} />
              <Route path="/profile" element={<Navigate to="/management" replace />} />
              <Route path="/team" element={<Navigate to="/management" replace />} />
              <Route path="/driver" element={<Navigate to="/unauthorized" replace />} />
            </Route>
          </Route>

          {/* Catch-all Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
export default AppRouter;
