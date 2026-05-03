import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { SummaryCard } from "@/components/phase2/summary-card";
import { BlockerList } from "@/components/phase3/blocker-list";
import { WorkCycleBoard } from "@/components/phase3/work-cycle-board";
import { StaffWorkloadGroups } from "@/components/phase4/staff-workload-groups";
import { getWorkCycleSummary, getBlockedWorkItems } from "@/lib/phase3/selectors";
import { getStaffWorkloadGroups } from "@/lib/phase4/selectors";
import { requirePermission } from "@/lib/auth/session";
import { getVisibleWorkScope } from "@/lib/work-items/visibility";
import { getCustomers, getWorkCycles, getWorkItems, getWorkItemUpdates } from "@/lib/supabase/queries";

export default async function WorkCyclesPage() {
  const currentUser = await requirePermission("manage_work_cycles");
  const [workCycles, workItems, workItemUpdates, customers] = await Promise.all([
    getWorkCycles(),
    getWorkItems(),
    getWorkItemUpdates(),
    getCustomers(),
  ]);
  const { isStaffView, visibleWorkCycles, visibleWorkItems, visibleWorkItemIds } =
    getVisibleWorkScope({ currentUser, customers, workCycles, workItems });
  const visibleWorkItemUpdates = workItemUpdates.filter((update) => visibleWorkItemIds.has(update.workItemId));
  const cycleById = new Map(visibleWorkCycles.map((cycle) => [cycle.id, cycle]));

  const summary = getWorkCycleSummary(visibleWorkCycles, visibleWorkItems);
  const blockedItems = getBlockedWorkItems(visibleWorkItems);
  const staffWorkloadGroups = getStaffWorkloadGroups(visibleWorkItems, cycleById);
  const isManagerView = !isStaffView;
  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <PageHeader
          title="Monthly Work Tracking"
          description="ติดตามรอบงานรายเดือน สถานะงาน blocker notes และประวัติการอัปเดตในมุมมองที่สะอาด อ่านง่าย และเป็นระบบมากขึ้น"
          badge={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase connected mode" : "Mock workflow mode"}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item, index) => (
            <SummaryCard
              key={item.label}
              label={item.label}
              value={item.value}
              description={index === 0 ? "ภาพรวมระดับบนของงานที่คุณเห็นในตอนนี้" : "อัปเดตอัตโนมัติตามข้อมูลงานจริงในระบบ"}
              tone={index === 0 ? "accent" : "default"}
            />
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

        <SectionCard title="Monthly Work Board">
          <div className="mb-5 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              {isStaffView ? `ลูกค้าที่รับผิดชอบ ${visibleWorkCycles.length} ราย` : `ลูกค้าทั้งหมด ${visibleWorkCycles.length} ราย`}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">งานที่เห็น {visibleWorkItems.length} รายการ</span>
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
              isStaffView={isStaffView}
              currentUserId={currentUser.id}
              currentUserName={currentUser.fullName}
            />
          )}
        </SectionCard>

        <SectionCard title="Blocker Notes">
          {blockedItems.length === 0 ? (
            <EmptyState
              title="ไม่มีงานติดปัญหา"
              description="ตอนนี้ยังไม่มี blocker ที่ต้องติดตามเพิ่มเติม"
            />
          ) : (
            <BlockerList items={blockedItems} />
          )}
        </SectionCard>
      </main>
    </AppShell>
  );
}
