type NotificationPreviewItem = {
  rule: {
    id: string;
    eventType: string;
    channel: string;
  };
  log?: {
    targetName: string;
    status: string;
  };
  previewMessage: string;
};

export function NotificationPreviewList({ items }: { items: NotificationPreviewItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.rule.id} className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{item.rule.eventType}</p>
              <p className="mt-1 text-sm text-slate-600">channel: {item.rule.channel}</p>
              {item.log ? (
                <p className="mt-1 text-sm text-slate-600">target: {item.log.targetName}</p>
              ) : null}
            </div>
            {item.log ? (
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                {item.log.status}
              </span>
            ) : null}
          </div>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-xs text-slate-700 whitespace-pre-wrap">
            {item.previewMessage}
          </pre>
        </div>
      ))}
    </div>
  );
}
