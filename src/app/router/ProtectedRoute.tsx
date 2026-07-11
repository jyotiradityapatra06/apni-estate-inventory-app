import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { C } from "../../constants/colors";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{ background: C.bg }}
        className="flex flex-col items-center justify-center min-h-screen w-full select-none"
      >
        <div className="flex flex-col items-center gap-3">
          {/* A premium loading spinner spinner */}
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.isActive) {
    logout();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
