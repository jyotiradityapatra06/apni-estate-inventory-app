import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import { DesktopSidebar } from "../components/navigation/DesktopSidebar";
import { MobileBottomNavigation } from "../components/navigation/MobileBottomNavigation";
import { AppHeader } from "../components/navigation/AppHeader";
import { C } from "../../constants/colors";

export const AppLayout = () => {
  const location = useLocation();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const isDark = location.pathname === "/deliveries";

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div
      style={{
        background: isDark ? C.dark : C.bg,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      className="flex h-screen w-full overflow-hidden select-none"
    >
      {/* Desktop / Tablet Left Sidebar */}
      <DesktopSidebar isDark={isDark} />

      {/* Main App Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Desktop / Tablet Top Header */}
        <AppHeader isDark={isDark} />

        {/* Scrollable Page Body */}
        <main
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden w-full pb-16 md:pb-0"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Centered Desktop Content Container */}
          <div className="max-w-[1440px] mx-auto w-full px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-40">
          <MobileBottomNavigation isDark={isDark} />
        </div>
      </div>
    </div>
  );
};
export default AppLayout;
