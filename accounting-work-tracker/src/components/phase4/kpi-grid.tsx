type KpiItem = {
  label: string;
  value: string;
  description: string;
};

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          <p className="mt-2 text-xs text-slate-500">{item.description}</p>
        </div>
      ))}
    </section>
  );
}
