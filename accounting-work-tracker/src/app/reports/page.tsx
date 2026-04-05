import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { StaffPerformanceTable } from "@/components/phase4/staff-performance-table";
import { WorkCycleHealthList } from "@/components/phase4/work-cycle-health-list";
import { getStaffSummaries, getWorkCycleHealth } from "@/lib/phase4/selectors";
import { getWorkCycles, getWorkItems } from "@/lib/supabase/queries";

export default async function ReportsPage() {
  const [workCycles, workItems] = await Promise.all([getWorkCycles(), getWorkItems()]);
  const staffRows = getStaffSummaries(workItems);
  const cycleHealth = getWorkCycleHealth(workCycles);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Team Performance Report"
        description="รายงานผลงานรายคนและสุขภาพของรอบงานในระดับ MVP"
        badge={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase connected mode" : "Mock report mode"}
      />

      <SectionCard
        title="Performance Summary"
        description="สรุปงานทั้งหมด กำลังทำ ติดปัญหา และเสร็จแล้วของแต่ละคน"
      >
        {staffRows.length === 0 ? (
          <EmptyState
            title="ยังไม่มีข้อมูลรายงาน"
            description="เมื่อมี work items ในระบบ รายงานจะพร้อมแสดงทันที"
          />
        ) : (
          <StaffPerformanceTable rows={staffRows} />
        )}
      </SectionCard>

      <SectionCard
        title="Work Cycle Health Summary"
        description="ใช้ดูภาพรวมรอบงานว่าอยู่ในสถานะใดบ้าง"
      >
        <WorkCycleHealthList items={cycleHealth} />
      </SectionCard>
    </main>
  );
}
