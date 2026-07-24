import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import { C } from "../../constants/colors";

export const DeliveryRouteGuard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = React.useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      const role = user.role.toUpperCase();
      if (role !== "OWNER" && role !== "MANAGER") {
        if (role !== "DRIVER") {
          toast.error("You do not have permission to access Delivery Management.");
        }
        setShouldRedirect(true);
      }
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div
        style={{ background: C.bg }}
        className="flex flex-col items-center justify-center min-h-screen w-full select-none"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            style={{ borderTopColor: C.blue }}
            className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
          />
          <span style={{ color: C.muted }} className="text-xs font-semibold animate-pulse">
            Loading your session...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role.toUpperCase();
  if (role !== "OWNER" && role !== "MANAGER") {
    if (shouldRedirect) {
      return <Navigate to={role === "DRIVER" ? "/driver/trips" : "/inventory"} replace />;
    }
    return (
      <div
        style={{ background: C.bg }}
        className="flex flex-col items-center justify-center min-h-screen w-full select-none"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            style={{ borderTopColor: C.blue }}
            className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
          />
          <span style={{ color: C.muted }} className="text-xs font-semibold animate-pulse">
            Redirecting...
          </span>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default DeliveryRouteGuard;
