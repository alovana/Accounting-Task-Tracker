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
      completed: items.filter((item) => item.status === "completed").length,
    }))
    .sort((a, b) => b.total - a.total || a.owner.localeCompare(b.owner));
}

export function getWorkCycleHealth(workCycles: WorkCycle[]) {
  return [
    {
      label: "planned",
      value: workCycles.filter((item) => item.status === "planned").length,
    },
    {
      label: "in progress",
      value: workCycles.filter((item) => item.status === "in_progress").length,
    },
    {
      label: "at risk",
      value: workCycles.filter((item) => item.status === "at_risk").length,
    },
    {
      label: "completed",
      value: workCycles.filter((item) => item.status === "completed").length,
    },
  ];
}

export function getAttentionItems(workItems: WorkItem[]) {
  return workItems.filter(
    (item) => item.status === "blocked" || item.status === "waiting_customer"
  );
}

export function getRecentItems(workItems: WorkItem[], limit = 5) {
  return [...workItems]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
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
