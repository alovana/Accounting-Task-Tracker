import type { NotificationEventType } from "@/types/notifications";

type BuildLineMessageParams = {
  eventType: NotificationEventType;
  customerName: string;
  workItemTitle: string;
  assignedTo?: string;
  blockedReason?: string;
  dueDate?: string;
};

const normalizeAssignedTo = (assignedTo?: string) => {
  const trimmed = assignedTo?.trim();
  return trimmed && trimmed !== "-" ? trimmed : "-";
};

export function buildLineNotificationMessage({
  eventType,
  customerName,
  workItemTitle,
  assignedTo,
  blockedReason,
  dueDate,
}: BuildLineMessageParams) {
  const staffLine = `พนักงาน: ${normalizeAssignedTo(assignedTo)}`;

  switch (eventType) {
    case "completed":
      return `แจ้งเตือนงานเสร็จ\nลูกค้า: ${customerName}\nงาน: ${workItemTitle}\n${staffLine}\nสถานะ: completed`;
    case "blocked":
      return `แจ้งเตือนงานติดปัญหา\nลูกค้า: ${customerName}\nงาน: ${workItemTitle}\n${staffLine}\nปัญหา: ${blockedReason ?? "-"}`;
    case "overdue":
      return `แจ้งเตือนงานเกินกำหนด\nลูกค้า: ${customerName}\nงาน: ${workItemTitle}\nกำหนดส่ง: ${dueDate ?? "-"}`;
    default:
      return `${customerName} - ${workItemTitle}`;
  }
}
