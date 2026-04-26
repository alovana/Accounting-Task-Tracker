type StatusBadgeProps = {
  label: string;
  tone?: "green" | "amber" | "slate";
};

const toneClassMap = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
};

export function StatusBadge({ label, tone = "slate" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${toneClassMap[tone]}`}>
      {label}
    </span>
  );
}
