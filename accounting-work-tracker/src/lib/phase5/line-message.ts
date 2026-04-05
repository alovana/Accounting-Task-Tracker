import type { NotificationEventType } from "@/types/notifications";

type BuildLineMessageParams = {
  eventType: NotificationEventType;
  customerName: string;
  workItemTitle: string;
  blockedReason?: string;
  dueDate?: string;
};

export function buildLineNotificationMessage({
  eventType,
  customerName,
  workItemTitle,
  blockedReason,
  dueDate,
}: BuildLineMessageParams) {
  switch (eventType) {
    case "completed":
      return `แจ้งเตือนงานเสร็จ\nลูกค้า: ${customerName}\nงาน: ${workItemTitle}\nสถานะ: completed`;
    case "blocked":
      return `แจ้งเตือนงานติดปัญหา\nลูกค้า: ${customerName}\nงาน: ${workItemTitle}\nปัญหา: ${blockedReason ?? "-"}`;
    case "overdue":
      return `แจ้งเตือนงานเกินกำหนด\nลูกค้า: ${customerName}\nงาน: ${workItemTitle}\nกำหนดส่ง: ${dueDate ?? "-"}`;
    default:
      return `${customerName} - ${workItemTitle}`;
  }
}
