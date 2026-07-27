import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { DesktopSidebar } from "../components/navigation/DesktopSidebar";
import { MobileBottomNavigation } from "../components/navigation/MobileBottomNavigation";
import { AppHeader } from "../components/navigation/AppHeader";
import { MobileQuickActionFab } from "../components/navigation/MobileQuickActionFab";
import { MobileMoreSheet } from "../components/navigation/MobileMoreSheet";
import { useTheme } from "../../hooks/useTheme";

export const AppLayout = () => {
  const location = useLocation();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      className="h-[100dvh] w-full overflow-hidden relative bg-[#F8FAFC] dark:bg-[#020617] text-foreground dark:text-slate-100 transition-colors duration-200"
    >
      {/* Desktop / Tablet Left Sidebar */}
      <DesktopSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main App Area */}
      <div className={`flex h-[100dvh] flex-col overflow-hidden relative transition-all duration-300 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[248px]"}`}>
        {/* Top Header */}
        <AppHeader isDark={isDark} />

        {/* Scrollable Page Body - SINGLE MAIN VERTICAL SCROLLER */}
        <main
          ref={mainScrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain w-full pb-[calc(84px+max(16px,env(safe-area-inset-bottom)))] lg:pb-8 scroll-smooth-mobile"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          {/* Centered Content Container */}
          <div className="max-w-[1440px] mx-auto w-full px-3 py-3 md:px-6 md:py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileBottomNavigation isDark={isDark} onOpenMore={() => setMoreOpen(true)} />
      </div>
      <MobileQuickActionFab />
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} onNotifications={() => window.dispatchEvent(new Event("notifications:open"))} />
    </div>
  );
};

export default AppLayout;
