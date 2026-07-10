import { C } from "../../../constants/colors";

export interface BadgeProps {
  label: string;
  color: "success" | "error" | "warning" | "blue" | "neutral";
}

export const Badge = ({ label, color }: BadgeProps) => {
  const map = {
    success: { bg: "#ECFDF5", text: "#065F46", dot: C.success },
    error: { bg: "#FEF2F2", text: "#991B1B", dot: C.error },
    warning: { bg: "#FFFBEB", text: "#92400E", dot: C.warning },
    blue: { bg: "#EFF4FF", text: "#1E3A8A", dot: C.blue },
    neutral: { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  };
  const t = map[color];
  return (
    <span style={{ background: t.bg, color: t.text }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none">
      <span style={{ background: t.dot }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
      {label}
    </span>
  );
};
