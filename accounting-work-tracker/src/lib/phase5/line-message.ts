import type { NotificationEventType } from "@/types/notifications";

type BuildLineMessageParams = {
  eventType: NotificationEventType;
  customerName: string;
  workItemTitle: string;
  assignedTo?: string;
  blockedReason?: string;
  dueDate?: string;
  attachmentCount?: number;
  workItemDetailUrl?: string;
};

const normalizeAssignedTo = (assignedTo?: string) => {
  const trimmed = assignedTo?.trim();
  return trimmed && trimmed !== "-" ? trimmed : "-";
};

function buildAttachmentSection(attachmentCount?: number, workItemDetailUrl?: string) {
  if (!attachmentCount || attachmentCount <= 0) {
    return "";
  }

  const countLine = `ไฟล์แนบ: ${attachmentCount} ไฟล์`;
  const linkLine = workItemDetailUrl ? `เปิดไฟล์แนบทั้งหมด: ${workItemDetailUrl}` : "";

  return `\n${countLine}${linkLine ? `\n${linkLine}` : ""}`;
}

export function buildLineNotificationMessage({
  eventType,
  customerName,
  workItemTitle,
  assignedTo,
  blockedReason,
  dueDate,
  attachmentCount,
  workItemDetailUrl,
}: BuildLineMessageParams) {
  const staffLine = `พนักงาน: ${normalizeAssignedTo(assignedTo)}`;
  const attachmentSection = buildAttachmentSection(attachmentCount, workItemDetailUrl);

  switch (eventType) {
    case "completed":
      return `แจ้งเตือนงานเสร็จ\nลูกค้า: ${customerName}\nงาน: ${workItemTitle}\n${staffLine}\nสถานะ: completed${attachmentSection}`;
    case "blocked":
      return `แจ้งเตือนงานติดปัญหา\nลูกค้า: ${customerName}\nงาน: ${workItemTitle}\n${staffLine}\nปัญหา: ${blockedReason ?? "-"}${attachmentSection}`;
    case "overdue":
      return `แจ้งเตือนงานเกินกำหนด\nลูกค้า: ${customerName}\nงาน: ${workItemTitle}\nกำหนดส่ง: ${dueDate ?? "-"}`;
    default:
      return `${customerName} - ${workItemTitle}`;
  }
}
