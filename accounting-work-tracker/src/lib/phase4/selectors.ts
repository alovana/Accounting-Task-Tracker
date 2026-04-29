import { getWorkCycleStatusLabel, getWorkItemStatusLabel } from "@/lib/phase3/status-mappers";
import type { Customer } from "@/types/domain";
import type { WorkCycle, WorkItem } from "@/lib/mock/phase3-data";

const COMPLETED_STATUSES: WorkItem["status"][] = ["completed", "skipped"];
const OPEN_STATUSES: WorkItem["status"][] = ["not_started", "in_progress", "waiting_customer", "blocked"];

export function getDashboardKpis(workCycles: WorkCycle[], workItems: WorkItem[]) {
  return [
    {
      label: "รอบงานทั้งหมด",
      value: workCycles.length.toString(),
      description: "จำนวนรอบงานที่ระบบกำลังติดตาม",
    },
    {
      label: "งานที่ต้องทำต่อ",
      value: workItems
        .filter((item) => item.status === "not_started" || item.status === "in_progress")
        .length.toString(),
      description: "รวมงานที่ยังไม่ปิดและยังต้องติดตาม",
    },
    {
      label: "งานติดปัญหา",
      value: workItems.filter((item) => item.status === "blocked").length.toString(),
      description: "งานที่ต้องได้รับการช่วยเหลือหรือข้อมูลเพิ่ม",
    },
    {
      label: "งานเสร็จแล้ว",
      value: workItems.filter((item) => item.status === "completed").length.toString(),
      description: "งานที่ปิดสถานะ completed แล้ว",
    },
  ];
}

export function getStaffSummaries(workItems: WorkItem[]) {
  const grouped = new Map<string, { owner: string; items: WorkItem[] }>();

  workItems.forEach((item) => {
    const key = item.assignedUserId || `name:${item.assignedTo || "Unassigned"}`;
    const current = grouped.get(key) ?? { owner: item.assignedTo || "Unassigned", items: [] };
    current.items.push(item);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map(({ owner, items }) => ({
      owner,
      total: items.length,
      blocked: items.filter((item) => item.status === "blocked").length,
      inProgress: items.filter((item) => item.status === "in_progress").length,
      waitingCustomer: items.filter((item) => item.status === "waiting_customer").length,
      completed: items.filter((item) => COMPLETED_STATUSES.includes(item.status)).length,
      completionRate: items.length === 0 ? 0 : Math.round((items.filter((item) => COMPLETED_STATUSES.includes(item.status)).length / items.length) * 100),
    }))
    .sort((a, b) => b.total - a.total || a.owner.localeCompare(b.owner));
}

export function getWorkCycleHealth(workCycles: WorkCycle[]) {
  return ["planned", "in_progress", "at_risk", "completed"].map((status) => ({
    label: getWorkCycleStatusLabel(status as WorkCycle["status"]),
    value: workCycles.filter((item) => item.status === status).length,
  }));
}

export function getAttentionItems(workItems: WorkItem[]) {
  return workItems
    .filter((item) => item.status === "blocked" || item.status === "waiting_customer")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getRecentItems(workItems: WorkItem[], limit = 5) {
  return [...workItems]
    .filter((item) => !COMPLETED_STATUSES.includes(item.status))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
}

export function getStaffWorkloadGroups(workItems: WorkItem[], cycleById?: Map<string, WorkCycle>) {
  const grouped = new Map<string, { owner: string; items: WorkItem[] }>();

  workItems.forEach((item) => {
    const key = item.assignedUserId || `name:${item.assignedTo || "Unassigned"}`;
    const current = grouped.get(key) ?? { owner: item.assignedTo || "Unassigned", items: [] };
    current.items.push(item);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map(({ owner, items }) => ({
      owner,
      total: items.length,
      open: items.filter((item) => OPEN_STATUSES.includes(item.status)).length,
      inProgress: items.filter((item) => item.status === "in_progress").length,
      waitingCustomer: items.filter((item) => item.status === "waiting_customer").length,
      blocked: items.filter((item) => item.status === "blocked").length,
      completed: items.filter((item) => COMPLETED_STATUSES.includes(item.status)).length,
      items: [...items]
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title))
        .map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          dueDate: item.dueDate,
          workCycleId: item.workCycleId,
          customerName: cycleById?.get(item.workCycleId)?.customerName ?? "ไม่ระบุลูกค้า",
          blocker: item.blockedReason,
        })),
    }))
    .sort((a, b) => b.open - a.open || b.blocked - a.blocked || a.owner.localeCompare(b.owner));
}

export function getWorkloadStatusBreakdown(workItems: WorkItem[]) {
  return ["not_started", "in_progress", "waiting_customer", "blocked", "completed", "skipped"].map((status) => ({
    label: getWorkItemStatusLabel(status as WorkItem["status"]),
    value: workItems.filter((item) => item.status === status).length,
  }));
}

export function getStaffDashboardSummary(
  workItems: WorkItem[],
  customers: Customer[],
  ownerId?: string,
  ownerName = "พนักงาน A"
) {
  const myItems = ownerId
    ? workItems.filter((item) => item.assignedUserId === ownerId)
    : workItems.filter((item) => item.assignedTo === ownerName);
  const myCustomers = ownerId
    ? customers.filter((item) => item.assignedUserId === ownerId)
    : customers.filter((item) => item.assignedUserName === ownerName);

  return {
    owner: ownerName,
    myOpenItems: myItems.filter(
      (item) => item.status === "not_started" || item.status === "in_progress"
    ).length,
    myBlockedItems: myItems.filter((item) => item.status === "blocked").length,
    myWaitingCustomerItems: myItems.filter((item) => item.status === "waiting_customer").length,
    myCustomers: myCustomers.length,
  };
}
