"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/phase2/empty-state";
import { StatusBadge } from "@/components/phase2/status-badge";
import { WorkCycleStatusBadge } from "@/components/phase3/work-cycle-status-badge";
import { WorkItemStatusBadge } from "@/components/phase3/work-item-status-badge";
import { WorkItemStatusForm } from "@/components/phase3/work-item-status-form";
import { getRecommendedCycleStatus } from "@/lib/phase3/selectors";
import { getNextAllowedStatuses, getWorkItemStatusLabel } from "@/lib/phase3/status-mappers";
import type { WorkCycle, WorkItem, WorkItemUpdate, WorkItemStatus } from "@/lib/mock/phase3-data";

type WorkCycleBoardProps = {
  workCycles: WorkCycle[];
  workItems: WorkItem[];
  workItemUpdates: WorkItemUpdate[];
  isStaffView: boolean;
  currentUserId?: string;
  currentUserName: string;
};

type ViewMode = "my_tasks" | "by_customer";
type DueFilter = "all" | "overdue" | "due_soon" | "no_due_date";
type StatusFilter = "all" | WorkItemStatus;

type CustomerGroup = {
  cycle: WorkCycle;
  filteredItems: WorkItem[];
  allItems: WorkItem[];
  visibleOpenItems: WorkItem[];
  matchingMyItems: number;
  completedCount: number;
  blockedCount: number;
  waitingCount: number;
  overdueCount: number;
  dueSoonCount: number;
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

function isMyTask(item: WorkItem, currentUserId: string | undefined, currentUserName: string, isStaffView: boolean) {
  if (isStaffView) {
    return true;
  }

  if (currentUserId) {
    return item.assignedUserId === currentUserId;
  }

  return item.assignedTo === currentUserName;
}

function isCompletedStatus(status: WorkItemStatus) {
  return status === "completed" || status === "skipped";
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
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function getStatusTone(item: WorkItem) {
  if (item.status === "blocked") {
    return "from-rose-200 via-pink-200 to-orange-100";
  }

  if (item.status === "waiting_customer") {
    return "from-amber-100 via-orange-100 to-yellow-50";
  }

  if (isOverdue(item.dueDate)) {
    return "from-fuchsia-200 via-rose-200 to-orange-100";
  }

  if (isDueSoon(item.dueDate)) {
    return "from-cyan-100 via-sky-100 to-blue-100";
  }

  return "from-violet-200 via-fuchsia-100 to-cyan-100";
}

export function WorkCycleBoard({
  workCycles,
  workItems,
  workItemUpdates,
  isStaffView,
  currentUserId,
  currentUserName,
}: WorkCycleBoardProps) {
  const latestUpdateMap = useMemo(
    () => new Map(workItemUpdates.map((update) => [update.workItemId, update])),
    [workItemUpdates],
  );
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(isStaffView ? "my_tasks" : "by_customer");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [showCompletedItems, setShowCompletedItems] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [expandedMobileItemId, setExpandedMobileItemId] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();

  const customerOptions = useMemo(() => {
    return workCycles.map((cycle) => ({ value: cycle.id, label: `${cycle.customerName} (${cycle.periodMonth}/${cycle.periodYear})` }));
  }, [workCycles]);

  const customerGroups = useMemo<CustomerGroup[]>(() => {
    return workCycles
      .map((cycle) => {
        const allItems = workItems.filter((item) => item.workCycleId === cycle.id);
        const visibleOpenItems = allItems.filter((item) => showCompletedItems || !isCompletedStatus(item.status));
        const filteredItems = visibleOpenItems.filter((item) => {
          if (customerFilter !== "all" && cycle.id !== customerFilter) {
            return false;
          }

          const latestComment = latestUpdateMap.get(item.id)?.comment;
          const queryMatch = matchesQuery(item, cycle, latestComment, normalizedQuery);

          if (!queryMatch) {
            return false;
          }

          if (!matchesStatusFilter(item, statusFilter)) {
            return false;
          }

          if (!matchesDueFilter(item, dueFilter)) {
            return false;
          }

          if (viewMode === "my_tasks" && !isMyTask(item, currentUserId, currentUserName, isStaffView)) {
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
          visibleOpenItems,
          matchingMyItems: visibleOpenItems.filter((item) => isMyTask(item, currentUserId, currentUserName, isStaffView)).length,
          completedCount: allItems.filter((item) => item.status === "completed" || item.status === "skipped").length,
          blockedCount: allItems.filter((item) => item.status === "blocked").length,
          waitingCount: allItems.filter((item) => item.status === "waiting_customer").length,
          overdueCount: filteredItems.filter((item) => isOverdue(item.dueDate)).length,
          dueSoonCount: filteredItems.filter((item) => isDueSoon(item.dueDate)).length,
        } satisfies CustomerGroup;
      })
      .filter((value): value is CustomerGroup => Boolean(value));
  }, [
    currentUserId,
    currentUserName,
    customerFilter,
    dueFilter,
    isStaffView,
    latestUpdateMap,
    normalizedQuery,
    showCompletedItems,
    statusFilter,
    viewMode,
    workCycles,
    workItems,
  ]);

  const allVisibleItems = useMemo(() => customerGroups.flatMap((group) => group.filteredItems), [customerGroups]);

  const selectedGroup = useMemo(() => {
    if (customerGroups.length === 0) {
      return null;
    }

    if (!selectedCycleId) {
      return customerGroups[0];
    }

    return customerGroups.find((group) => group.cycle.id === selectedCycleId) ?? customerGroups[0];
  }, [customerGroups, selectedCycleId]);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <div className="hidden lg:flex lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Monthly Work Board</p>
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
                ค้นหารอบงาน งานย่อย หรือผู้รับผิดชอบ
              </label>
              <input
                id="work-cycle-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาจากลูกค้า งาน ผู้รับผิดชอบ หรือ blocker"
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

          <div className="hidden flex-wrap items-center gap-2 text-xs text-slate-500 lg:flex">
            <button
              type="button"
              onClick={() => setShowCompletedItems((value) => !value)}
              className={`rounded-full border px-3 py-1.5 transition ${
                showCompletedItems
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {showCompletedItems ? "ซ่อนงานที่เสร็จแล้ว" : "แสดงงานที่เสร็จแล้ว"}
            </button>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">ลูกค้าที่แสดง {customerGroups.length} ราย</span>
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
                setShowCompletedItems(false);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
            >
              ล้าง filters
            </button>
          </div>
        </div>
      </div>

      {customerGroups.length === 0 || !selectedGroup ? (
        <EmptyState
          title="ไม่พบงานที่ตรงเงื่อนไข"
          description="ลองล้าง filters หรือค้นหาด้วยคำอื่น เช่น ชื่อลูกค้า ชื่องาน ผู้รับผิดชอบ หรือ blocker"
        />
      ) : (
        <>
          <section className="space-y-4 lg:hidden">
            <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-pink-100 via-fuchsia-50 to-cyan-100 p-5 text-slate-800 shadow-[0_24px_70px_-30px_rgba(244,114,182,0.45)] ring-1 ring-white/70">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-pink-300/45 blur-2xl" />
              <div className="absolute right-10 top-16 h-16 w-16 rounded-full bg-cyan-200/50 blur-xl" />
              <div className="absolute -bottom-8 left-4 h-24 w-24 rounded-full bg-violet-200/45 blur-2xl" />
              <div className="relative space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-500">Bubble Mode</p>
                    <h3 className="mt-2 text-2xl font-semibold leading-tight text-slate-900">Monthly Work Board</h3>
                    <p className="mt-2 text-sm text-slate-600">มุมมองมือถือโทนพาสเทล ดูง่าย สดใส และโฟกัสงานที่ต้องทำก่อน</p>
                  </div>
                  <div className="rounded-[24px] border border-white/80 bg-white/70 px-3 py-2 text-right shadow-sm backdrop-blur">
                    <p className="text-[11px] text-slate-500">Open tasks</p>
                    <p className="text-xl font-semibold text-slate-900">{allVisibleItems.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-[24px] bg-white/75 px-3 py-3 shadow-sm ring-1 ring-pink-100 backdrop-blur">
                    <p className="text-slate-500">ลูกค้า</p>
                    <p className="mt-1 text-lg font-semibold text-fuchsia-600">{customerGroups.length}</p>
                  </div>
                  <div className="rounded-[24px] bg-white/75 px-3 py-3 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
                    <p className="text-slate-500">เสร็จแล้ว</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600">
                      {customerGroups.reduce((sum, group) => sum + group.completedCount, 0)}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-white/75 px-3 py-3 shadow-sm ring-1 ring-rose-100 backdrop-blur">
                    <p className="text-slate-500">ติดปัญหา</p>
                    <p className="mt-1 text-lg font-semibold text-rose-500">
                      {customerGroups.reduce((sum, group) => sum + group.blockedCount, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-[30px] border border-pink-100 bg-gradient-to-br from-white via-pink-50/70 to-cyan-50/70 p-4 shadow-[0_20px_50px_-35px_rgba(236,72,153,0.35)]">
              <div className="inline-flex rounded-[22px] border border-white/80 bg-white/80 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("my_tasks")}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    viewMode === "my_tasks"
                      ? "bg-gradient-to-r from-fuchsia-400 to-violet-400 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  My Tasks
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("by_customer")}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    viewMode === "by_customer"
                      ? "bg-gradient-to-r from-fuchsia-400 to-violet-400 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  By Customer
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowCompletedItems((value) => !value)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  showCompletedItems
                    ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-gradient-to-r from-pink-50 to-violet-50 text-slate-700 ring-1 ring-pink-100"
                }`}
              >
                {showCompletedItems ? "กำลังแสดงงานที่เสร็จแล้ว, กดเพื่อซ่อน" : "ซ่อนงานที่เสร็จแล้วอยู่, กดเพื่อแสดงทั้งหมด"}
              </button>

              <div className="grid gap-3">
                <select
                  value={customerFilter}
                  onChange={(event) => setCustomerFilter(event.target.value)}
                  className="w-full rounded-[22px] border border-white/80 bg-white/85 px-4 py-3 text-sm text-slate-700 outline-none shadow-sm focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                >
                  <option value="all">เลือกลูกค้าทั้งหมด</option>
                  {customerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="w-full rounded-[22px] border border-white/80 bg-white/85 px-4 py-3 text-sm text-slate-700 outline-none shadow-sm focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                  >
                    {statusFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={dueFilter}
                    onChange={(event) => setDueFilter(event.target.value as DueFilter)}
                    className="w-full rounded-[22px] border border-white/80 bg-white/85 px-4 py-3 text-sm text-slate-700 outline-none shadow-sm focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                  >
                    <option value="all">กำหนดส่งทั้งหมด</option>
                    <option value="overdue">เลยกำหนด</option>
                    <option value="due_soon">ใกล้ครบกำหนด</option>
                    <option value="no_due_date">ยังไม่มี due date</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {customerGroups.map((group) => {
                const isSelected = selectedGroup.cycle.id === group.cycle.id;

                return (
                  <button
                    key={group.cycle.id}
                    type="button"
                    onClick={() => setSelectedCycleId(group.cycle.id)}
                    className={`min-w-[240px] rounded-[26px] p-[1px] text-left transition ${
                      isSelected
                        ? "bg-gradient-to-r from-pink-300 via-fuchsia-300 to-cyan-200 shadow-[0_20px_50px_-28px_rgba(244,114,182,0.55)]"
                        : "bg-gradient-to-r from-pink-100 via-violet-100 to-cyan-100"
                    }`}
                  >
                    <div className="rounded-[25px] bg-white/90 px-4 py-4 text-slate-900 backdrop-blur">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold">{group.cycle.customerName}</p>
                          <p className="mt-1 text-xs text-slate-500">รอบงาน {group.cycle.periodMonth}/{group.cycle.periodYear}</p>
                        </div>
                        <div className="shrink-0">
                          <WorkCycleStatusBadge status={getRecommendedCycleStatus(group.filteredItems)} />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-[20px] bg-pink-50 px-3 py-2 text-fuchsia-700">
                          <p>เปิดอยู่</p>
                          <p className="mt-1 text-base font-semibold">{group.filteredItems.length}</p>
                        </div>
                        <div className="rounded-[20px] bg-emerald-50 px-3 py-2 text-emerald-700">
                          <p>เสร็จแล้ว</p>
                          <p className="mt-1 text-base font-semibold">{group.completedCount}</p>
                        </div>
                        <div className="rounded-[20px] bg-rose-50 px-3 py-2 text-rose-600">
                          <p>ติดปัญหา</p>
                          <p className="mt-1 text-base font-semibold">{group.blockedCount}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="rounded-[30px] border border-violet-100 bg-gradient-to-r from-white via-violet-50 to-pink-50 p-4 shadow-[0_18px_45px_-30px_rgba(192,132,252,0.4)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950">{selectedGroup.cycle.customerName}</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      รอบงาน {selectedGroup.cycle.periodMonth}/{selectedGroup.cycle.periodYear}
                    </p>
                  </div>
                  <div className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-fuchsia-700 shadow-sm ring-1 ring-fuchsia-100">
                    {selectedGroup.filteredItems.length} open
                  </div>
                </div>
              </div>

              {selectedGroup.filteredItems.map((item) => {
                const latestUpdate = latestUpdateMap.get(item.id);
                const overdue = isOverdue(item.dueDate);
                const dueSoon = isDueSoon(item.dueDate);
                const isExpanded = expandedMobileItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-[32px] bg-white/90 shadow-[0_22px_55px_-32px_rgba(236,72,153,0.35)] ring-1 ring-pink-100"
                  >
                    <div className={`bg-gradient-to-r ${getStatusTone(item)} p-[1px]`}>
                      <div className="rounded-[31px] bg-white/95 p-4 backdrop-blur">
                        <button
                          type="button"
                          onClick={() => setExpandedMobileItemId((value) => (value === item.id ? null : item.id))}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-base font-semibold text-slate-900">{item.title}</p>
                                {overdue ? <StatusBadge label="overdue" tone="amber" /> : null}
                                {!overdue && dueSoon ? <StatusBadge label="due soon" tone="green" /> : null}
                              </div>
                              <p className="mt-2 text-sm text-slate-500">{item.assignedTo}</p>
                              <p className="mt-1 text-sm font-medium text-slate-700">กำหนดส่ง {item.dueDate || "-"}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <WorkItemStatusBadge status={item.status} />
                              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-fuchsia-500 ring-1 ring-fuchsia-100">
                                {isExpanded ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
                              </span>
                            </div>
                          </div>
                        </button>

                        {isExpanded ? (
                          <div className="mt-4 space-y-3 border-t border-pink-100 pt-4">
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                              {getNextAllowedStatuses(item.status).map((status) => (
                                <span
                                  key={status}
                                  className="rounded-full bg-gradient-to-r from-pink-50 to-violet-50 px-3 py-1 text-fuchsia-700 ring-1 ring-pink-100"
                                >
                                  next: {getWorkItemStatusLabel(status)}
                                </span>
                              ))}
                            </div>

                            <WorkItemStatusForm
                              workItemId={item.id}
                              workCycleId={item.workCycleId}
                              currentStatus={item.status}
                              updatedByName={currentUserName}
                              compact
                            />

                            {item.note ? (
                              <div className="rounded-[22px] bg-gradient-to-r from-slate-50 to-pink-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-100">
                                หมายเหตุ: {item.note}
                              </div>
                            ) : null}

                            {latestUpdate ? (
                              <div className="rounded-[22px] bg-gradient-to-r from-cyan-50 to-sky-50 px-4 py-3 text-sm text-sky-800 ring-1 ring-cyan-100">
                                อัปเดตล่าสุด: {latestUpdate.comment} ({latestUpdate.updatedBy})
                              </div>
                            ) : null}

                            {item.blockedReason ? (
                              <div className="rounded-[22px] bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
                                blocker: {item.blockedReason}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="hidden gap-5 lg:grid xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-3 xl:sticky xl:top-6 xl:self-start">
              {customerGroups.map((group) => {
                const isSelected = selectedGroup.cycle.id === group.cycle.id;
                const derivedCycleStatus = getRecommendedCycleStatus(group.filteredItems);

                return (
                  <button
                    key={group.cycle.id}
                    type="button"
                    onClick={() => setSelectedCycleId(group.cycle.id)}
                    className={[
                      "w-full rounded-[24px] border p-4 text-left transition duration-200",
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.7)]"
                        : "border-slate-200 bg-white text-slate-900 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)] hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-base font-semibold ${isSelected ? "text-white" : "text-slate-950"}`}>{group.cycle.customerName}</p>
                        <p className={`mt-1 text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          รอบงาน {group.cycle.periodMonth}/{group.cycle.periodYear}
                        </p>
                      </div>
                      <WorkCycleStatusBadge status={derivedCycleStatus} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className={`rounded-2xl border px-3 py-2 ${isSelected ? "border-white/10 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                        งาน {group.filteredItems.length}/{group.visibleOpenItems.length}
                      </div>
                      <div className={`rounded-2xl border px-3 py-2 ${isSelected ? "border-white/10 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                        เสร็จ {group.completedCount}
                      </div>
                      <div className={`rounded-2xl border px-3 py-2 ${isSelected ? "border-white/10 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                        รอลูกค้า {group.waitingCount}
                      </div>
                      <div className={`rounded-2xl border px-3 py-2 ${isSelected ? "border-white/10 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                        ติดปัญหา {group.blockedCount}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {viewMode === "my_tasks" && !isStaffView ? <StatusBadge label={`ของฉัน ${group.matchingMyItems}`} tone="green" /> : null}
                      {group.overdueCount > 0 ? <StatusBadge label={`overdue ${group.overdueCount}`} tone="amber" /> : null}
                      {group.dueSoonCount > 0 ? <StatusBadge label={`due soon ${group.dueSoonCount}`} tone="green" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.22)] md:p-6">
              <div className="border-b border-slate-100 pb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-slate-950">{selectedGroup.cycle.customerName}</h3>
                      <WorkCycleStatusBadge status={getRecommendedCycleStatus(selectedGroup.filteredItems)} />
                      <StatusBadge label={`${selectedGroup.filteredItems.length}/${selectedGroup.visibleOpenItems.length} tasks`} tone="slate" />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      รอบงาน {selectedGroup.cycle.periodMonth}/{selectedGroup.cycle.periodYear} · generated {selectedGroup.cycle.generatedAt}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                    {selectedGroup.blockedCount > 0 ? <StatusBadge label={`blocked ${selectedGroup.blockedCount}`} tone="amber" /> : null}
                    {selectedGroup.waitingCount > 0 ? <StatusBadge label={`waiting ${selectedGroup.waitingCount}`} tone="amber" /> : null}
                    {selectedGroup.overdueCount > 0 ? <StatusBadge label={`overdue ${selectedGroup.overdueCount}`} tone="amber" /> : null}
                    {selectedGroup.dueSoonCount > 0 ? <StatusBadge label={`due soon ${selectedGroup.dueSoonCount}`} tone="green" /> : null}
                    <StatusBadge label={`เสร็จ ${selectedGroup.completedCount}/${selectedGroup.allItems.length || 0}`} tone="green" />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {getRecommendedCycleStatus(selectedGroup.filteredItems) === selectedGroup.cycle.status
                    ? "สถานะรอบงานสอดคล้องกับงานย่อยแล้ว"
                    : "มีสัญญาณว่าสถานะรอบงานอาจต้องทบทวน"}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {selectedGroup.filteredItems.map((item) => {
                  const latestUpdate = latestUpdateMap.get(item.id);
                  const overdue = isOverdue(item.dueDate);
                  const dueSoon = isDueSoon(item.dueDate);

                  return (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
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
                          <span key={status} className="rounded-full border border-slate-200 bg-white px-3 py-1">
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
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
