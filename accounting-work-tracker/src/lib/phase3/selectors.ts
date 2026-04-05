import type { WorkCycle, WorkItem, WorkItemUpdate } from "@/lib/mock/phase3-data";

export function getWorkCycleSummary(workCycles: WorkCycle[], workItems: WorkItem[]) {
  return [
    {
      label: "รอบงานทั้งหมด",
      value: workCycles.length.toString(),
    },
    {
      label: "งานที่ติดปัญหา",
      value: workItems.filter((item) => item.status === "blocked").length.toString(),
    },
    {
      label: "รอลูกค้า",
      value: workItems.filter((item) => item.status === "waiting_customer").length.toString(),
    },
    {
      label: "เสร็จแล้ว",
      value: workItems.filter((item) => item.status === "completed").length.toString(),
    },
  ];
}

export function getWorkItemsByCycle(workItems: WorkItem[], workCycleId: string) {
  return workItems.filter((item) => item.workCycleId === workCycleId);
}

export function getBlockedWorkItems(workItems: WorkItem[]) {
  return workItems.filter((item) => Boolean(item.blockedReason));
}

export function getUpdatesForDisplay(workItemUpdates: WorkItemUpdate[]) {
  return [...workItemUpdates].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
