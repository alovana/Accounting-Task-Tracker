import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import type { WorkItem } from "@/lib/mock/phase3-data";

export type StaffWorkloadGroup = {
  owner: string;
  total: number;
  open: number;
  inProgress: number;
  waitingCustomer: number;
  blocked: number;
  completed: number;
  items: Array<
    Pick<WorkItem, "id" | "title" | "status" | "dueDate" | "workCycleId"> & {
      customerName: string;
      blocker?: string;
    }
  >;
};

const metricStyles = {
  open: "bg-slate-100 text-slate-700",
  inProgress: "bg-blue-50 text-blue-700",
  waitingCustomer: "bg-amber-50 text-amber-700",
  blocked: "bg-rose-50 text-rose-700",
  completed: "bg-emerald-50 text-emerald-700",
} as const;

function MetricPill({ label, value, tone }: { label: string; value: number; tone: keyof typeof metricStyles }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${metricStyles[tone]}`}>
      {label} {value}
    </span>
  );
}

export function StaffWorkloadGroups({
  groups,
  emptyTitle,
  emptyDescription,
  defaultOpenCount = 2,
}: {
  groups: StaffWorkloadGroup[];
  emptyTitle: string;
  emptyDescription: string;
  defaultOpenCount?: number;
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        <p className="font-medium text-slate-700">{emptyTitle}</p>
        <p className="mt-1">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <details
          key={group.owner}
          open={index < defaultOpenCount}
          className="group rounded-2xl border border-slate-200 bg-slate-50"
        >
          <summary className="cursor-pointer list-none p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{group.owner}</h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">งาน {group.total}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">เปิดอยู่ {group.open}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <MetricPill label="กำลังทำ" value={group.inProgress} tone="inProgress" />
                  <MetricPill label="รอลูกค้า" value={group.waitingCustomer} tone="waitingCustomer" />
                  <MetricPill label="ติดปัญหา" value={group.blocked} tone="blocked" />
                  <MetricPill label="เสร็จแล้ว" value={group.completed} tone="completed" />
                </div>
              </div>
              <div className="text-xs text-slate-400 lg:text-right">
                <span className="group-open:hidden">กดเพื่อดูรายการงาน</span>
                <span className="hidden group-open:inline">ซ่อนรายการงาน</span>
              </div>
            </div>
          </summary>

          <div className="space-y-3 border-t border-slate-200 px-5 pb-5 pt-4">
            {group.items.length === 0 ? (
              <p className="rounded-xl bg-white p-4 text-sm text-slate-500">ยังไม่มีงานของผู้รับผิดชอบคนนี้</p>
            ) : (
              group.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.customerName} · due {item.dueDate}</p>
                    </div>
                    <WorkItemStatusBadge status={item.status} />
                  </div>
                  {item.blocker ? (
                    <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">blocker: {item.blocker}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
