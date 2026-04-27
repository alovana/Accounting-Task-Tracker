"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/phase2/empty-state";
import { StatusBadge } from "@/components/phase2/status-badge";
import { WorkCycleStatusBadge } from "@/components/phase3/work-cycle-status-badge";
import { WorkItemAttachments } from "@/components/phase3/work-item-attachments";
import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import { WorkItemStatusForm } from "@/components/phase3/work-item-status-form";
import { getRecommendedCycleStatus } from "@/lib/phase3/selectors";
import { getNextAllowedStatuses, getWorkItemStatusLabel } from "@/lib/phase3/status-mappers";
import type { WorkCycle, WorkItem, WorkItemUpdate, WorkItemStatus } from "@/lib/mock/phase3-data";
import type { WorkItemFile } from "@/types/attachments";

type WorkCycleBoardProps = {
  workCycles: WorkCycle[];
  workItems: WorkItem[];
  workItemUpdates: WorkItemUpdate[];
  workItemFiles: WorkItemFile[];
  isStaffView: boolean;
  currentUserName: string;
};

type ViewMode = "my_tasks" | "by_customer";
type DueFilter = "all" | "overdue" | "due_soon" | "no_due_date";
type StatusFilter = "all" | WorkItemStatus;

type CustomerGroup = {
  cycle: WorkCycle;
  filteredItems: WorkItem[];
  allItems: WorkItem[];
  matchingMyItems: number;
  completedCount: number;
  blockedCount: number;
  waitingCount: number;
  overdueCount: number;
  dueSoonCount: number;
  openByDefault: boolean;
};

const DUE_SOON_DAYS = 3;
const statusFilterOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "not_started", label: "ยังไม่เริ่ม" },
  { value: "in_progress", label: "กำลังทำ" },
  { value: "waiting_customer", label: "รอลูกค้า" },
  { value: "blocked", label: "ติดปัญหา" },
  { value: "completed", label: "เสร็จแล้ว" },
  { value: "skipped", label: "ข้าม" },
];

function parseDateValue(value?: string) {
  if (!value) {
    return null;
  }

  const normalized = `${value}T00:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateDiffInDays(value?: string) {
  const date = parseDateValue(value);
  if (!date) {
    return null;
  }

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = targetOnly.getTime() - todayOnly.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function isDueSoon(value?: string) {
  const diff = getDateDiffInDays(value);
  return diff !== null && diff >= 0 && diff <= DUE_SOON_DAYS;
}

function isOverdue(value?: string) {
  const diff = getDateDiffInDays(value);
  return diff !== null && diff < 0;
}

function isMyTask(item: WorkItem, currentUserName: string, isStaffView: boolean) {
  if (isStaffView) {
    return true;
  }

  return item.assignedTo === currentUserName;
}

function matchesStatusFilter(item: WorkItem, statusFilter: StatusFilter) {
  return statusFilter === "all" ? true : item.status === statusFilter;
}

function matchesDueFilter(item: WorkItem, dueFilter: DueFilter) {
  switch (dueFilter) {
    case "all":
      return true;
    case "overdue":
      return isOverdue(item.dueDate);
    case "due_soon":
      return isDueSoon(item.dueDate);
    case "no_due_date":
      return !parseDateValue(item.dueDate);
    default:
      return true;
  }
}

function matchesQuery(
  item: WorkItem,
  cycle: WorkCycle,
  latestComment: string | undefined,
  fileNames: string[],
  normalizedQuery: string,
) {
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    cycle.customerName,
    `${cycle.periodMonth}/${cycle.periodYear}`,
    item.title,
    item.assignedTo,
    item.status,
    item.note,
    item.blockedReason,
    latestComment,
    ...fileNames,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

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
  const filesByWorkItemId = useMemo(() => {
    const grouped = new Map<string, WorkItemFile[]>();

    for (const file of workItemFiles) {
      const current = grouped.get(file.workItemId) || [];
      current.push(file);
      grouped.set(file.workItemId, current);
    }

    return grouped;
  }, [workItemFiles]);

  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(isStaffView ? "my_tasks" : "by_customer");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const normalizedQuery = query.trim().toLowerCase();

  const customerOptions = useMemo(() => {
    return workCycles.map((cycle) => ({ value: cycle.id, label: `${cycle.customerName} (${cycle.periodMonth}/${cycle.periodYear})` }));
  }, [workCycles]);

  const customerGroups = useMemo<CustomerGroup[]>(() => {
    return workCycles
      .map((cycle, index) => {
        const allItems = workItems.filter((item) => item.workCycleId === cycle.id);
        const filteredItems = allItems.filter((item) => {
          if (customerFilter !== "all" && cycle.id !== customerFilter) {
            return false;
          }

          const files = filesByWorkItemId.get(item.id) || [];
          const latestComment = latestUpdateMap.get(item.id)?.comment;
          const queryMatch = matchesQuery(
            item,
            cycle,
            latestComment,
            files.map((file) => file.fileName),
            normalizedQuery,
          );

          if (!queryMatch) {
            return false;
          }

          if (!matchesStatusFilter(item, statusFilter)) {
            return false;
          }

          if (!matchesDueFilter(item, dueFilter)) {
            return false;
          }

          if (viewMode === "my_tasks" && !isMyTask(item, currentUserName, isStaffView)) {
            return false;
          }

          return true;
        });

        if (filteredItems.length === 0) {
          return null;
        }

        return {
          cycle,
          filteredItems,
          allItems,
          matchingMyItems: allItems.filter((item) => isMyTask(item, currentUserName, isStaffView)).length,
          completedCount: allItems.filter((item) => item.status === "completed" || item.status === "skipped").length,
          blockedCount: allItems.filter((item) => item.status === "blocked").length,
          waitingCount: allItems.filter((item) => item.status === "waiting_customer").length,
          overdueCount: filteredItems.filter((item) => isOverdue(item.dueDate)).length,
          dueSoonCount: filteredItems.filter((item) => isDueSoon(item.dueDate)).length,
          openByDefault: viewMode === "my_tasks" || normalizedQuery.length > 0 || index < 2,
        } satisfies CustomerGroup;
      })
      .filter((value): value is CustomerGroup => Boolean(value));
  }, [
    currentUserName,
    customerFilter,
    dueFilter,
    filesByWorkItemId,
    isStaffView,
    latestUpdateMap,
    normalizedQuery,
    statusFilter,
    viewMode,
    workCycles,
    workItems,
  ]);

  const allVisibleItems = customerGroups.flatMap((group) =>
    group.filteredItems.map((item) => ({ item, cycle: group.cycle })),
  );

  const myTaskSummary = useMemo(() => {
    const targetItems = allVisibleItems.map((entry) => entry.item);

    return {
      total: targetItems.length,
      inProgress: targetItems.filter((item) => item.status === "in_progress").length,
      waiting: targetItems.filter((item) => item.status === "waiting_customer").length,
      blocked: targetItems.filter((item) => item.status === "blocked").length,
      overdue: targetItems.filter((item) => isOverdue(item.dueDate)).length,
    };
  }, [allVisibleItems]);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Work Cycle Workspace</p>
              <p className="mt-1 text-xs text-slate-500">
                สลับมุมมองได้ระหว่างงานที่ต้องทำตอนนี้ กับการดูแบบ grouped ตามลูกค้า
              </p>
            </div>
            <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("my_tasks")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  viewMode === "my_tasks" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                My Tasks
              </button>
              <button
                type="button"
                onClick={() => setViewMode("by_customer")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  viewMode === "by_customer" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                By Customer
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label htmlFor="work-cycle-search" className="text-xs font-medium text-slate-600">
                ค้นหารอบงาน งานย่อย หรือชื่อไฟล์แนบ
              </label>
              <input
                id="work-cycle-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาจากลูกค้า งาน ผู้รับผิดชอบ blocker หรือชื่อไฟล์"
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="work-cycle-customer-filter" className="text-xs font-medium text-slate-600">
                ลูกค้า / รอบงาน
              </label>
              <select
                id="work-cycle-customer-filter"
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">ทั้งหมด</option>
                {customerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="work-cycle-status-filter" className="text-xs font-medium text-slate-600">
                สถานะงาน
              </label>
              <select
                id="work-cycle-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {statusFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="work-cycle-due-filter" className="text-xs font-medium text-slate-600">
                กำหนดส่ง
              </label>
              <select
                id="work-cycle-due-filter"
                value={dueFilter}
                onChange={(event) => setDueFilter(event.target.value as DueFilter)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">ทั้งหมด</option>
                <option value="overdue">เลยกำหนด</option>
                <option value="due_soon">ใกล้ครบกำหนด</option>
                <option value="no_due_date">ยังไม่มี due date</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">แสดง {customerGroups.length} กลุ่ม</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">งานที่ตรงเงื่อนไข {allVisibleItems.length} รายการ</span>
            {viewMode === "my_tasks" ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700">โฟกัสเฉพาะงานที่เป็นของฉัน</span>
            ) : (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">ดูแบบ grouped ตามลูกค้า</span>
            )}
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCustomerFilter("all");
                setStatusFilter("all");
                setDueFilter("all");
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
            >
              ล้าง filters
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Visible Tasks</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{myTaskSummary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">In Progress</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{myTaskSummary.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Waiting Customer</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{myTaskSummary.waiting}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Blocked</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{myTaskSummary.blocked}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Overdue</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{myTaskSummary.overdue}</p>
        </div>
      </section>

      {customerGroups.length === 0 ? (
        <EmptyState
          title="ไม่พบงานที่ตรงเงื่อนไข"
          description="ลองล้าง filters หรือค้นหาด้วยคำอื่น เช่น ชื่อลูกค้า ชื่องาน ผู้รับผิดชอบ หรือชื่อไฟล์แนบ"
        />
      ) : (
        <div className="space-y-4">
          {customerGroups.map((group) => (
            <details key={group.cycle.id} open={group.openByDefault} className="group rounded-[28px] border border-slate-200 bg-slate-50">
              <summary className="cursor-pointer list-none p-5 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{group.cycle.customerName}</h3>
                      <WorkCycleStatusBadge status={group.cycle.status} />
                      <StatusBadge label={`${group.filteredItems.length}/${group.allItems.length} tasks`} tone="slate" />
                      {viewMode === "my_tasks" && !isStaffView ? (
                        <StatusBadge label={`ของฉัน ${group.matchingMyItems}`} tone="green" />
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      รอบงาน {group.cycle.periodMonth}/{group.cycle.periodYear} · generated {group.cycle.generatedAt}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                    {group.blockedCount > 0 ? <StatusBadge label={`blocked ${group.blockedCount}`} tone="amber" /> : null}
                    {group.waitingCount > 0 ? <StatusBadge label={`waiting ${group.waitingCount}`} tone="amber" /> : null}
                    {group.overdueCount > 0 ? <StatusBadge label={`overdue ${group.overdueCount}`} tone="amber" /> : null}
                    {group.dueSoonCount > 0 ? <StatusBadge label={`due soon ${group.dueSoonCount}`} tone="green" /> : null}
                    <StatusBadge label={`เสร็จ ${group.completedCount}/${group.allItems.length || 0}`} tone="green" />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {getRecommendedCycleStatus(group.filteredItems) === group.cycle.status ? "สถานะรอบงานสอดคล้องกับงานย่อยแล้ว" : "มีสัญญาณว่าสถานะรอบงานอาจต้องทบทวน"}
                </p>
              </summary>

              <div className="space-y-3 border-t border-slate-200 px-5 pb-5 pt-4 md:px-6 md:pb-6">
                {group.filteredItems.map((item) => {
                  const files = filesByWorkItemId.get(item.id) || [];
                  const latestUpdate = latestUpdateMap.get(item.id);
                  const overdue = isOverdue(item.dueDate);
                  const dueSoon = isDueSoon(item.dueDate);

                  return (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">{item.title}</p>
                            {overdue ? <StatusBadge label="overdue" tone="amber" /> : null}
                            {!overdue && dueSoon ? <StatusBadge label="due soon" tone="green" /> : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            ผู้รับผิดชอบ: {item.assignedTo} · due {item.dueDate || "-"}
                          </p>
                        </div>
                        <WorkItemStatusBadge status={item.status} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        {getNextAllowedStatuses(item.status).map((status) => (
                          <span key={status} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
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
                        <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                          อัปเดตล่าสุด: {latestUpdate.comment} ({latestUpdate.updatedBy})
                        </div>
                      ) : null}

                      {item.blockedReason ? (
                        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                          blocker: {item.blockedReason}
                        </div>
                      ) : null}

                      <WorkItemAttachments workItemId={item.id} files={files} canDelete={!isStaffView} />
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
