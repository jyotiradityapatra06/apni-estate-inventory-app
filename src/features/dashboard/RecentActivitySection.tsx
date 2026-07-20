import { Bell } from "lucide-react";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { SectionHeader } from "../../app/components/common/PageHeader";
import type { DashboardData } from "./dashboard.types";

const dateTime = (value: string) => new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
export function RecentActivitySection({ dashboard }: { dashboard: DashboardData }) {
  const open = () => window.dispatchEvent(new Event("notifications:open"));
  return <section className="space-y-3"><SectionHeader title="Recent Activity" description="Latest updates from your business" action={<button onClick={open} className="min-h-11 text-[14px] font-semibold text-blue-700">View Notifications</button>}/>{dashboard.activity.loading && !dashboard.activity.data.length ? <LoadingSkeleton rows={3}/> : dashboard.activity.error ? <ErrorState message="Could not load recent activity." onRetry={dashboard.refresh}/> : !dashboard.activity.data.length ? <EmptyState title="No recent activity" description="Business updates will appear here when activity is recorded." icon={Bell}/> : <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">{dashboard.activity.data.slice(0, 6).map((item) => <article key={item.id} className="flex gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Bell size={19}/></span><div className="min-w-0"><h3 className="break-words text-[15px] font-bold text-slate-900">{item.title}</h3><p className="mt-0.5 break-words text-[14px] text-slate-600">{item.message}</p><time className="mt-1 block text-[13px] text-slate-500">{dateTime(item.createdAt)}</time></div></article>)}</div>}</section>;
}
