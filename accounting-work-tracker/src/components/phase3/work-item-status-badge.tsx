import type { WorkItemStatus } from "@/lib/mock/phase3-data";
import { getWorkItemStatusLabel } from "@/lib/phase3/status-mappers";

const toneClassMap: Record<WorkItemStatus, string> = {
  not_started: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  waiting_customer: "bg-violet-50 text-violet-700 border-violet-200",
  blocked: "bg-rose-50 text-rose-700 border-rose-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  skipped: "bg-amber-50 text-amber-700 border-amber-200",
};

export function WorkItemStatusBadge({ status }: { status: WorkItemStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneClassMap[status]}`}>
      {getWorkItemStatusLabel(status)}
    </span>
  );
}
