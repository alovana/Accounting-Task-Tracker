import { customers } from "@/lib/mock/phase2-data";
import { workItems } from "@/lib/mock/phase3-data";
import { notificationLogs, notificationRules } from "@/lib/mock/phase5-data";
import { buildLineNotificationMessage } from "@/lib/phase5/line-message";
import type { NotificationLog, NotificationRule } from "@/types/notifications";

function getCustomerNameFromWorkItemTitle(targetName: string) {
  const matchedCustomer = customers.find((customer) => targetName.includes(customer.name));
  return matchedCustomer?.name ?? "-";
}

export function previewNotificationDispatch() {
  return notificationRules
    .filter((rule) => rule.enabled)
    .map((rule) => {
      const matchingLog = notificationLogs.find((log) => log.eventType === rule.eventType);
      const matchingWorkItem = workItems.find((item) => matchingLog?.targetName.includes(item.title));

      return {
        rule,
        log: matchingLog,
        previewMessage: buildLineNotificationMessage({
          eventType: rule.eventType,
          customerName: matchingLog ? getCustomerNameFromWorkItemTitle(matchingLog.targetName) : "-",
          workItemTitle: matchingWorkItem?.title ?? "-",
          assignedTo: matchingWorkItem?.assignedTo,
          blockedReason: matchingWorkItem?.blockedReason,
          dueDate: matchingWorkItem?.dueDate,
        }),
      };
    });
}

export function getLatestNotificationIssues(logs: NotificationLog[]) {
  return logs.filter((item) => item.status === "failed");
}

export function getRulesByEventType(rules: NotificationRule[]) {
  return new Map(rules.map((rule) => [rule.eventType, rule]));
}
