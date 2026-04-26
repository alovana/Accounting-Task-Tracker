type SummaryCardProps = {
  label: string;
  value: string;
  description?: string;
  tone?: "default" | "accent";
};

const toneClassMap = {
  default: "border-slate-200 bg-white",
  accent: "border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white",
};

export function SummaryCard({ label, value, description, tone = "default" }: SummaryCardProps) {
  const isAccent = tone === "accent";

  return (
    <div className={`rounded-[28px] border p-5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.28)] ${toneClassMap[tone]}`}>
      <p className={`text-sm ${isAccent ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${isAccent ? "text-white" : "text-slate-950"}`}>{value}</p>
      {description ? <p className={`mt-3 text-xs ${isAccent ? "text-slate-400" : "text-slate-500"}`}>{description}</p> : null}
    </div>
  );
}
