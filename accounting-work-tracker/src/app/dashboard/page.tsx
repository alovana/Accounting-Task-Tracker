import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { SummaryCard } from "@/components/phase2/summary-card";
import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import { requirePermission } from "@/lib/auth/session";
import { getCustomers, getWorkCycles, getWorkItems } from "@/lib/supabase/queries";
import { getVisibleWorkScope } from "@/lib/work-items/visibility";
import type { WorkItem } from "@/lib/mock/phase3-data";

function isOpen(item: WorkItem) {
  return item.status !== "completed" && item.status !== "skipped";
}

function getStaffRows(workItems: WorkItem[]) {
  const staffMap = new Map<string, WorkItem[]>();

  for (const item of workItems) {
    const key = item.assignedTo || "ไม่ระบุผู้รับผิดชอบ";
    staffMap.set(key, [...(staffMap.get(key) ?? []), item]);
  }

  return Array.from(staffMap.entries())
    .map(([staffName, items]) => ({
      staffName,
      total: items.length,
      open: items.filter(isOpen).length,
      completed: items.filter((item) => item.status === "completed").length,
      waiting: items.filter((item) => item.status === "waiting_customer").length,
      blocked: items.filter((item) => item.status === "blocked").length,
    }))
    .sort((a, b) => b.open - a.open || b.blocked - a.blocked);
}

function getCustomerRows(workItems: WorkItem[], cycleNameMap: Map<string, string>) {
  const cycleMap = new Map<string, WorkItem[]>();

  for (const item of workItems) {
    cycleMap.set(item.workCycleId, [...(cycleMap.get(item.workCycleId) ?? []), item]);
  }

  return Array.from(cycleMap.entries())
    .map(([cycleId, items]) => ({
      cycleId,
      customerName: cycleNameMap.get(cycleId) ?? "-",
      total: items.length,
      completed: items.filter((item) => item.status === "completed").length,
      open: items.filter(isOpen).length,
      waiting: items.filter((item) => item.status === "waiting_customer").length,
      blocked: items.filter((item) => item.status === "blocked").length,
    }))
    .sort((a, b) => b.blocked - a.blocked || b.open - a.open);
}

export default async function DashboardPage() {
  const user = await requirePermission("view_dashboard");
  const [customers, workCycles, workItems] = await Promise.all([
    getCustomers(),
    getWorkCycles(),
    getWorkItems(),
  ]);

  const { visibleWorkCycles, visibleWorkItems } = getVisibleWorkScope({
    currentUser: user,
    customers,
    workCycles,
    workItems,
  });
  const cycleNameMap = new Map(visibleWorkCycles.map((cycle) => [cycle.id, cycle.customerName]));
  const openItems = visibleWorkItems.filter(isOpen);
  const waitingItems = visibleWorkItems.filter((item) => item.status === "waiting_customer");
  const blockedItems = visibleWorkItems.filter((item) => item.status === "blocked");
  const completedItems = visibleWorkItems.filter((item) => item.status === "completed");
  const staffRows = getStaffRows(visibleWorkItems);
  const customerRows = getCustomerRows(visibleWorkItems, cycleNameMap);
  const attentionItems = [...blockedItems, ...waitingItems].slice(0, 8);

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:py-8">
        <PageHeader
          title={user.role === "staff" ? "My Dashboard" : "Manager Dashboard"}
          description="ดูว่าใครทำถึงไหน งานไหนค้าง และลูกค้าไหนติดปัญหา"
          badge="Local workflow"
          hideDescription={false}
        />

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="งานทั้งหมด" value={visibleWorkItems.length.toString()} />
          <SummaryCard label="งานค้าง" value={openItems.length.toString()} />
          <SummaryCard label="รอลูกค้า" value={waitingItems.length.toString()} />
          <SummaryCard label="ติดปัญหา" value={blockedItems.length.toString()} tone={blockedItems.length > 0 ? "accent" : "default"} />
        </section>

        <SectionCard title="งานที่ต้องดูตอนนี้">
          {attentionItems.length === 0 ? (
            <EmptyState title="ยังไม่มีงานติดปัญหา" description="ตอนนี้ไม่มีงานที่ติดปัญหาหรือรอลูกค้า" />
          ) : (
            <div className="space-y-3">
              {attentionItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{cycleNameMap.get(item.workCycleId) ?? "-"}</p>
                      <p className="mt-1 text-sm text-slate-700">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">ผู้รับผิดชอบ: {item.assignedTo}</p>
                    </div>
                    <WorkItemStatusBadge status={item.status} />
                  </div>
                  {item.blockedReason ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{item.blockedReason}</p> : null}
                  {item.note ? <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">{item.note}</p> : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <SectionCard title="สรุปตามพนักงาน">
            <div className="space-y-3">
              {staffRows.map((row) => (
                <div key={row.staffName} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{row.staffName}</p>
                      <p className="mt-1 text-sm text-slate-500">เสร็จ {row.completed}/{row.total}</p>
                    </div>
                    <p className="text-lg font-bold text-slate-950">{row.open}</p>
                  </div>
                  <div className="mt-3 flex gap-2 text-xs">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-600">ค้าง {row.open}</span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">รอลูกค้า {row.waiting}</span>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">ติดปัญหา {row.blocked}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="สรุปตามลูกค้า">
            <div className="space-y-3">
              {customerRows.map((row) => (
                <div key={row.cycleId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{row.customerName}</p>
                      <p className="mt-1 text-sm text-slate-500">เสร็จ {row.completed}/{row.total}</p>
                    </div>
                    <p className="text-lg font-bold text-slate-950">{Math.round((row.completed / row.total) * 100)}%</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.round((row.completed / row.total) * 100)}%` }} />
                  </div>
                  <div className="mt-3 flex gap-2 text-xs">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-600">ค้าง {row.open}</span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">รอ {row.waiting}</span>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">ปัญหา {row.blocked}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-slate-600">งานเสร็จแล้ว {completedItems.length} รายการ</p>
          <Link href="/work-cycles" className="mt-3 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            ไปหน้า My Tasks
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
