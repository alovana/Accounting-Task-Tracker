import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { BlockerList } from "@/components/phase3/blocker-list";
import { StatusUpdateList } from "@/components/phase3/status-update-list";
import { WorkCycleStatusBadge } from "@/components/phase3/work-cycle-status-badge";
import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import {
  getWorkCycleSummary,
  getWorkItemsByCycle,
  getBlockedWorkItems,
} from "@/lib/phase3/selectors";
import {
  getChecklistTemplateItems,
  getChecklistTemplates,
  getCustomers,
  getWorkCycles,
  getWorkItems,
  getWorkItemUpdates,
} from "@/lib/supabase/queries";
import { buildMonthlyGenerationPreview } from "@/lib/work-generation";

export default async function WorkCyclesPage() {
  const [workCycles, workItems, workItemUpdates, customers, checklistTemplates, checklistTemplateItems] = await Promise.all([
    getWorkCycles(),
    getWorkItems(),
    getWorkItemUpdates(),
    getCustomers(),
    getChecklistTemplates(),
    getChecklistTemplateItems(),
  ]);

  const summary = getWorkCycleSummary(workCycles, workItems);
  const blockedItems = getBlockedWorkItems(workItems);
  const now = new Date();
  const generationPreview = buildMonthlyGenerationPreview({
    customers,
    checklistTemplates,
    checklistTemplateItems,
    periodYear: now.getUTCFullYear(),
    periodMonth: now.getUTCMonth() + 1,
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Monthly Work Tracking"
        description="ติดตามรอบงานรายเดือน, สถานะงาน, blocker notes และประวัติการอัปเดต"
        badge={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase connected mode" : "Mock workflow mode"}
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
                const relatedItems = getWorkItemsByCycle(workItems, cycle.id);

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
                      {relatedItems.length === 0 ? (
                        <EmptyState
                          title="ยังไม่มีงานย่อยในรอบนี้"
                          description="เมื่อระบบสร้าง work items จาก template แล้ว รายการจะแสดงในส่วนนี้"
                        />
                      ) : (
                        relatedItems.map((item) => (
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
                        ))
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Monthly Generation Readiness"
            description="เช็กความพร้อมของข้อมูลต้นทางก่อนสร้างรอบงานรายเดือนจริง"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">ลูกค้าที่พร้อมสร้างงาน</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{generationPreview.summary.matchedCustomers}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">ลูกค้าที่ข้อมูลยังไม่ครบ</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{generationPreview.summary.unmatchedCustomers}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {generationPreview.customerPlans.length === 0 ? (
                <EmptyState
                  title="ยังไม่มีข้อมูลพร้อมสร้างงาน"
                  description="ตรวจว่าลูกค้า active และมี checklist template พร้อม items ครบแล้ว"
                />
              ) : (
                generationPreview.customerPlans.map((plan) => (
                  <div key={plan.customerId} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-medium text-slate-900">{plan.customerName}</p>
                    <p className="mt-1 text-sm text-slate-600">template: {plan.templateName}</p>
                    <p className="mt-2 text-xs text-slate-500">พร้อมสร้าง {plan.workItemCount} work items</p>
                  </div>
                ))
              )}
            </div>

            {generationPreview.unmatchedCustomers.length > 0 ? (
              <div className="mt-4 space-y-3">
                {generationPreview.unmatchedCustomers.map((item) => (
                  <div key={item.customerId} className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-medium">{item.customerName}</p>
                    <p className="mt-1">{item.reason}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Status Update Flow"
            description="ประวัติการอัปเดตสถานะของ work items"
          >
            {workItemUpdates.length === 0 ? (
              <EmptyState
                title="ยังไม่มีประวัติการอัปเดต"
                description="เมื่อเริ่มมีการเปลี่ยนสถานะงาน ระบบจะแสดงประวัติในส่วนนี้"
              />
            ) : (
              <StatusUpdateList updates={workItemUpdates} />
            )}
          </SectionCard>

          <SectionCard
            title="Blocker Notes"
            description="สรุปงานที่ติดปัญหาเพื่อให้หัวหน้าติดตามต่อได้ง่าย"
          >
            {blockedItems.length === 0 ? (
              <EmptyState
                title="ไม่มีงานติดปัญหา"
                description="ตอนนี้ยังไม่มี blocker ที่ต้องติดตามเพิ่มเติม"
              />
            ) : (
              <BlockerList items={blockedItems} />
            )}
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
