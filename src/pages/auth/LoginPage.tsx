import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { C } from "../../constants/colors";
import { Building2, Mail, Lock, User, PlusCircle, LogIn, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getHomePathForRole } from "../../utils/permissions";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoLoadingRole, setDemoLoadingRole] = useState<"OWNER" | "MANAGER" | "STAFF" | "DRIVER" | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("session_expired_toast") === "true") {
      sessionStorage.removeItem("session_expired_toast");
      setError("Your session has expired. Please sign in again.");
      toast.error("Your session has expired. Please sign in again.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      let data: any;
      if (isRegister) {
        if (!name || !email || !password || !businessName) {
          throw new Error("All registration fields are required.");
        }
        data = await register({ name, email, password, businessName });
        toast.success("Account created successfully");
      } else {
        if (!email || !password) {
          throw new Error("Email and password are required.");
        }
        data = await login({ email, password });
        toast.success("Login successful");
      }
      const role = data?.user?.role;
      navigate(getHomePathForRole(role));
    } catch (err: any) {
      console.error("Authentication error:", err);
      const msg = err?.message || "An unexpected validation or network error occurred.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: "OWNER" | "MANAGER" | "STAFF" | "DRIVER") => {
    if (loading || demoLoadingRole) return;
    setDemoLoadingRole(role);
    setLoading(true);
    setError(null);

    const demoCredentials = {
      OWNER: { email: "owner@apniestate.com", password: "password" },
      MANAGER: { email: "manager@apniestate.com", password: "password" },
      STAFF: { email: "staff@apniestate.com", password: "password" },
      DRIVER: { email: "driver@apniestate.com", password: "password" },
    };

    try {
      const creds = demoCredentials[role];
      setEmail(creds.email);
      setPassword(creds.password);
      const data = await login({ email: creds.email, password: creds.password });
      toast.success("Login successful");
      const userRole = data?.user?.role;
      navigate(getHomePathForRole(userRole));
    } catch (err: any) {
      console.error("Demo login error:", err);
      const msg = err?.message || "An unexpected validation or network error occurred.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setDemoLoadingRole(null);
    }
  };

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.surface} 0%, #E2E8F0 100%)`,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      className="flex items-center justify-center min-h-screen w-full px-4 py-8 select-none"
    >
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        }}
        className="w-full max-w-md rounded-2xl overflow-hidden p-6 md:p-8 flex flex-col gap-6"
      >
        {/* Header branding */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md overflow-hidden bg-white">
            <img src="/brand/apni-estate-logo.jpeg" alt="APNI ESTATE Logo" className="w-full h-full object-cover" />
          </div>
          <h1 style={{ color: C.ink }} className="text-xl font-bold tracking-tight">
            Welcome to APNI ESTATE
          </h1>
          <p style={{ color: C.muted }} className="text-xs">
            Manage your construction supply business efficiently.
          </p>
        </div>

        {/* Tab triggers */}
        <div style={{ background: "rgba(0,0,0,0.03)" }} className="flex rounded-lg p-1">
          <button
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              background: !isRegister ? C.white : "transparent",
              color: !isRegister ? C.blue : C.muted,
              boxShadow: !isRegister ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
            }}
            className="flex-1 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <LogIn size={13} /> Sign In
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              background: isRegister ? C.white : "transparent",
              color: isRegister ? C.blue : C.muted,
              boxShadow: isRegister ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
            }}
            className="flex-1 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <PlusCircle size={13} /> Create Account
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            style={{ background: "#FEF2F2", border: `1px solid ${C.error}30` }}
            className="rounded-xl px-4 py-3 flex items-start gap-3"
          >
            <AlertCircle size={16} color={C.error} className="flex-shrink-0 mt-0.5" />
            <span style={{ color: "#991B1B" }} className="text-xs font-medium leading-snug">
              {error}
            </span>
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <>
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label style={{ color: C.muted }} className="text-[10px] font-bold uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none focus:border-blue-500 font-medium"
                  />
                  <User size={13} style={{ color: C.muted }} className="absolute left-3 top-3" />
                </div>
              </div>

              {/* Company Name */}
              <div className="flex flex-col gap-1.5">
                <label style={{ color: C.muted }} className="text-[10px] font-bold uppercase tracking-wider">
                  Business / Company Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shri Krishna Traders"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none focus:border-blue-500 font-medium"
                  />
                  <Building2 size={13} style={{ color: C.muted }} className="absolute left-3 top-3" />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label style={{ color: C.muted }} className="text-[10px] font-bold uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none focus:border-blue-500 font-medium"
              />
              <Mail size={13} style={{ color: C.muted }} className="absolute left-3 top-3" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label style={{ color: C.muted }} className="text-[10px] font-bold uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none focus:border-blue-500 font-medium"
              />
              <Lock size={13} style={{ color: C.muted }} className="absolute left-3 top-3" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ background: C.blue }}
            className="w-full mt-2 py-3 rounded-xl text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isRegister ? "Creating account..." : "Signing in..."}</span>
              </>
            ) : isRegister ? (
              "Create Account & Sign In"
            ) : (
              "Secure Log In"
            )}
          </button>
        </form>

        {/* Demo Access Section */}
        {!isRegister && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
            }}
            className="p-4 text-center flex flex-col gap-2.5"
          >
            <div className="flex flex-col gap-0.5">
              <span style={{ color: C.ink }} className="text-xs font-bold">
                Demo Access
              </span>
              <span style={{ color: C.muted }} className="text-[10px]">
                Choose a role to explore the application.
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["OWNER", "MANAGER", "STAFF", "DRIVER"] as const).map((role) => {
                const isSelectedLoading = demoLoadingRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin(role)}
                    className="px-2 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSelectedLoading && (
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{role.charAt(0) + role.slice(1).toLowerCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};
export default LoginPage;
