import { useNavigate } from "react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { C } from "../../constants/colors";
import { Card } from "../../app/components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import { getHomePathForRole } from "../../utils/permissions";

export const AccessDeniedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturnHome = () => {
    const path = getHomePathForRole(user?.role);
    navigate(path, { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-12 text-center items-center min-h-[70vh]">
      <div className="mx-auto mb-4 p-3 bg-amber-50 rounded-full w-14 h-14 flex items-center justify-center">
        <ShieldAlert size={32} color={C.warning} />
      </div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-2">Access Denied</h1>
      <p style={{ color: C.muted }} className="text-sm mb-6 max-w-sm">
        You do not have permission to view this page. Please contact your administrator if you think this is an error.
      </p>
      
      {user && (
        <Card className="p-4 mb-6 w-full max-w-md">
          <div style={{ color: C.muted }} className="text-xs uppercase tracking-wider mb-1">Authenticated user</div>
          <div style={{ color: C.ink }} className="text-sm font-semibold truncate">
            {user.name} ({user.email})
          </div>
          <div style={{ color: C.muted }} className="text-xs mt-1">
            Role: <span className="font-semibold" style={{ color: C.blue }}>{user.role}</span>
          </div>
        </Card>
      )}

      <button
        onClick={handleReturnHome}
        style={{ background: C.blue }}
        className="py-3 px-6 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer w-full max-w-md hover:opacity-95 transition-all"
      >
        <ArrowLeft size={16} /> Return to Permitted Home
      </button>
    </div>
  );
};
export default AccessDeniedPage;
