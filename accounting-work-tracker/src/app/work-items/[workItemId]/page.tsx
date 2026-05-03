import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { SectionCard } from "@/components/phase2/section-card";
import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import { requireSessionUser } from "@/lib/auth/session";
import { getCustomers, getWorkCycles, getWorkItems } from "@/lib/supabase/queries";
import { getVisibleWorkScope } from "@/lib/work-items/visibility";

export default async function WorkItemDetailPage({
  params,
}: {
  params: Promise<{ workItemId: string }>;
}) {
  const currentUser = await requireSessionUser();
  const { workItemId } = await params;
  const [customers, workCycles, workItems] = await Promise.all([
    getCustomers(),
    getWorkCycles(),
    getWorkItems(),
  ]);

  const scope = getVisibleWorkScope({
    currentUser,
    customers,
    workCycles,
    workItems,
  });

  const workItem = scope.visibleWorkItems.find((item) => item.id === workItemId);

  if (!workItem) {
    notFound();
  }

  const workCycle = scope.visibleWorkCycles.find((cycle) => cycle.id === workItem.workCycleId);

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <SectionCard title="รายละเอียดงาน">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm text-slate-500">ลูกค้า</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-950">{workCycle?.customerName ?? "-"}</h1>
                <p className="mt-3 text-base font-medium text-slate-900">{workItem.title}</p>
              </div>
              <WorkItemStatusBadge status={workItem.status} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">ผู้รับผิดชอบ</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{workItem.assignedTo}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">กำหนดส่ง</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{workItem.dueDate || "-"}</p>
              </div>
            </div>

            {workItem.note ? (
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">หมายเหตุ</p>
                <p className="mt-2 text-sm text-slate-700">{workItem.note}</p>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="เอกสารแนบ">
          <EmptyState
            title="ไม่ได้ใช้ระบบอัปโหลดไฟล์ในระบบนี้แล้ว"
            description="หากต้องมีเอกสารประกอบงาน ให้จัดการผ่าน Google Drive ตาม workflow หลักแทน"
          />
        </SectionCard>
      </main>
    </AppShell>
  );
}
