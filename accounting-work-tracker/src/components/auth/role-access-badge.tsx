import type { AppRole } from "@/lib/constants";

type RoleAccessBadgeProps = {
  role: AppRole;
};

const labelMap: Record<AppRole, string> = {
  admin: "admin access",
  manager: "manager access",
  staff: "staff access",
};

export function RoleAccessBadge({ role }: RoleAccessBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
      {labelMap[role]}
    </span>
  );
}
