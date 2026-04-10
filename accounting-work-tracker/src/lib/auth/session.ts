import { redirect } from "next/navigation";
import { canAccess } from "@/lib/auth/permissions";
import { ROLE_OPTIONS, type AppRole } from "@/lib/constants";

export function resolveRoleFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>,
): AppRole {
  const roleValue = searchParams?.role;
  const role = Array.isArray(roleValue) ? roleValue[0] : roleValue;

  if (role && ROLE_OPTIONS.includes(role as AppRole)) {
    return role as AppRole;
  }

  return "admin";
}

export function requirePermission(role: AppRole, permission: string) {
  if (!canAccess(role, permission)) {
    redirect(`/login?role=${role}&denied=${permission}`);
  }
}
