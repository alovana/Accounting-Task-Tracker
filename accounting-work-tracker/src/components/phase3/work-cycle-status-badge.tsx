import type { WorkCycleStatus } from "@/lib/mock/phase3-data";

const toneClassMap: Record<WorkCycleStatus, string> = {
  planned: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  at_risk: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const labelMap: Record<WorkCycleStatus, string> = {
  planned: "planned",
  in_progress: "in progress",
  at_risk: "at risk",
  completed: "completed",
};

export function WorkCycleStatusBadge({ status }: { status: WorkCycleStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneClassMap[status]}`}>
      {labelMap[status]}
    </span>
  );
}
