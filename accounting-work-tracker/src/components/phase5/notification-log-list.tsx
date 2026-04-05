import type { NotificationLog } from "@/types/notifications";

type NotificationLogListProps = {
  logs: NotificationLog[];
};

export function NotificationLogList({ logs }: NotificationLogListProps) {
  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{log.eventType}</p>
              <p className="mt-1 text-sm text-slate-600">{log.targetName}</p>
            </div>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                log.status === "sent"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : log.status === "failed"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {log.status}
            </span>
          </div>
          {log.sentAt ? <p className="mt-2 text-xs text-slate-500">sent at: {log.sentAt}</p> : null}
          {log.errorMessage ? (
            <p className="mt-2 text-xs text-rose-600">error: {log.errorMessage}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
