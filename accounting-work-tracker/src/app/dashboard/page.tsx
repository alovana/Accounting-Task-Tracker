import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { AttentionList } from "@/components/phase4/attention-list";
import { KpiGrid } from "@/components/phase4/kpi-grid";
import { StaffDashboardCard } from "@/components/phase4/staff-dashboard-card";
import { StaffPerformanceTable } from "@/components/phase4/staff-performance-table";
import { WorkCycleHealthList } from "@/components/phase4/work-cycle-health-list";
import { WorkloadStatusList } from "@/components/phase4/workload-status-list";
import {
  getAttentionItems,
  getDashboardKpis,
  getRecentItems,
  getStaffDashboardSummary,
  getStaffSummaries,
  getWorkCycleHealth,
  getWorkloadStatusBreakdown,
} from "@/lib/phase4/selectors";
import { getCustomers, getWorkCycles, getWorkItems } from "@/lib/supabase/queries";

export default async function DashboardPage() {
  const [customers, workCycles, workItems] = await Promise.all([
    getCustomers(),
    getWorkCycles(),
    getWorkItems(),
  ]);

  const kpis = getDashboardKpis(workCycles, workItems);
  const staffRows = getStaffSummaries(workItems);
  const cycleHealth = getWorkCycleHealth(workCycles);
  const attentionItems = getAttentionItems(workItems);
  const recentItems = getRecentItems(workItems);
  const workloadStatus = getWorkloadStatusBreakdown(workItems);
  const staffSummary = getStaffDashboardSummary(workItems, customers);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Dashboard Overview"
        description="รวมมุมมอง manager dashboard และ staff dashboard สำหรับใช้งาน MVP"
        badge={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase connected mode" : "Mock dashboard mode"}
      />

      <KpiGrid items={kpis} />

      <SectionCard
        title="Staff Dashboard Snapshot"
        description="มุมมองตัวอย่างของพนักงานสำหรับดูงานของตัวเอง งานค้าง และลูกค้าที่รับผิดชอบ"
      >
        <StaffDashboardCard
          myOpenItems={staffSummary.myOpenItems}
          myBlockedItems={staffSummary.myBlockedItems}
          myWaitingCustomerItems={staffSummary.myWaitingCustomerItems}
          myCustomers={staffSummary.myCustomers}
        />
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Team Performance"
          description="สรุปจำนวนงานของแต่ละคนเพื่อใช้ติดตามกำลังงานและ blockers"
        >
          {staffRows.length === 0 ? (
            <EmptyState
              title="ยังไม่มีข้อมูลงานของทีม"
              description="เมื่อมี work items แล้ว ระบบจะแสดง performance summary ในส่วนนี้"
            />
          ) : (
            <StaffPerformanceTable rows={staffRows} />
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Work Cycle Health"
            description="ดูจำนวนรอบงานตามสถานะเพื่อประเมินสุขภาพของทีม"
          >
            <WorkCycleHealthList items={cycleHealth} />
          </SectionCard>

          <SectionCard
            title="Workload by Status"
            description="ดูปริมาณงานตามสถานะจริงเพื่อช่วยจัดลำดับการติดตาม"
          >
            <WorkloadStatusList items={workloadStatus} />
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="งานที่ต้องติดตาม"
          description="รวมงาน blocked และ waiting customer เพื่อให้ผู้จัดการเห็นปัญหาเร็วขึ้น"
        >
          {attentionItems.length === 0 ? (
            <EmptyState
              title="ไม่มีงานที่ต้องติดตามเป็นพิเศษ"
              description="ตอนนี้ยังไม่มี blocked หรือ waiting customer items"
            />
          ) : (
            <AttentionList items={attentionItems} />
          )}
        </SectionCard>

        <SectionCard
          title="งานใกล้ถึงกำหนด"
          description="ใช้ติดตามงานที่ควรเร่งดำเนินการในช่วงสั้น ๆ"
        >
          {recentItems.length === 0 ? (
            <EmptyState
              title="ยังไม่มีงานใกล้ถึงกำหนด"
              description="เมื่อมี due date ระบบจะแสดงรายการในส่วนนี้"
            />
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">ผู้รับผิดชอบ: {item.assignedTo}</p>
                  <p className="mt-1 text-sm text-slate-500">กำหนดส่ง: {item.dueDate}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </section>
    </main>
  );
}
