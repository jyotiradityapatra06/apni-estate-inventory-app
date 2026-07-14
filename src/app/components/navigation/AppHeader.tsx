import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Bell, Search, Trash2, User, X } from "lucide-react";
import { C } from "../../../constants/colors";
import {
  notificationApi,
  type NotificationData,
} from "../../../api/notification.api";

export interface AppHeaderProps {
  isDark: boolean;
}

export const AppHeader = ({ isDark }: AppHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isClearingNotifications, setIsClearingNotifications] =
    useState(false);
  const [notificationError, setNotificationError] = useState("");

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/sales":
        return "Sales & Ledger";
      case "/inventory":
        return "Stock";
      case "/deliveries":
        return "Deliveries";
      case "/management":
      case "/profile":
        return "Management";
      default:
        return "ERP System";
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoadingNotifications(true);
      setNotificationError("");

      const response = await notificationApi.getNotifications();
      setNotifications(response.data ?? []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotificationError("Could not load notifications. Please try again.");
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  const handleNotificationClick = () => {
    setIsNotificationOpen((previous) => !previous);
  };

  const handleClearNotifications = async () => {
    if (notifications.length === 0 || isClearingNotifications) {
      return;
    }

    const confirmed = window.confirm(
      "Clear all notifications? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsClearingNotifications(true);
      setNotificationError("");

      const response = await notificationApi.clearNotifications();

      if (response.success) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      setNotificationError(
        "Could not clear notifications. Please try again."
      );
    } finally {
      setIsClearingNotifications(false);
    }
  };

  // Load notifications when the header first appears.
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Refresh notification count after delivery or payment changes.
  useEffect(() => {
    const handleNotificationRefresh = () => {
      loadNotifications();
    };

    window.addEventListener(
      "notifications:refresh",
      handleNotificationRefresh
    );

    return () => {
      window.removeEventListener(
        "notifications:refresh",
        handleNotificationRefresh
      );
    };
  }, [loadNotifications]);

  // Close notification panel after clicking outside it.
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Close notification panel when page changes.
  useEffect(() => {
    setIsNotificationOpen(false);
  }, [location.pathname]);

  const formatNotificationTime = (createdAt: string) => {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const title = getPageTitle(location.pathname);
  const textColor = isDark ? "white" : C.ink;
  const borderColor = isDark ? C.darkBorder : C.border;

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <header
      style={{
        background: isDark ? C.darkCard : C.white,
        borderBottom: `1px solid ${borderColor}`,
      }}
      className="fixed top-0 left-0 right-0 md:left-20 lg:left-60 h-16 z-30 flex select-none items-center justify-between px-6"
    >
      {/* Page title */}
      <div>
        <h1
          style={{ color: textColor }}
          className="text-base font-bold lg:text-lg"
        >
          {title}
        </h1>
      </div>

      {/* Header controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Search stock, deliveries..."
            style={{
              background: isDark ? C.dark : C.surface,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
            className="w-64 rounded-lg py-1.5 pl-9 pr-3 text-xs outline-none"
          />

          <Search
            size={14}
            style={{ color: C.muted }}
            className="absolute left-3 top-2.5"
          />
        </div>

        <button
          type="button"
          aria-label="Search"
          style={{
            color: isDark ? "rgba(255,255,255,0.7)" : C.muted,
          }}
          className="cursor-pointer rounded-lg p-2 transition hover:bg-black/5 lg:hidden"
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={handleNotificationClick}
            aria-label="Open notifications"
            aria-expanded={isNotificationOpen}
            style={{
              background: isDark
                ? "rgba(255,255,255,0.06)"
                : C.surface,
              border: `1px solid ${borderColor}`,
            }}
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-95"
          >
            <Bell size={16} color={isDark ? "white" : C.ink} />

            {unreadCount > 0 && (
              <span
                style={{ background: C.error }}
                className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold leading-none text-white"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div
              style={{
                background: isDark ? C.darkCard : C.white,
                border: `1px solid ${borderColor}`,
              }}
              className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-2xl shadow-2xl"
            >
              {/* Panel header */}
              <div
                style={{
                  borderBottom: `1px solid ${borderColor}`,
                }}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <h2
                    style={{ color: textColor }}
                    className="text-base font-bold"
                  >
                    Notifications
                  </h2>

                  <p style={{ color: C.muted }} className="mt-0.5 text-xs">
                    Latest business updates
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearNotifications}
                      disabled={isClearingNotifications}
                      aria-label="Clear all notifications"
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} />

                      <span>
                        {isClearingNotifications
                          ? "Clearing..."
                          : "Clear all"}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen(false)}
                    aria-label="Close notifications"
                    style={{
                      background: isDark
                        ? "rgba(255,255,255,0.08)"
                        : C.surface,
                      color: C.muted,
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Panel content */}
              <div className="max-h-[430px] overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="px-5 py-12 text-center">
                    <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

                    <p style={{ color: C.muted }} className="text-sm">
                      Loading notifications...
                    </p>
                  </div>
                ) : notificationError ? (
                  <div className="px-5 py-10 text-center">
                    <p
                      style={{ color: C.error }}
                      className="text-sm font-medium"
                    >
                      {notificationError}
                    </p>

                    <button
                      type="button"
                      onClick={loadNotifications}
                      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Bell size={22} />
                    </div>

                    <p
                      style={{ color: textColor }}
                      className="font-semibold"
                    >
                      No notifications
                    </p>

                    <p style={{ color: C.muted }} className="mt-1 text-sm">
                      New business updates will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      style={{
                        borderBottom: `1px solid ${borderColor}`,
                        background:
                          !notification.isRead && !isDark
                            ? "rgba(37, 99, 235, 0.05)"
                            : "transparent",
                      }}
                      className="px-5 py-4 transition hover:bg-black/[0.03]"
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <Bell size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3
                              style={{ color: textColor }}
                              className="text-sm font-bold"
                            >
                              {notification.title}
                            </h3>

                            {!notification.isRead && (
                              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>

                          <p
                            style={{ color: C.muted }}
                            className="mt-1 text-sm leading-5"
                          >
                            {notification.message}
                          </p>

                          <p
                            style={{ color: C.muted }}
                            className="mt-2 text-xs opacity-75"
                          >
                            {formatNotificationTime(
                              notification.createdAt
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Refresh button */}
              {notifications.length > 0 && !isLoadingNotifications && (
                <div
                  style={{
                    borderTop: `1px solid ${borderColor}`,
                  }}
                  className="px-4 py-3"
                >
                  <button
                    type="button"
                    onClick={loadNotifications}
                    className="w-full rounded-lg py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    Refresh Notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account */}
        <button
          type="button"
          onClick={() => navigate("/management")}
          aria-label="Open account management"
          style={{
            background: isDark
              ? "rgba(255,255,255,0.06)"
              : C.surface,
            border: `1px solid ${borderColor}`,
          }}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-95"
        >
          <User size={16} color={isDark ? "white" : C.ink} />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;