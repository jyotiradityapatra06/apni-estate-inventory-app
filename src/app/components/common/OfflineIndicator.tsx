import React from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus } from "../../../offline/networkStatus";

export interface OfflineIndicatorProps {
  lastCachedAt?: number | null;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lastCachedAt, className = "" }) => {
  const { isOnline } = useNetworkStatus();

  const formattedTime = lastCachedAt
    ? new Date(lastCachedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : null;

  if (isOnline) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs select-none ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Wifi size={12} className="shrink-0" />
        <span className="hidden sm:inline">Online</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 text-[11px] font-black text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 shadow-2xs select-none ${className}`}
      title={formattedTime ? `Offline mode · Showing data saved at ${formattedTime}` : "Offline Mode · Showing saved data"}
    >
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <WifiOff size={12} className="shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="truncate">
        <span className="sm:hidden">Offline</span>
        <span className="hidden sm:inline">
          Offline Mode - Showing saved data{formattedTime ? ` (${formattedTime})` : ""}
        </span>
      </span>
    </div>
  );
};
