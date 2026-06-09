import type { WorkCycleStatus, WorkItemStatus } from "@/lib/mock/phase3-data";

export const workItemStatusLabelMap: Record<WorkItemStatus, string> = {
  not_started: "ยังไม่เริ่ม",
  in_progress: "กำลังทำ",
  waiting_customer: "รอลูกค้า",
  blocked: "ติดปัญหา",
  completed: "เสร็จแล้ว",
  skipped: "ข้าม",
};

export const workCycleStatusLabelMap: Record<WorkCycleStatus, string> = {
  planned: "ยังไม่เริ่ม",
  in_progress: "กำลังทำ",
  at_risk: "มีปัญหา",
  completed: "เสร็จแล้ว",
};

export function getWorkItemStatusLabel(status: WorkItemStatus) {
  return workItemStatusLabelMap[status];
}

export function getWorkCycleStatusLabel(status: WorkCycleStatus) {
  return workCycleStatusLabelMap[status];
}

export function getNextAllowedStatuses(status: WorkItemStatus): WorkItemStatus[] {
  const transitions: Record<WorkItemStatus, WorkItemStatus[]> = {
    not_started: ["in_progress", "waiting_customer", "blocked", "completed"],
    in_progress: ["waiting_customer", "blocked", "completed"],
    waiting_customer: ["in_progress", "blocked", "completed"],
    blocked: ["in_progress", "waiting_customer", "completed"],
    completed: ["in_progress"],
    skipped: ["in_progress"],
  };

  return transitions[status];
}
