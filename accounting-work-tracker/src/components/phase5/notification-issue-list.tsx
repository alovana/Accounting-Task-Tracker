import type { NotificationLog } from "@/types/notifications";

export function NotificationIssueList({ logs }: { logs: NotificationLog[] }) {
  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="rounded-xl bg-rose-50 p-4">
          <p className="font-medium text-slate-900">{log.targetName}</p>
          <p className="mt-1 text-sm text-slate-700">event: {log.eventType}</p>
          <p className="mt-2 text-sm text-rose-700">{log.errorMessage ?? "unknown error"}</p>
        </div>
      ))}
    </div>
  );
}
