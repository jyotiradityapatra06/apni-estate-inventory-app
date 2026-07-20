import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";

interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ permission, fallback, children }) => {
  const { user } = useAuth();
  
  // OWNER has all permissions implicitly
  const hasAccess = user && (user.role === "OWNER" || user.permissions.includes(permission));

  if (!hasAccess) {
    if (fallback !== undefined) return <>{fallback}</>;
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PermissionGuard;
