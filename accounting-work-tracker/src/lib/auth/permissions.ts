import type { AppRole } from "@/lib/constants";

export const rolePermissions: Record<AppRole, string[]> = {
  admin: [
    "view_dashboard",
    "manage_customers",
    "manage_checklists",
    "manage_settings",
  ],
  manager: [
    "view_dashboard",
    "manage_customers",
    "manage_checklists",
    "manage_work_cycles",
    "view_reports",
    "manage_notifications",
  ],
  staff: [
    "view_dashboard",
    "manage_work_cycles",
  ],
};

export function canAccess(role: AppRole, permission: string) {
  return rolePermissions[role].includes(permission);
}
