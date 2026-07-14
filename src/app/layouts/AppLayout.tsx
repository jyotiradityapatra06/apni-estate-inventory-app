import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import { DesktopSidebar } from "../components/navigation/DesktopSidebar";
import { MobileBottomNavigation } from "../components/navigation/MobileBottomNavigation";
import { AppHeader } from "../components/navigation/AppHeader";
import { C } from "../../constants/colors";

export const AppLayout = () => {
  const location = useLocation();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const isDark = false;

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div
      style={{
        background: isDark ? C.dark : C.bg,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      className="h-screen w-full overflow-hidden select-none relative"
    >
      {/* Desktop / Tablet Left Sidebar */}
      <DesktopSidebar isDark={isDark} />

      {/* Main App Area */}
      <div className="flex flex-col h-screen overflow-hidden relative md:ml-20 lg:ml-60">
        {/* Desktop / Tablet Top Header */}
        <AppHeader isDark={isDark} />

        {/* Scrollable Page Body - THE SINGLE MAIN VERTICAL SCROLLER */}
        <main
          ref={mainScrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain w-full pb-24 md:pb-6"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          {/* Centered Desktop Content Container */}
          <div className="max-w-[1440px] mx-auto w-full px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileBottomNavigation isDark={isDark} />
      </div>
    </div>
  );
};
export default AppLayout;
