import { useNavigate, useLocation } from "react-router";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { C } from "../../constants/colors";
import { Card } from "../../app/components/common/Card";

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-12 text-center">
      <div className="mx-auto mb-4 p-3 bg-red-50 rounded-full w-14 h-14 flex items-center justify-center">
        <AlertCircle size={32} color={C.error} />
      </div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-2">Page Not Found</h1>
      <p style={{ color: C.muted }} className="text-sm mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Card className="p-4 mb-6">
        <div style={{ color: C.muted }} className="text-xs uppercase tracking-wider mb-1">Requested path</div>
        <div style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-sm font-semibold truncate">
          {location.pathname}
        </div>
      </Card>
      <button
        onClick={() => navigate("/dashboard")}
        style={{ background: C.blue }}
        className="py-3 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer w-full"
      >
        <ArrowLeft size={16} /> Return to Dashboard
      </button>
    </div>
  );
};
export default NotFoundPage;
