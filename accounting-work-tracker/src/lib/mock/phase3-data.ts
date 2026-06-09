import { monthlyAccountingWorkflow } from "@/lib/monthly-workflow";

export type WorkItemStatus =
  | "not_started"
  | "in_progress"
  | "waiting_customer"
  | "blocked"
  | "completed"
  | "skipped";

export type WorkCycleStatus = "planned" | "in_progress" | "at_risk" | "completed";

export type WorkCycle = {
  id: string;
  customerId: string;
  customerName: string;
  periodYear: number;
  periodMonth: number;
  status: WorkCycleStatus;
  generatedAt: string;
  generatedBy: string;
};

export type WorkItem = {
  id: string;
  workCycleId: string;
  title: string;
  assignedUserId?: string;
  assignedTo: string;
  status: WorkItemStatus;
  dueDate: string;
  blockedReason?: string;
  note?: string;
};

export type WorkItemUpdate = {
  id: string;
  workItemId: string;
  oldStatus: WorkItemStatus;
  newStatus: WorkItemStatus;
  comment: string;
  updatedBy: string;
  createdAt: string;
};

export const workCycles: WorkCycle[] = [
  {
    id: "wc-2026-05-001",
    customerId: "cus-1",
    customerName: "บริษัท เอ บิสซิเนส จำกัด",
    periodYear: 2026,
    periodMonth: 5,
    status: "in_progress",
    generatedAt: "2026-06-01 09:00",
    generatedBy: "admin",
  },
  {
    id: "wc-2026-05-002",
    customerId: "cus-2",
    customerName: "บริษัท บี เทรดดิ้ง จำกัด",
    periodYear: 2026,
    periodMonth: 5,
    status: "at_risk",
    generatedAt: "2026-06-01 09:00",
    generatedBy: "admin",
  },
  {
    id: "wc-2026-05-003",
    customerId: "cus-3",
    customerName: "ร้านครัวสุขใจ",
    periodYear: 2026,
    periodMonth: 5,
    status: "planned",
    generatedAt: "2026-06-01 09:00",
    generatedBy: "admin",
  },
];

const cycleSetup: Array<{
  cycleId: string;
  assignedUserId: string;
  assignedTo: string;
  statuses: WorkItemStatus[];
  notes?: Record<number, string>;
  blockedReasons?: Record<number, string>;
}> = [
  {
    cycleId: "wc-2026-05-001",
    assignedUserId: "user-staff-a",
    assignedTo: "พนักงาน A",
    statuses: ["completed", "completed", "in_progress", "not_started", "not_started", "not_started", "not_started"],
    notes: {
      3: "กำลังบันทึกรายการใน Express",
    },
  },
  {
    cycleId: "wc-2026-05-002",
    assignedUserId: "user-staff-b",
    assignedTo: "พนักงาน B",
    statuses: ["completed", "waiting_customer", "not_started", "not_started", "blocked", "not_started", "not_started"],
    notes: {
      2: "รอเอกสารขายเพิ่มเติม",
    },
    blockedReasons: {
      5: "ยังไม่ได้รับหนังสือรับรองหัก ณ ที่จ่ายจากลูกค้า",
    },
  },
  {
    cycleId: "wc-2026-05-003",
    assignedUserId: "user-staff-c",
    assignedTo: "พนักงาน C",
    statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"],
  },
];

export const workItems: WorkItem[] = cycleSetup.flatMap((cycle) =>
  monthlyAccountingWorkflow.map((step, index) => ({
    id: `${cycle.cycleId}-step-${index + 1}`,
    workCycleId: cycle.cycleId,
    title: step.title,
    assignedUserId: cycle.assignedUserId,
    assignedTo: cycle.assignedTo,
    status: cycle.statuses[index],
    dueDate: `2026-06-${String(5 + index * 2).padStart(2, "0")}`,
    note: cycle.notes?.[index + 1],
    blockedReason: cycle.blockedReasons?.[index + 1],
  })),
);

export const workItemUpdates: WorkItemUpdate[] = [
  {
    id: "up-1",
    workItemId: "wc-2026-05-001-step-1",
    oldStatus: "in_progress",
    newStatus: "completed",
    comment: "รับเอกสารครบแล้ว",
    updatedBy: "พนักงาน A",
    createdAt: "2026-06-03 10:15",
  },
  {
    id: "up-2",
    workItemId: "wc-2026-05-002-step-2",
    oldStatus: "in_progress",
    newStatus: "waiting_customer",
    comment: "รอเอกสารขายเพิ่มเติม",
    updatedBy: "พนักงาน B",
    createdAt: "2026-06-04 14:20",
  },
  {
    id: "up-3",
    workItemId: "wc-2026-05-002-step-5",
    oldStatus: "in_progress",
    newStatus: "blocked",
    comment: "ยังไม่ได้รับหนังสือรับรองหัก ณ ที่จ่าย",
    updatedBy: "พนักงาน B",
    createdAt: "2026-06-04 16:45",
  },
];
