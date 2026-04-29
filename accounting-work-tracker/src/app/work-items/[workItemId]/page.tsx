import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { SectionCard } from "@/components/phase2/section-card";
import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import { requireSessionUser } from "@/lib/auth/session";
import { getCustomers, getWorkCycles, getWorkItemFiles, getWorkItems } from "@/lib/supabase/queries";
import { getVisibleWorkScope } from "@/lib/work-items/visibility";

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function WorkItemDetailPage({
  params,
}: {
  params: Promise<{ workItemId: string }>;
}) {
  const currentUser = await requireSessionUser();
  const { workItemId } = await params;
  const [customers, workCycles, workItems, workItemFiles] = await Promise.all([
    getCustomers(),
    getWorkCycles(),
    getWorkItems(),
    getWorkItemFiles(),
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
  const files = workItemFiles.filter((file) => file.workItemId === workItem.id);

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <SectionCard title="รายละเอียดงานและไฟล์แนบ">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm text-slate-500">ลูกค้า</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-950">{workCycle?.customerName ?? "-"}</h1>
                <p className="mt-3 text-base font-medium text-slate-900">{workItem.title}</p>
              </div>
              <WorkItemStatusBadge status={workItem.status} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">ผู้รับผิดชอบ</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{workItem.assignedTo}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">กำหนดส่ง</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{workItem.dueDate}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">ไฟล์แนบ</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{files.length} ไฟล์</p>
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

        <SectionCard title="ไฟล์แนบทั้งหมด">
          {files.length === 0 ? (
            <EmptyState
              title="ยังไม่มีไฟล์แนบ"
              description="เมื่อพนักงานอัปโหลดไฟล์ในงานนี้ รายการไฟล์ทั้งหมดจะแสดงที่หน้านี้"
            />
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{file.fileName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatFileSize(file.fileSizeBytes)} · {file.uploadedByName} · {new Date(file.createdAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                    <a
                      href={`/api/work-items/${workItem.id}/files/${file.id}/download`}
                      className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      เปิดไฟล์
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </main>
    </AppShell>
  );
}
