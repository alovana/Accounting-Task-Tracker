import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import type { WorkItem } from "@/lib/mock/phase3-data";

type AttentionListProps = {
  items: WorkItem[];
};

export function AttentionList({ items }: AttentionListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-700">ผู้รับผิดชอบ: {item.assignedTo}</p>
            </div>
            <WorkItemStatusBadge status={item.status} />
          </div>
          {item.blockedReason ? (
            <p className="mt-3 text-sm text-slate-700">เหตุผล: {item.blockedReason}</p>
          ) : item.note ? (
            <p className="mt-3 text-sm text-slate-700">หมายเหตุ: {item.note}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
