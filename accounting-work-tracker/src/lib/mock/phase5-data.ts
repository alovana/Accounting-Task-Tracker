import type { NotificationLog, NotificationRule } from "@/types/notifications";

export const notificationRules: NotificationRule[] = [
  {
    id: "rule-1",
    eventType: "completed",
    channel: "line_oa",
    enabled: true,
    recipients: ["manager-group"],
    template: "งาน {{work_item}} ของ {{customer}} เสร็จเรียบร้อยแล้ว",
  },
  {
    id: "rule-2",
    eventType: "blocked",
    channel: "line_oa",
    enabled: true,
    recipients: ["team-lead", "manager-group"],
    template: "งาน {{work_item}} ของ {{customer}} ติดปัญหา: {{blocked_reason}}",
  },
  {
    id: "rule-3",
    eventType: "overdue",
    channel: "line_oa",
    enabled: false,
    recipients: ["manager-group"],
    template: "งาน {{work_item}} ของ {{customer}} เกินกำหนดแล้ว",
  },
];

export const notificationLogs: NotificationLog[] = [
  {
    id: "log-1",
    eventType: "blocked",
    targetType: "work_item",
    targetName: "ตรวจสอบสต็อกคงเหลือ - บริษัท บี เทรดดิ้ง จำกัด",
    status: "sent",
    sentAt: "2026-04-05 09:30",
  },
  {
    id: "log-2",
    eventType: "completed",
    targetType: "work_item",
    targetName: "ตรวจสอบรายรับและค่าใช้จ่าย - บริษัท เอ บิสซิเนส จำกัด",
    status: "queued",
  },
  {
    id: "log-3",
    eventType: "overdue",
    targetType: "work_item",
    targetName: "กระทบยอดธนาคาร - บริษัท เอ บิสซิเนส จำกัด",
    status: "failed",
    errorMessage: "LINE OA token not configured",
  },
];
