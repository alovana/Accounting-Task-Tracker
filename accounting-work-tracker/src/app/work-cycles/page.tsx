import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { WorkCycleStatusBadge } from "@/components/phase3/work-cycle-status-badge";
import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import { workCycles, workItems, workItemUpdates } from "@/lib/mock/phase3-data";

const summary = [
  {
    label: "รอบงานทั้งหมด",
    value: workCycles.length.toString(),
  },
  {
    label: "งานที่ติดปัญหา",
    value: workItems.filter((item) => item.status === "blocked").length.toString(),
  },
  {
    label: "รอลูกค้า",
    value: workItems.filter((item) => item.status === "waiting_customer").length.toString(),
  },
  {
    label: "เสร็จแล้ว",
    value: workItems.filter((item) => item.status === "completed").length.toString(),
  },
];

export default function WorkCyclesPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Monthly Work Tracking"
        description="โครง Phase 3 สำหรับดูรอบงานรายเดือน, ติดตามสถานะงาน, และดู blocker notes"
        badge="Mock workflow mode"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <SectionCard
          title="Monthly Work Board"
          description="ภาพรวมรอบงานรายลูกค้าสำหรับเดือนล่าสุด"
        >
          {workCycles.length === 0 ? (
            <EmptyState
              title="ยังไม่มีรอบงาน"
              description="ระบบจะสร้าง work cycles จาก checklist templates ในรอบถัดไป"
            />
          ) : (
            <div className="space-y-4">
              {workCycles.map((cycle) => {
                const relatedItems = workItems.filter((item) => item.workCycleId === cycle.id);

                return (
                  <article key={cycle.id} className="rounded-2xl bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{cycle.customerName}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          รอบงาน {cycle.periodMonth}/{cycle.periodYear} · generated {cycle.generatedAt}
                        </p>
                      </div>
                      <WorkCycleStatusBadge status={cycle.status} />
                    </div>

                    <div className="mt-4 grid gap-3">
                      {relatedItems.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{item.title}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                ผู้รับผิดชอบ: {item.assignedTo} · due {item.dueDate}
                              </p>
                            </div>
                            <WorkItemStatusBadge status={item.status} />
                          </div>

                          {item.note ? (
                            <p className="mt-3 text-sm text-slate-600">หมายเหตุ: {item.note}</p>
                          ) : null}

                          {item.blockedReason ? (
                            <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                              blocker: {item.blockedReason}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Status Update Flow"
            description="ตัวอย่างประวัติการอัปเดตสถานะของ work items"
          >
            <div className="space-y-3">
              {workItemUpdates.map((update) => (
                <div key={update.id} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">{update.comment}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {update.updatedBy} · {update.createdAt}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {update.oldStatus} → {update.newStatus}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Blocker Notes"
            description="สรุปงานที่ติดปัญหาเพื่อให้หัวหน้าติดตามต่อได้ง่าย"
          >
            <div className="space-y-3">
              {workItems.filter((item) => item.blockedReason).map((item) => (
                <div key={item.id} className="rounded-xl bg-amber-50 p-4">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.blockedReason}</p>
                  <p className="mt-2 text-xs text-slate-500">ผู้รับผิดชอบ: {item.assignedTo}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
