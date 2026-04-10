import { getUpdatesForDisplay } from "@/lib/phase3/selectors";
import { getWorkItemStatusLabel } from "@/lib/phase3/status-mappers";
import type { WorkItemUpdate } from "@/lib/mock/phase3-data";

type StatusUpdateListProps = {
  updates: WorkItemUpdate[];
};

export function StatusUpdateList({ updates }: StatusUpdateListProps) {
  const orderedUpdates = getUpdatesForDisplay(updates);

  return (
    <div className="space-y-3">
      {orderedUpdates.map((update) => (
        <div key={update.id} className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">{update.comment}</p>
          <p className="mt-2 text-xs text-slate-500">
            {update.updatedBy} · {update.createdAt}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {getWorkItemStatusLabel(update.oldStatus)} → {getWorkItemStatusLabel(update.newStatus)}
          </p>
        </div>
      ))}
    </div>
  );
}
