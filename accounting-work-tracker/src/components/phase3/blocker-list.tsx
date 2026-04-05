import type { WorkItem } from "@/lib/mock/phase3-data";

type BlockerListProps = {
  items: WorkItem[];
};

export function BlockerList({ items }: BlockerListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl bg-amber-50 p-4">
          <p className="font-medium text-slate-900">{item.title}</p>
          <p className="mt-1 text-sm text-slate-700">{item.blockedReason}</p>
          <p className="mt-2 text-xs text-slate-500">ผู้รับผิดชอบ: {item.assignedTo}</p>
        </div>
      ))}
    </div>
  );
}
