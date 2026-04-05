type ReadinessChecklistProps = {
  items: string[];
};

export function ReadinessChecklist({ items }: ReadinessChecklistProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
            ✓
          </span>
          <p>{item}</p>
        </div>
      ))}
    </div>
  );
}
