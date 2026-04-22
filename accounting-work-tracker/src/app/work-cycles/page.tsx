import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { BlockerList } from "@/components/phase3/blocker-list";
import { StatusUpdateList } from "@/components/phase3/status-update-list";
import { WorkCycleStatusBadge } from "@/components/phase3/work-cycle-status-badge";
import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import { WorkItemStatusForm } from "@/components/phase3/work-item-status-form";
import {
  getLatestWorkItemUpdateMap,
  getWorkCycleSummary,
  getWorkItemsByCycle,
  getBlockedWorkItems,
  getRecommendedCycleStatus,
} from "@/lib/phase3/selectors";
import { getNextAllowedStatuses, getWorkItemStatusLabel } from "@/lib/phase3/status-mappers";
import { requirePermission } from "@/lib/auth/session";
import {
  getChecklistTemplateItems,
  getChecklistTemplates,
  getCustomers,
  getWorkCycles,
  getWorkItems,
  getWorkItemUpdates,
} from "@/lib/supabase/queries";
import { buildMonthlyGenerationPreview } from "@/lib/work-generation";

function isStaffScopedUser(role: string) {
  return role === "staff";
}

export default async function WorkCyclesPage() {
  const currentUser = await requirePermission("manage_work_cycles");
  const [workCycles, workItems, workItemUpdates, customers, checklistTemplates, checklistTemplateItems] = await Promise.all([
    getWorkCycles(),
    getWorkItems(),
    getWorkItemUpdates(),
    getCustomers(),
    getChecklistTemplates(),
    getChecklistTemplateItems(),
  ]);

  const isStaffView = isStaffScopedUser(currentUser.role);
  const visibleCustomers = isStaffView
    ? customers.filter(
        (customer) =>
          customer.assignedUserId === currentUser.id ||
          customer.managerUserId === currentUser.id ||
          customer.assignedUserName === currentUser.fullName ||
          customer.managerUserName === currentUser.fullName,
      )
    : customers;
  const visibleCustomerIds = new Set(visibleCustomers.map((customer) => customer.id));
  const visibleWorkCycles = workCycles.filter((cycle) => visibleCustomerIds.has(cycle.customerId));
  const visibleWorkCycleIds = new Set(visibleWorkCycles.map((cycle) => cycle.id));
  const visibleWorkItems = workItems.filter(
    (item) =>
      visibleWorkCycleIds.has(item.workCycleId) &&
      (!isStaffView || item.assignedTo === currentUser.fullName),
  );
  const visibleWorkItemIds = new Set(visibleWorkItems.map((item) => item.id));
  const visibleWorkItemUpdates = workItemUpdates.filter((update) => visibleWorkItemIds.has(update.workItemId));

  const summary = getWorkCycleSummary(visibleWorkCycles, visibleWorkItems);
  const blockedItems = getBlockedWorkItems(visibleWorkItems);
  const latestUpdateMap = getLatestWorkItemUpdateMap(visibleWorkItemUpdates);
  const now = new Date();
  const generationPreview = buildMonthlyGenerationPreview({
    customers: visibleCustomers,
    checklistTemplates,
    checklistTemplateItems,
    periodYear: now.getUTCFullYear(),
    periodMonth: now.getUTCMonth() + 1,
  });

  return (
    <AppShell>
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
          description={isStaffView ? "แสดงเฉพาะลูกค้าและงานที่คุณรับผิดชอบ" : "ภาพรวมรอบงานรายลูกค้าสำหรับเดือนล่าสุด พร้อมย่อรายละเอียดเพื่อลดการเลื่อนหน้าจอ"}
        >
          <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {isStaffView ? `ลูกค้าที่รับผิดชอบ ${visibleWorkCycles.length} ราย` : `ลูกค้าทั้งหมด ${visibleWorkCycles.length} ราย`}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">งานที่เห็น {visibleWorkItems.length} รายการ</span>
            {!isStaffView ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">เปิดดูเฉพาะลูกค้าที่ต้องการได้</span>
            ) : null}
          </div>
          {visibleWorkCycles.length === 0 ? (
            <EmptyState
              title="ยังไม่มีรอบงาน"
              description="ระบบจะสร้าง work cycles จาก checklist templates ในรอบถัดไป"
            />
          ) : (
            <div className="space-y-4">
              {visibleWorkCycles.map((cycle, index) => {
                const relatedItems = getWorkItemsByCycle(visibleWorkItems, cycle.id);
                const completedCount = relatedItems.filter((item) => item.status === "completed" || item.status === "skipped").length;
                const openByDefault = isStaffView || index < 3;

                return (
                  <details key={cycle.id} open={openByDefault} className="group rounded-2xl border border-slate-200 bg-slate-50">
                    <summary className="cursor-pointer list-none p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">{cycle.customerName}</h3>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">{relatedItems.length} งาน</span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">เสร็จ {completedCount}/{relatedItems.length || 0}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            รอบงาน {cycle.periodMonth}/{cycle.periodYear} · generated {cycle.generatedAt}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <div className="flex items-center gap-2 md:justify-end">
                            <WorkCycleStatusBadge status={cycle.status} />
                            <span className="text-xs text-slate-400 group-open:hidden">กดเพื่อดูรายละเอียด</span>
                            <span className="hidden text-xs text-slate-400 group-open:inline">ซ่อนรายละเอียด</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            แนะนำจาก work items: {getRecommendedCycleStatus(relatedItems) === cycle.status ? "สอดคล้องแล้ว" : "ควรปรับสถานะรอบงาน"}
                          </p>
                        </div>
                      </div>
                    </summary>

                    <div className="grid gap-3 border-t border-slate-200 px-5 pb-5 pt-4">
                      {relatedItems.length === 0 ? (
                        <EmptyState
                          title="ยังไม่มีงานย่อยในรอบนี้"
                          description={isStaffView ? "ยังไม่มีงานที่ assign ให้คุณในรอบนี้" : "เมื่อระบบสร้าง work items จาก template แล้ว รายการจะแสดงในส่วนนี้"}
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

                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                              {getNextAllowedStatuses(item.status).map((status) => (
                                <span key={status} className="rounded-full bg-slate-100 px-3 py-1">
                                  next: {getWorkItemStatusLabel(status)}
                                </span>
                              ))}
                            </div>

                            <WorkItemStatusForm
                              workItemId={item.id}
                              workCycleId={item.workCycleId}
                              currentStatus={item.status}
                              updatedByName={currentUser.fullName}
                            />

                            {item.note ? (
                              <p className="mt-3 text-sm text-slate-600">หมายเหตุ: {item.note}</p>
                            ) : null}

                            {latestUpdateMap.get(item.id) ? (
                              <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                                อัปเดตล่าสุด: {latestUpdateMap.get(item.id)?.comment} ({latestUpdateMap.get(item.id)?.updatedBy})
                              </div>
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
                  </details>
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
            {visibleWorkItemUpdates.length === 0 ? (
              <EmptyState
                title="ยังไม่มีประวัติการอัปเดต"
                description="เมื่อเริ่มมีการเปลี่ยนสถานะงาน ระบบจะแสดงประวัติในส่วนนี้"
              />
            ) : (
              <StatusUpdateList updates={visibleWorkItemUpdates} />
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
    </AppShell>
  );
}
