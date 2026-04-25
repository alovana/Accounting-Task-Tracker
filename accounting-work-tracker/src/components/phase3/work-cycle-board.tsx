"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/phase2/empty-state";
import { WorkCycleStatusBadge } from "@/components/phase3/work-cycle-status-badge";
import { WorkItemAttachments } from "@/components/phase3/work-item-attachments";
import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import { WorkItemStatusForm } from "@/components/phase3/work-item-status-form";
import { getRecommendedCycleStatus } from "@/lib/phase3/selectors";
import { getNextAllowedStatuses, getWorkItemStatusLabel } from "@/lib/phase3/status-mappers";
import type { WorkCycle, WorkItem, WorkItemUpdate } from "@/lib/mock/phase3-data";
import type { WorkItemFile } from "@/types/attachments";

type WorkCycleBoardProps = {
  workCycles: WorkCycle[];
  workItems: WorkItem[];
  workItemUpdates: WorkItemUpdate[];
  workItemFiles: WorkItemFile[];
  isStaffView: boolean;
  currentUserName: string;
};

export function WorkCycleBoard({
  workCycles,
  workItems,
  workItemUpdates,
  workItemFiles,
  isStaffView,
  currentUserName,
}: WorkCycleBoardProps) {
  const latestUpdateMap = useMemo(
    () => new Map(workItemUpdates.map((update) => [update.workItemId, update])),
    [workItemUpdates],
  );
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const cycleCards = useMemo(() => {
    return workCycles
      .map((cycle, index) => {
        const relatedItems = workItems.filter((item) => item.workCycleId === cycle.id);
        const filteredItems = relatedItems.filter((item) => {
          if (normalizedQuery.length === 0) {
            return true;
          }

          const relatedFiles = workItemFiles.filter((file) => file.workItemId === item.id);
          const haystack = [
            cycle.customerName,
            `${cycle.periodMonth}/${cycle.periodYear}`,
            item.title,
            item.assignedTo,
            item.status,
            item.note,
            item.blockedReason,
            latestUpdateMap.get(item.id)?.comment,
            ...relatedFiles.map((file) => file.fileName),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedQuery);
        });

        if (filteredItems.length === 0 && normalizedQuery.length > 0) {
          return null;
        }

        const completedCount = relatedItems.filter((item) => item.status === "completed" || item.status === "skipped").length;

        return {
          cycle,
          relatedItems: filteredItems,
          totalItems: relatedItems.length,
          completedCount,
          openByDefault: isStaffView || normalizedQuery.length > 0 || index < 3,
        };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value));
  }, [isStaffView, latestUpdateMap, normalizedQuery, workCycles, workItemFiles, workItems]);

  const visibleItemCount = cycleCards.reduce((total, cycle) => total + cycle.relatedItems.length, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label htmlFor="work-cycle-search" className="text-xs font-medium text-slate-600">
              ค้นหารอบงาน งานย่อย หรือชื่อไฟล์แนบ
            </label>
            <input
              id="work-cycle-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={isStaffView ? "ค้นหาจากลูกค้า งาน หรือชื่อไฟล์ที่คุณดูได้" : "ค้นหาจากลูกค้า งาน ผู้รับผิดชอบ blocker หรือชื่อไฟล์"}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 lg:self-end"
          >
            ล้างคำค้น
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-white px-3 py-1">แสดง {cycleCards.length} จาก {workCycles.length} รอบงาน</span>
          <span className="rounded-full bg-white px-3 py-1">งานที่ตรงคำค้น {visibleItemCount} รายการ</span>
          {normalizedQuery.length > 0 ? <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">รวมค้นหาชื่อไฟล์แนบด้วย</span> : null}
        </div>
      </div>

      {cycleCards.length === 0 ? (
        <EmptyState
          title="ไม่พบงานที่ตรงคำค้น"
          description="ลองค้นหาจากชื่อลูกค้า ชื่องาน ผู้รับผิดชอบ blocker note หรือชื่อไฟล์แนบ"
        />
      ) : (
        <div className="space-y-4">
          {cycleCards.map(({ cycle, relatedItems, totalItems, completedCount, openByDefault }) => (
            <details key={cycle.id} open={openByDefault} className="group rounded-2xl border border-slate-200 bg-slate-50">
              <summary className="cursor-pointer list-none p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{cycle.customerName}</h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">{relatedItems.length}/{totalItems} งาน</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">เสร็จ {completedCount}/{totalItems || 0}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      รอบงาน {cycle.periodMonth}/{cycle.periodYear} · generated {cycle.generatedAt}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="flex items-center gap-2 md:justify-end">
                      <WorkCycleStatusBadge status={cycle.status} />
                      <span className="text-xs text-slate-400 group-open:hidden">กดเพื่อดูรายละเอียด</span>
                      <span className="hidden text-xs text-slate-400 group-open:inline">ซ่อนรายละเอียด</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      แนะนำจาก work items: {getRecommendedCycleStatus(relatedItems) === cycle.status ? "สอดคล้องแล้ว" : "ควรปรับสถานะรอบงาน"}
                    </p>
                  </div>
                </div>
              </summary>

              <div className="grid gap-3 border-t border-slate-200 px-5 pb-5 pt-4">
                {relatedItems.length === 0 ? (
                  <EmptyState
                    title="ยังไม่มีงานที่ตรงคำค้นในรอบนี้"
                    description="ลองล้างคำค้นเพื่อกลับไปดูงานทั้งหมดของลูกค้ารายนี้"
                  />
                ) : (
                  relatedItems.map((item) => {
                    const files = workItemFiles.filter((file) => file.workItemId === item.id);
                    const latestUpdate = latestUpdateMap.get(item.id);

                    return (
                      <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              ผู้รับผิดชอบ: {item.assignedTo} · due {item.dueDate}
                            </p>
                          </div>
                          <WorkItemStatusBadge status={item.status} />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          {getNextAllowedStatuses(item.status).map((status) => (
                            <span key={status} className="rounded-full bg-slate-100 px-3 py-1">
                              next: {getWorkItemStatusLabel(status)}
                            </span>
                          ))}
                        </div>

                        <WorkItemStatusForm
                          workItemId={item.id}
                          workCycleId={item.workCycleId}
                          currentStatus={item.status}
                          updatedByName={currentUserName}
                        />

                        {item.note ? <p className="mt-3 text-sm text-slate-600">หมายเหตุ: {item.note}</p> : null}

                        {latestUpdate ? (
                          <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                            อัปเดตล่าสุด: {latestUpdate.comment} ({latestUpdate.updatedBy})
                          </div>
                        ) : null}

                        {item.blockedReason ? (
                          <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                            blocker: {item.blockedReason}
                          </div>
                        ) : null}

                        <WorkItemAttachments workItemId={item.id} files={files} canDelete={!isStaffView} />
                      </div>
                    );
                  })
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
