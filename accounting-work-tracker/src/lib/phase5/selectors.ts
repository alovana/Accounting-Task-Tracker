import type { NotificationLog, NotificationRule } from "@/types/notifications";

export function getNotificationStats(logs: NotificationLog[]) {
  return [
    {
      label: "queued",
      value: logs.filter((item) => item.status === "queued").length.toString(),
    },
    {
      label: "sent",
      value: logs.filter((item) => item.status === "sent").length.toString(),
    },
    {
      label: "failed",
      value: logs.filter((item) => item.status === "failed").length.toString(),
    },
  ];
}

export function getEnabledRuleCount(rules: NotificationRule[]) {
  return rules.filter((item) => item.enabled).length;
}
