import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppLayout from "../layouts/AppLayout";
import DashboardPage from "../../pages/dashboard/DashboardPage";
import SalesPage from "../../pages/sales/SalesPage";
import InventoryPage from "../../pages/inventory/InventoryPage";
import DeliveriesPage from "../../pages/deliveries/DeliveriesPage";
import ProfilePage from "../../pages/profile/ProfilePage";
import NotFoundPage from "../../pages/not-found/NotFoundPage";
import LoginPage from "../../pages/auth/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "../../context/AuthContext";

export const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Redirect / to /dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/deliveries" element={<DeliveriesPage />} />
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
