import { SummaryCard } from "@/components/phase2/summary-card";

type KpiItem = {
  label: string;
  value: string;
  description: string;
};

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <SummaryCard
          key={item.label}
          label={item.label}
          value={item.value}
          description={item.description}
          tone={index === 0 ? "accent" : "default"}
        />
      ))}
    </section>
  );
}
