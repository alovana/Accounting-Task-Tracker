export type NotificationEventType = "completed" | "blocked" | "overdue";
export type NotificationChannel = "line_oa" | "email" | "internal";

export type NotificationRule = {
  id: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  enabled: boolean;
  recipients: string[];
  template: string;
};

export type NotificationLog = {
  id: string;
  eventType: NotificationEventType;
  targetType: "work_item" | "work_cycle";
  targetName: string;
  status: "queued" | "processing" | "sent" | "failed";
  sentAt?: string;
  errorMessage?: string;
};
