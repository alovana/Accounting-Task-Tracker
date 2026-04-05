import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { BlockerList } from "@/components/phase3/blocker-list";
import { KpiGrid } from "@/components/phase4/kpi-grid";
import { StaffPerformanceTable } from "@/components/phase4/staff-performance-table";
import {
  getDashboardKpis,
  getOverdueLikeItems,
  getStaffSummaries,
  getWorkCycleHealth,
} from "@/lib/phase4/selectors";
import { getWorkCycles, getWorkItems } from "@/lib/supabase/queries";

export default async function DashboardPage() {
  const [workCycles, workItems] = await Promise.all([getWorkCycles(), getWorkItems()]);

  const kpis = getDashboardKpis(workCycles, workItems);
  const staffRows = getStaffSummaries(workItems);
  const cycleHealth = getWorkCycleHealth(workCycles);
  const attentionItems = getOverdueLikeItems(workItems);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Manager Dashboard"
        description="ภาพรวมทีม, KPI หลัก, งานที่ต้องติดตาม และสรุปผลงานรายคน"
        badge={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase connected mode" : "Mock dashboard mode"}
      />

      <KpiGrid items={kpis} />

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

        <SectionCard
          title="Work Cycle Health"
          description="ดูจำนวนรอบงานตามสถานะเพื่อประเมินสุขภาพของทีม"
        >
          <div className="space-y-3">
            {cycleHealth.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="text-lg font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </SectionCard>
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
            <BlockerList items={attentionItems} />
          )}
        </SectionCard>

        <SectionCard
          title="Manager Notes"
          description="สรุปแนวทางการใช้ dashboard ในช่วง MVP"
        >
          <div className="space-y-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
            <p>- ใช้ KPI cards เพื่อตรวจภาพรวมของทีมแบบเร็ว</p>
            <p>- ใช้ Team Performance เพื่อดูการกระจายงานและภาระงานแต่ละคน</p>
            <p>- ใช้ Work Cycle Health เพื่อตรวจรอบงานที่เริ่มเสี่ยง</p>
            <p>- ใช้ งานที่ต้องติดตาม เพื่อ follow up กับลูกค้าหรือทีมงานทันที</p>
          </div>
        </SectionCard>
      </section>
    </main>
  );
}
