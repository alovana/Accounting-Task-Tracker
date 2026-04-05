type WorkCycleHealthItem = {
  label: string;
  value: number;
};

export function WorkCycleHealthList({ items }: { items: WorkCycleHealthItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium capitalize text-slate-700">{item.label}</p>
          <p className="text-lg font-semibold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
