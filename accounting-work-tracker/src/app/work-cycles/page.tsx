import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { SummaryCard } from "@/components/phase2/summary-card";
import { WorkCycleBoard } from "@/components/phase3/work-cycle-board";
import { requirePermission } from "@/lib/auth/session";
import { getWorkCycleSummary } from "@/lib/phase3/selectors";
import { getCustomers, getWorkCycles, getWorkItems } from "@/lib/supabase/queries";
import { getVisibleWorkScope } from "@/lib/work-items/visibility";

export default async function WorkCyclesPage() {
  const currentUser = await requirePermission("manage_work_cycles");
  const [workCycles, workItems, customers] = await Promise.all([
    getWorkCycles(),
    getWorkItems(),
    getCustomers(),
  ]);
  const { isStaffView, visibleWorkCycles, visibleWorkItems } = getVisibleWorkScope({
    currentUser,
    customers,
    workCycles,
    workItems,
  });
  const summary = getWorkCycleSummary(visibleWorkCycles, visibleWorkItems);

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:py-8">
        <PageHeader
          title={isStaffView ? "My Tasks" : "Monthly Work"}
          description="ติดตามงานบัญชีประจำเดือนแบบสั้น ชัด และใช้ง่ายบนมือถือ"
          badge={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase" : "Mock data"}
          hideDescription={false}
        />

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.map((item) => (
            <SummaryCard key={item.label} label={item.label} value={item.value} />
          ))}
        </section>

        <SectionCard title={isStaffView ? "งานของฉัน" : "งานของทีม"}>
          {visibleWorkCycles.length === 0 ? (
            <EmptyState
              title="ยังไม่มีรอบงาน"
              description="เมื่อสร้างรอบงานรายเดือนแล้ว รายการจะมาแสดงที่นี่"
            />
          ) : (
            <WorkCycleBoard
              workCycles={visibleWorkCycles}
              workItems={visibleWorkItems}
              isStaffView={isStaffView}
              currentUserId={currentUser.id}
              currentUserName={currentUser.fullName}
            />
          )}
        </SectionCard>
      </main>
    </AppShell>
  );
}
