type StatusBadgeProps = {
  label: string;
  tone?: "green" | "amber" | "slate";
};

const toneClassMap = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({ label, tone = "slate" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneClassMap[tone]}`}>
      {label}
    </span>
  );
}
