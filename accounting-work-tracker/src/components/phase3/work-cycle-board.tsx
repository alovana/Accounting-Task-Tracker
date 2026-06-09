"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/phase2/empty-state";
import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import { WorkItemStatusForm } from "@/components/phase3/work-item-status-form";
import { getWorkflowDescription, getWorkflowStepNumber } from "@/lib/monthly-workflow";
import type { WorkCycle, WorkItem, WorkItemStatus } from "@/lib/mock/phase3-data";

type WorkCycleBoardProps = {
  workCycles: WorkCycle[];
  workItems: WorkItem[];
  isStaffView: boolean;
  currentUserName: string;
};

type StatusFilter = "open" | "all" | WorkItemStatus;
type CustomerTaskGroup = {
  cycle: WorkCycle;
  items: WorkItem[];
  openCount: number;
  completedCount: number;
  blockedCount: number;
  progress: number;
};

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "open", label: "งานที่ยังไม่เสร็จ" },
  { value: "all", label: "ทั้งหมด" },
  { value: "not_started", label: "ยังไม่เริ่ม" },
  { value: "in_progress", label: "กำลังทำ" },
  { value: "waiting_customer", label: "รอลูกค้า" },
  { value: "blocked", label: "ติดปัญหา" },
  { value: "completed", label: "เสร็จแล้ว" },
];
function isClosed(status: WorkItemStatus) {
  return status === "completed" || status === "skipped";
}

function getPeriodText(cycle: WorkCycle) {
  return `${String(cycle.periodMonth).padStart(2, "0")}/${cycle.periodYear}`;
}

function getProgress(items: WorkItem[]) {
  if (items.length === 0) {
    return 0;
  }

  return Math.round((items.filter((item) => isClosed(item.status)).length / items.length) * 100);
}

function getStepSortValue(item: WorkItem) {
  return getWorkflowStepNumber(item.title) ?? 99;
}

export function WorkCycleBoard({
  workCycles,
  workItems,
  isStaffView,
  currentUserName,
}: WorkCycleBoardProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();

  const groups = useMemo<CustomerTaskGroup[]>(() => {
    return workCycles
      .map((cycle) => {
        const items = workItems
          .filter((item) => item.workCycleId === cycle.id)
          .filter((item) => {
            if (statusFilter === "open" && isClosed(item.status)) {
              return false;
            }

            if (statusFilter !== "open" && statusFilter !== "all" && item.status !== statusFilter) {
              return false;
            }

            if (!normalizedQuery) {
              return true;
            }

            return [cycle.customerName, item.title, item.assignedTo, item.note, item.blockedReason]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery);
          })
          .sort((a, b) => getStepSortValue(a) - getStepSortValue(b));

        if (items.length === 0) {
          return null;
        }

        return {
          cycle,
          items,
          openCount: items.filter((item) => !isClosed(item.status)).length,
          completedCount: items.filter((item) => isClosed(item.status)).length,
          blockedCount: items.filter((item) => item.status === "blocked").length,
          progress: getProgress(workItems.filter((item) => item.workCycleId === cycle.id)),
        };
      })
      .filter((group): group is CustomerTaskGroup => Boolean(group));
  }, [normalizedQuery, statusFilter, workCycles, workItems]);

  const selectedGroup = useMemo(() => {
    if (groups.length === 0) {
      return null;
    }

    if (!selectedCycleId) {
      return groups[0];
    }

    return groups.find((group) => group.cycle.id === selectedCycleId) ?? groups[0];
  }, [groups, selectedCycleId]);

  const totalOpen = groups.reduce((sum, group) => sum + group.openCount, 0);
  const totalBlocked = groups.reduce((sum, group) => sum + group.blockedCount, 0);

  if (!selectedGroup) {
    return (
      <EmptyState
        title="ยังไม่มีงานที่ต้องแสดง"
        description="ลองเปลี่ยนตัวกรอง หรือเพิ่มรอบงานรายเดือนก่อน"
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">My Tasks</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">งานบัญชีประจำเดือน</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:flex sm:text-left">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">งานค้าง</p>
              <p className="text-xl font-bold text-slate-950">{totalOpen}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 px-4 py-3">
              <p className="text-xs text-rose-600">ติดปัญหา</p>
              <p className="text-xl font-bold text-rose-700">{totalBlocked}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาลูกค้าหรืองาน"
            className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none focus:border-slate-500"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none focus:border-slate-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="flex gap-3 overflow-x-auto pb-1">
        {groups.map((group) => {
          const isSelected = selectedGroup.cycle.id === group.cycle.id;

          return (
            <button
              key={group.cycle.id}
              type="button"
              onClick={() => setSelectedCycleId(group.cycle.id)}
              className={[
                "min-w-[250px] rounded-3xl border p-4 text-left shadow-sm transition",
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-400",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="line-clamp-2 text-base font-bold">{group.cycle.customerName}</p>
                  <p className={isSelected ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-500"}>
                    รอบ {getPeriodText(group.cycle)}
                  </p>
                </div>
                <span className={isSelected ? "text-sm font-bold text-white" : "text-sm font-bold text-slate-700"}>
                  {group.completedCount}/{group.items.length}
                </span>
              </div>
              <div className={isSelected ? "mt-4 h-2 rounded-full bg-white/20" : "mt-4 h-2 rounded-full bg-slate-100"}>
                <div
                  className={isSelected ? "h-2 rounded-full bg-white" : "h-2 rounded-full bg-slate-900"}
                  style={{ width: `${group.progress}%` }}
                />
              </div>
            </button>
          );
        })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-950">{selectedGroup.cycle.customerName}</h3>
            <p className="mt-1 text-sm text-slate-500">รอบ {getPeriodText(selectedGroup.cycle)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            คืบหน้า {selectedGroup.progress}%
          </div>
        </div>

        <div className="space-y-3">
          {selectedGroup.items.map((item) => {
            const stepNumber = getWorkflowStepNumber(item.title);
            const description = getWorkflowDescription(item.title);
            const isExpanded = expandedItemId === item.id;

            return (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <button
                  type="button"
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-900 shadow-sm">
                    {stepNumber ?? "-"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-slate-950">{item.title}</span>
                    <span className="mt-1 block text-sm text-slate-500">{description}</span>
                  </span>
                  <WorkItemStatusBadge status={item.status} />
                </button>

                {isExpanded ? (
                  <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-xl bg-white px-3 py-2">
                        <span className="text-slate-500">ผู้รับผิดชอบ</span>
                        <p className="font-semibold text-slate-900">{item.assignedTo}</p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2">
                        <span className="text-slate-500">กำหนดส่ง</span>
                        <p className="font-semibold text-slate-900">{item.dueDate || "-"}</p>
                      </div>
                    </div>

                    <WorkItemStatusForm
                      workItemId={item.id}
                      workCycleId={item.workCycleId}
                      currentStatus={item.status}
                      updatedByName={currentUserName}
                    />

                    {item.note ? <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700">หมายเหตุ: {item.note}</p> : null}
                    {item.blockedReason ? (
                      <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        ปัญหา: {item.blockedReason}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {!isStaffView ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <h3 className="text-lg font-bold text-slate-950">มุมมองผู้จัดการ</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {groups.map((group) => (
              <div key={group.cycle.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{group.cycle.customerName}</p>
                <p className="mt-1 text-sm text-slate-500">ค้าง {group.openCount} งาน</p>
                <p className="mt-1 text-sm text-rose-600">ติดปัญหา {group.blockedCount} งาน</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
