import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppLayout from "../layouts/AppLayout";
import DashboardPage from "../../pages/dashboard/DashboardPage";
import SalesPage from "../../pages/sales/SalesPage";
import InventoryPage from "../../pages/inventory/InventoryPage";
import DeliveriesPage from "../../pages/deliveries/DeliveriesPage";
import ProfilePage from "../../pages/profile/ProfilePage";
import TeamPage from "../../pages/team/TeamPage";
import NotFoundPage from "../../pages/not-found/NotFoundPage";
import LoginPage from "../../pages/auth/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";
import PermissionGuard from "./PermissionGuard";
import DriverHomePage from "../../pages/driver/DriverHomePage";
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
              
              {/* Driver Dashboard */}
              <Route element={<RoleGuard allowedRoles={["DRIVER"]} />}>
                <Route path="/driver" element={<DriverHomePage />} />
              </Route>
              
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

              <Route element={<PermissionGuard permission="team:manage" />}>
                <Route path="/team" element={<TeamPage />} />
              </Route>
              
              {/* Profile Page - standard auth access */}
              <Route path="/profile" element={<ProfilePage />} />
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
