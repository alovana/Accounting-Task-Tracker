import type { Customer } from "@/types/domain";

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
    id: "wc-2026-03-001",
    customerId: "cus-1",
    customerName: "บริษัท เอ บิสซิเนส จำกัด",
    periodYear: 2026,
    periodMonth: 3,
    status: "in_progress",
    generatedAt: "2026-04-01 09:00",
    generatedBy: "admin",
  },
  {
    id: "wc-2026-03-002",
    customerId: "cus-2",
    customerName: "บริษัท บี เทรดดิ้ง จำกัด",
    periodYear: 2026,
    periodMonth: 3,
    status: "at_risk",
    generatedAt: "2026-04-01 09:00",
    generatedBy: "admin",
  },
  {
    id: "wc-2026-03-003",
    customerId: "cus-3",
    customerName: "ร้าน ครัวสุขใจ",
    periodYear: 2026,
    periodMonth: 3,
    status: "planned",
    generatedAt: "2026-04-01 09:00",
    generatedBy: "admin",
  },
];

export const workItems: WorkItem[] = [
  {
    id: "wi-1",
    workCycleId: "wc-2026-03-001",
    title: "ตรวจสอบรายรับและค่าใช้จ่าย",
    assignedTo: "พนักงาน A",
    status: "in_progress",
    dueDate: "2026-04-05",
    note: "เริ่มตรวจรายการแล้ว",
  },
  {
    id: "wi-2",
    workCycleId: "wc-2026-03-001",
    title: "กระทบยอดธนาคาร",
    assignedTo: "พนักงาน A",
    status: "waiting_customer",
    dueDate: "2026-04-07",
    note: "รอ statement เพิ่มเติม",
  },
  {
    id: "wi-3",
    workCycleId: "wc-2026-03-002",
    title: "ตรวจสอบสต็อกคงเหลือ",
    assignedTo: "พนักงาน B",
    status: "blocked",
    dueDate: "2026-04-04",
    blockedReason: "ลูกค้ายังไม่ส่งรายงานสินค้าคงเหลือ",
  },
  {
    id: "wi-4",
    workCycleId: "wc-2026-03-002",
    title: "ตรวจสอบเจ้าหนี้และลูกหนี้",
    assignedTo: "หัวหน้าทีม 1",
    status: "not_started",
    dueDate: "2026-04-08",
  },
  {
    id: "wi-5",
    workCycleId: "wc-2026-03-003",
    title: "เตรียมรายการเปิดรอบเดือนแรก",
    assignedTo: "พนักงาน C",
    status: "planned" as never,
    dueDate: "2026-04-10",
    note: "ลูกค้า onboarding ใหม่",
  },
].map((item) => ({
  ...item,
  status: item.status === ("planned" as never) ? "not_started" : item.status,
}));

export const workItemUpdates: WorkItemUpdate[] = [
  {
    id: "up-1",
    workItemId: "wi-1",
    oldStatus: "not_started",
    newStatus: "in_progress",
    comment: "เริ่มตรวจเอกสารและลงรายการเบื้องต้น",
    updatedBy: "พนักงาน A",
    createdAt: "2026-04-03 10:15",
  },
  {
    id: "up-2",
    workItemId: "wi-2",
    oldStatus: "in_progress",
    newStatus: "waiting_customer",
    comment: "ขอ statement เดือนมีนาคมเพิ่ม",
    updatedBy: "พนักงาน A",
    createdAt: "2026-04-04 14:20",
  },
  {
    id: "up-3",
    workItemId: "wi-3",
    oldStatus: "in_progress",
    newStatus: "blocked",
    comment: "ยังไม่ได้รับรายงานสต็อกจากลูกค้า",
    updatedBy: "พนักงาน B",
    createdAt: "2026-04-04 16:45",
  },
];

export function getCustomerSummary(customers: Customer[]) {
  return {
    totalCustomers: customers.length,
  };
}
