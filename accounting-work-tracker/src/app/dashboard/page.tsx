import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { StatusUpdateList } from "@/components/phase3/status-update-list";
import { AttentionList } from "@/components/phase4/attention-list";
import { KpiGrid } from "@/components/phase4/kpi-grid";
import { StaffDashboardCard } from "@/components/phase4/staff-dashboard-card";
import { StaffPerformanceTable } from "@/components/phase4/staff-performance-table";
import { WorkCycleHealthList } from "@/components/phase4/work-cycle-health-list";
import { WorkloadStatusList } from "@/components/phase4/workload-status-list";
import { canAccess } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import {
  getAttentionItems,
  getDashboardKpis,
  getRecentItems,
  getStaffDashboardSummary,
  getStaffSummaries,
  getWorkCycleHealth,
  getWorkloadStatusBreakdown,
} from "@/lib/phase4/selectors";
import {
  getCustomers,
  getWorkCycles,
  getWorkItems,
  getWorkItemUpdates,
} from "@/lib/supabase/queries";

export default async function DashboardPage() {
  const user = await requirePermission("view_dashboard");
  const [customers, workCycles, workItems, workItemUpdates] = await Promise.all([
    getCustomers(),
    getWorkCycles(),
    getWorkItems(),
    getWorkItemUpdates(),
  ]);

  const isManagerView = canAccess(user.role, "view_reports");
  const isStaffView = user.role === "staff";
  const isAdminView = user.role === "admin";

  const visibleCustomers = isStaffView
    ? customers.filter(
        (customer) =>
          customer.assignedUserId === user.id ||
          customer.managerUserId === user.id ||
          customer.assignedUserName === user.fullName ||
          customer.managerUserName === user.fullName,
      )
    : customers;
  const visibleCustomerIds = new Set(visibleCustomers.map((customer) => customer.id));
  const visibleWorkCycles = workCycles.filter((cycle) => visibleCustomerIds.has(cycle.customerId));
  const visibleWorkCycleIds = new Set(visibleWorkCycles.map((cycle) => cycle.id));
  const visibleWorkItems = isStaffView
    ? workItems.filter(
        (item) => visibleWorkCycleIds.has(item.workCycleId) && item.assignedTo === user.fullName,
      )
    : workItems;
  const visibleWorkItemIds = new Set(visibleWorkItems.map((item) => item.id));
  const relevantUpdates = isStaffView
    ? workItemUpdates.filter((update) => visibleWorkItemIds.has(update.workItemId))
    : workItemUpdates;

  const kpis = getDashboardKpis(workCycles, workItems);
  const staffRows = getStaffSummaries(workItems);
  const cycleHealth = getWorkCycleHealth(workCycles);
  const attentionItems = getAttentionItems(workItems);
  const recentItems = getRecentItems(workItems);
  const workloadStatus = getWorkloadStatusBreakdown(workItems);
  const staffSummary = getStaffDashboardSummary(visibleWorkItems, visibleCustomers, user.fullName);
  const myAttentionItems = getAttentionItems(visibleWorkItems);
  const myRecentItems = getRecentItems(visibleWorkItems);

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6">
        <PageHeader
          title={isManagerView ? "Dashboard Overview" : isStaffView ? "My Dashboard" : "Admin Control Center"}
          description={
            isManagerView
              ? "ภาพรวมปฏิบัติการของทีมและบริษัทสำหรับ manager"
              : isStaffView
                ? "แสดงเฉพาะงาน ลูกค้า และอัปเดตที่เกี่ยวข้องกับคุณ"
                : "สรุปสิ่งที่ผู้ดูแลระบบควรดูแลด้านสิทธิ์ การตั้งค่า และความพร้อมของระบบ โดยไม่ดึงไปอยู่ในงานติดตามปฏิบัติการ"
          }
          badge={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase connected mode" : "Mock dashboard mode"}
        />

        {isManagerView ? (
          <>
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
          </>
        ) : isStaffView ? (
          <>
            <SectionCard
              title="My Work Snapshot"
              description="สรุปงานและลูกค้าที่คุณต้องรับผิดชอบในตอนนี้"
            >
              <StaffDashboardCard
                myOpenItems={staffSummary.myOpenItems}
                myBlockedItems={staffSummary.myBlockedItems}
                myWaitingCustomerItems={staffSummary.myWaitingCustomerItems}
                myCustomers={staffSummary.myCustomers}
              />
            </SectionCard>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <SectionCard
                title="งานที่ฉันต้องติดตาม"
                description="รวมงาน blocked และ waiting customer ที่เกี่ยวข้องกับคุณโดยตรง"
              >
                {myAttentionItems.length === 0 ? (
                  <EmptyState
                    title="ไม่มีงานที่ต้องติดตามเป็นพิเศษ"
                    description="ตอนนี้ยังไม่มี blocked หรือ waiting customer items ของคุณ"
                  />
                ) : (
                  <AttentionList items={myAttentionItems} />
                )}
              </SectionCard>

              <SectionCard
                title="งานใกล้ถึงกำหนด"
                description="ดูเฉพาะงานของคุณที่ควรเร่งดำเนินการในช่วงสั้น ๆ"
              >
                {myRecentItems.length === 0 ? (
                  <EmptyState
                    title="ยังไม่มีงานใกล้ถึงกำหนด"
                    description="เมื่อมี due date ในงานของคุณ ระบบจะแสดงรายการในส่วนนี้"
                  />
                ) : (
                  <div className="space-y-3">
                    {myRecentItems.map((item) => (
                      <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-600">ลูกค้าที่เกี่ยวข้องอยู่ในรอบงานที่คุณดูแล</p>
                        <p className="mt-1 text-sm text-slate-500">กำหนดส่ง: {item.dueDate}</p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <SectionCard
                title="ลูกค้าที่ฉันดูแล"
                description="แสดงเฉพาะลูกค้าที่ assign ให้คุณหรืออยู่ในความรับผิดชอบของคุณ"
              >
                {visibleCustomers.length === 0 ? (
                  <EmptyState
                    title="ยังไม่มีลูกค้าที่ผูกกับคุณ"
                    description="เมื่อมีการ assign ลูกค้าให้คุณ รายการจะปรากฏในส่วนนี้"
                  />
                ) : (
                  <div className="space-y-3">
                    {visibleCustomers.map((customer) => (
                      <div key={customer.id} className="rounded-xl bg-slate-50 p-4">
                        <p className="font-medium text-slate-900">{customer.name}</p>
                        <p className="mt-1 text-sm text-slate-500">รหัสลูกค้า: {customer.code}</p>
                        <p className="mt-1 text-sm text-slate-600">สถานะบริการ: {customer.serviceStatus}</p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Recent Updates Relevant to Me"
                description="ประวัติการอัปเดตล่าสุดจากงานที่คุณเป็นผู้รับผิดชอบ"
              >
                {relevantUpdates.length === 0 ? (
                  <EmptyState
                    title="ยังไม่มีอัปเดตล่าสุด"
                    description="เมื่อมีการเปลี่ยนสถานะในงานของคุณ ระบบจะแสดงประวัติในส่วนนี้"
                  />
                ) : (
                  <StatusUpdateList updates={relevantUpdates.slice(0, 6)} />
                )}
              </SectionCard>
            </section>
          </>
        ) : isAdminView ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">ผู้ใช้งานทั้งหมด</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{staffRows.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">ลูกค้าในระบบ</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{customers.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">เมนูหลักของ admin</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Customers, Checklists, Settings</p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionCard
                title="Admin Focus"
                description="ผู้ดูแลระบบจะถูกพาไปยังงานกำหนดค่าและการควบคุมระบบแทนการติดตามงานรายเดือนของบริษัท"
              >
                <ul className="space-y-3 text-sm text-slate-700">
                  <li>- ดูแลบัญชีผู้ใช้และ role assignments ในหน้า Settings</li>
                  <li>- จัดการข้อมูลตั้งต้น เช่น ลูกค้าและ checklist templates</li>
                  <li>- ตรวจ readiness, notification configuration และ deployment prep</li>
                  <li>- มอบหมายการติดตาม execution และ work monitoring ให้ manager</li>
                </ul>
              </SectionCard>

              <SectionCard
                title="Operational Views Moved to Manager"
                description="ลดความสับสนของสิทธิ์โดยซ่อนมุมมอง operational สำหรับ admin"
              >
                <div className="space-y-3 text-sm text-slate-700">
                  <p>หน้า Monthly Work และ Team Reports จะไม่แสดงในเมนูของ admin แล้ว</p>
                  <p>หากต้องทำงานด้านระบบต่อ ให้ใช้หน้าโปรไฟล์ / ตั้งค่า เพื่อจัดการรหัสผ่าน, ผู้ใช้, notifications และ readiness</p>
                </div>
              </SectionCard>
            </section>
          </>
        ) : null}
      </main>
    </AppShell>
  );
}
