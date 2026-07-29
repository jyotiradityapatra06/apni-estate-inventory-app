import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import {
  Building2,
  Mail,
  Lock,
  User,
  PlusCircle,
  LogIn,
  AlertCircle,
  Boxes,
  Receipt,
  ShoppingBag,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
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
  const [demoLoadingRole, setDemoLoadingRole] = useState<"OWNER" | "MANAGER" | "STAFF" | null>(null);

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

  const handleDemoLogin = async (role: "OWNER" | "MANAGER" | "STAFF") => {
    if (loading || demoLoadingRole) return;
    setDemoLoadingRole(role);
    setLoading(true);
    setError(null);

    const demoCredentials = {
      OWNER: { email: "owner@apniestate.com", password: "password" },
      MANAGER: { email: "manager@apniestate.com", password: "password" },
      STAFF: { email: "staff@apniestate.com", password: "password" },
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

  const featureHighlights = [
    { icon: Boxes, title: "Stock & Inventory Control", desc: "Track materials, stock levels and godowns in real time." },
    { icon: Receipt, title: "GST Billing & Invoicing", desc: "Create professional GST and non-GST invoices." },
    { icon: ShoppingBag, title: "Purchase & Supplier Management", desc: "Manage suppliers, purchase orders and payments." },
    { icon: BarChart3, title: "Financial Reports", desc: "Monitor sales, collections and business performance." },
  ];

  const compactPills = [
    { icon: Boxes, label: "Inventory" },
    { icon: Receipt, label: "Billing" },
    { icon: BarChart3, label: "Reports" },
  ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-12 select-none">
      <div className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        
        {/* Left Column: Brand & ERP Product Presentation */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-7 text-left">
          {/* Logo & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-md overflow-hidden bg-card border border-border shrink-0">
              <img src="/brand/apni-estate-logo.jpeg" alt="APNI ESTATE Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-foreground block leading-none">APNI ESTATE</span>
              <span className="block text-[10px] sm:text-xs text-orange-600 font-extrabold uppercase tracking-wider mt-1">
                Construction ERP
              </span>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              Run your construction supply business <span className="text-orange-600 dark:text-orange-500">smarter</span>
            </h1>
            <p className="text-xs sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-xl font-medium">
              Inventory, billing, purchases, payments and reports in one simple ERP platform.
            </p>
          </div>

          {/* Compact Feature Pills for Mobile */}
          <div className="flex items-center gap-2 pt-1 lg:hidden">
            {compactPills.map((pill, i) => {
              const Icon = pill.icon;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/60 px-3 py-1 text-[11px] font-extrabold text-orange-700 dark:text-orange-300"
                >
                  <Icon size={13} className="text-orange-600 dark:text-orange-400" />
                  {pill.label}
                </span>
              );
            })}
          </div>

          {/* Refined Desktop Feature Cards (>= 1024px) */}
          <div className="hidden lg:grid grid-cols-2 gap-4 pt-2">
            {featureHighlights.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex gap-3.5 items-start p-4 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-orange-500/50 transition-colors">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-extrabold text-foreground">{feat.title}</h2>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed font-medium">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Footer for Desktop */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-muted-foreground pt-2">
            <ShieldCheck size={18} className="text-green-600 shrink-0" />
            <span>Secure GST & Non-GST Cloud Solution for Building Material Suppliers</span>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-card border border-border/90 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl space-y-6">
            {/* Header & Actions Toggle */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {isRegister ? "Get Started with APNI ESTATE" : "Welcome Back"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                  {isRegister ? "Set up your business ERP account in seconds" : "Sign in to your APNI ESTATE account"}
                </p>
              </div>

              {/* Action Tabs: Primary = Create Business Account, Secondary = Login */}
              <div className="flex rounded-xl bg-muted p-1 gap-1 min-h-[46px]">
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(null); }}
                  className={`flex-1 min-h-[40px] rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    isRegister
                      ? "bg-orange-600 text-white shadow-sm font-black"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <PlusCircle size={15} /> Create Business Account
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(null); }}
                  className={`flex-1 min-h-[40px] rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    !isRegister
                      ? "bg-card text-foreground border border-border/80 shadow-sm font-black"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LogIn size={15} /> Login
                </button>
              </div>
            </div>

            {/* Error Alert Box */}
            {error && (
              <div className="rounded-xl p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-3 text-xs">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span className="text-red-800 dark:text-red-300 font-semibold leading-snug">
                  {error}
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full min-h-[48px] pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold transition-colors"
                      />
                      <User size={16} className="text-muted-foreground absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  {/* Business Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Business / Company Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shri Krishna Traders"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full min-h-[48px] pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold transition-colors"
                      />
                      <Building2 size={16} className="text-muted-foreground absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[48px] pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold transition-colors"
                  />
                  <Mail size={16} className="text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[48px] pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold transition-colors"
                  />
                  <Lock size={16} className="text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isRegister ? "Creating account..." : "Signing in..."}</span>
                  </>
                ) : isRegister ? (
                  "Create Business Account"
                ) : (
                  "Login to Business Account"
                )}
              </button>
            </form>

            {/* Explore Demo Workspace Section */}
            {!isRegister && (
              <div className="pt-4 border-t border-border space-y-3.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                    Explore Demo Workspace
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 font-medium leading-snug">
                    Experience APNI ESTATE ERP with different business roles.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Primary Highlighted: Owner Demo */}
                  <div
                    onClick={() => !loading && handleDemoLogin("OWNER")}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                      demoLoadingRole === "OWNER"
                        ? "opacity-80"
                        : "hover:border-orange-500 hover:shadow-xs"
                    } border-orange-300 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-950/20`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
                        <span>Owner Demo</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-orange-600 text-white uppercase tracking-wider">
                          Recommended
                        </span>
                      </div>
                      {demoLoadingRole === "OWNER" ? (
                        <div className="w-3.5 h-3.5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-[10px] sm:text-xs font-extrabold text-orange-600 dark:text-orange-400">
                          Try Owner &rarr;
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-normal font-medium">
                      Full ERP access including billing, finance, reports and management.
                    </p>
                  </div>

                  {/* Secondary: Manager & Staff Demos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Manager Demo */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin("MANAGER")}
                      className="p-3 text-left rounded-xl border border-border bg-background hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-xs text-foreground">Manager Demo</span>
                        {demoLoadingRole === "MANAGER" && (
                          <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight font-medium">
                        Inventory, sales and daily operations.
                      </p>
                    </button>

                    {/* Staff Demo */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin("STAFF")}
                      className="p-3 text-left rounded-xl border border-border bg-background hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-xs text-foreground">Staff Demo</span>
                        {demoLoadingRole === "STAFF" && (
                          <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight font-medium">
                        Billing and stock activities.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Footer */}
      <footer className="w-full text-center py-4 text-[11px] font-extrabold text-muted-foreground border-t border-border/40 mt-6 lg:hidden">
        Secure • Reliable • Built for Construction Suppliers
      </footer>
    </div>
  );
};

export default LoginPage;
