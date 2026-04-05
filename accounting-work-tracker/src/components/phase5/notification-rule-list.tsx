import type { NotificationRule } from "@/types/notifications";

type NotificationRuleListProps = {
  rules: NotificationRule[];
};

export function NotificationRuleList({ rules }: NotificationRuleListProps) {
  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div key={rule.id} className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{rule.eventType}</p>
              <p className="mt-1 text-sm text-slate-600">channel: {rule.channel}</p>
              <p className="mt-1 text-sm text-slate-600">recipients: {rule.recipients.join(", ")}</p>
            </div>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                rule.enabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-600"
              }`}
            >
              {rule.enabled ? "enabled" : "disabled"}
            </span>
          </div>
          <p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700">{rule.template}</p>
        </div>
      ))}
    </div>
  );
}
