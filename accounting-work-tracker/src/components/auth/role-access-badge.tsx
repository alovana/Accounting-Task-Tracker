import type { AppRole } from "@/lib/constants";

type RoleAccessBadgeProps = {
  role: AppRole;
};

const labelMap: Record<AppRole, string> = {
  admin: "admin access",
  manager: "manager access",
  staff: "staff access",
};

const toneClassMap: Record<AppRole, string> = {
  admin: "border-violet-200 bg-violet-50 text-violet-700",
  manager: "border-sky-200 bg-sky-50 text-sky-700",
  staff: "border-slate-200 bg-slate-100 text-slate-700",
};

export function RoleAccessBadge({ role }: RoleAccessBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneClassMap[role]}`}>
      {labelMap[role]}
    </span>
  );
}
