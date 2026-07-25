import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

export interface ReportWarningBannerProps {
  classification?: string;
  warnings?: string[];
}

export function ReportWarningBanner({ classification, warnings = [] }: ReportWarningBannerProps) {
  if (!classification && (!warnings || warnings.length === 0)) {
    return null;
  }

  const formatClassification = (text: string) => {
    return text
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-xs space-y-3 dark:border-amber-900/50 dark:bg-amber-950/30">
      {/* Header & Classification Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5 dark:border-amber-900/40">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
          <ShieldAlert size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-black uppercase tracking-wider">Report Notice & Governance</span>
        </div>

        {classification && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-900 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700">
            <Info size={12} />
            {formatClassification(classification)}
          </span>
        )}
      </div>

      {/* Warnings List */}
      {warnings.length > 0 && (
        <ul className="space-y-1.5 text-xs text-amber-900 font-medium dark:text-amber-200">
          {warnings.map((w, index) => (
            <li key={index} className="flex items-start gap-2 leading-relaxed">
              <AlertTriangle size={14} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ReportWarningBanner;
