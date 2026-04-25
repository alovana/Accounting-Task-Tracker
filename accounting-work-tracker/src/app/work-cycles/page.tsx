import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { BlockerList } from "@/components/phase3/blocker-list";
import { StatusUpdateList } from "@/components/phase3/status-update-list";
import { WorkCycleBoard } from "@/components/phase3/work-cycle-board";
import { StaffWorkloadGroups } from "@/components/phase4/staff-workload-groups";
import { getWorkCycleSummary, getBlockedWorkItems } from "@/lib/phase3/selectors";
import { getStaffWorkloadGroups } from "@/lib/phase4/selectors";
import { requirePermission } from "@/lib/auth/session";
import { getVisibleWorkScope } from "@/lib/work-items/visibility";
import {
  getChecklistTemplateItems,
  getChecklistTemplates,
  getCustomers,
  getWorkCycles,
  getWorkItemFiles,
  getWorkItems,
  getWorkItemUpdates,
} from "@/lib/supabase/queries";
import { buildMonthlyGenerationPreview } from "@/lib/work-generation";

export default async function WorkCyclesPage() {
  const currentUser = await requirePermission("manage_work_cycles");
  const [workCycles, workItems, workItemUpdates, workItemFiles, customers, checklistTemplates, checklistTemplateItems] = await Promise.all([
    getWorkCycles(),
    getWorkItems(),
    getWorkItemUpdates(),
    getWorkItemFiles(),
    getCustomers(),
    getChecklistTemplates(),
    getChecklistTemplateItems(),
  ]);
  const { isStaffView, visibleCustomers, visibleWorkCycles, visibleWorkItems, visibleWorkItemIds } =
    getVisibleWorkScope({ currentUser, customers, workCycles, workItems });
  const visibleWorkItemUpdates = workItemUpdates.filter((update) => visibleWorkItemIds.has(update.workItemId));
  const visibleWorkItemFiles = workItemFiles.filter((file) => visibleWorkItemIds.has(file.workItemId));
  const cycleById = new Map(visibleWorkCycles.map((cycle) => [cycle.id, cycle]));

  const summary = getWorkCycleSummary(visibleWorkCycles, visibleWorkItems);
  const blockedItems = getBlockedWorkItems(visibleWorkItems);
  const staffWorkloadGroups = getStaffWorkloadGroups(visibleWorkItems, cycleById);
  const isManagerView = !isStaffView;
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

      {isManagerView ? (
        <SectionCard
          title="Manager Work Monitoring"
          description="จัดกลุ่มงานตามผู้รับผิดชอบ เพื่อให้ manager ติดตาม execution และ blocker ของทีมได้เร็วขึ้น"
        >
          <StaffWorkloadGroups
            groups={staffWorkloadGroups}
            emptyTitle="ยังไม่มีงานให้ติดตาม"
            emptyDescription="เมื่อมี monthly work items แล้ว จะแสดงเป็นการ์ดแยกตามผู้รับผิดชอบในส่วนนี้"
            defaultOpenCount={2}
          />
        </SectionCard>
      ) : null}

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
            <WorkCycleBoard
              workCycles={visibleWorkCycles}
              workItems={visibleWorkItems}
              workItemUpdates={visibleWorkItemUpdates}
              workItemFiles={visibleWorkItemFiles}
              isStaffView={isStaffView}
              currentUserName={currentUser.fullName}
            />
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
