import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";

interface RoleGuardProps {
  allowedRoles: string[];
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, fallback, children }) => {
  const { user } = useAuth();
  const hasAccess = user && allowedRoles.includes(user.role);

  if (!hasAccess) {
    if (fallback !== undefined) return <>{fallback}</>;
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleGuard;
