import { getWorkCycleStatusLabel, getWorkItemStatusLabel } from "@/lib/phase3/status-mappers";
import type { Customer } from "@/types/domain";
import type { WorkCycle, WorkItem } from "@/lib/mock/phase3-data";

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
  const grouped = new Map<string, WorkItem[]>();

  workItems.forEach((item) => {
    const current = grouped.get(item.assignedTo) ?? [];
    current.push(item);
    grouped.set(item.assignedTo, current);
  });

  return Array.from(grouped.entries())
    .map(([owner, items]) => ({
      owner,
      total: items.length,
      blocked: items.filter((item) => item.status === "blocked").length,
      inProgress: items.filter((item) => item.status === "in_progress").length,
      waitingCustomer: items.filter((item) => item.status === "waiting_customer").length,
      completed: items.filter((item) => item.status === "completed").length,
      completionRate: items.length === 0 ? 0 : Math.round((items.filter((item) => item.status === "completed").length / items.length) * 100),
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
    .filter((item) => item.status !== "completed" && item.status !== "skipped")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
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
  owner = "พนักงาน A"
) {
  const myItems = workItems.filter((item) => item.assignedTo === owner);
  const myCustomers = customers.filter((item) => item.assignedUserName === owner);

  return {
    owner,
    myOpenItems: myItems.filter(
      (item) => item.status === "not_started" || item.status === "in_progress"
    ).length,
    myBlockedItems: myItems.filter((item) => item.status === "blocked").length,
    myWaitingCustomerItems: myItems.filter((item) => item.status === "waiting_customer").length,
    myCustomers: myCustomers.length,
  };
}
