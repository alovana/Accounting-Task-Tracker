import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canAccess } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/constants";
import type { DemoUser } from "@/types/auth";

const SESSION_COOKIE_NAME = "att_session";

export async function getCurrentSessionUser(): Promise<DemoUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

export async function requireSessionUser() {
  const user = await getCurrentSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireSessionUser();

  if (!canAccess(user.role, permission)) {
    redirect(`/login?denied=${permission}`);
  }

  return user;
}

export function getSessionRole(user: DemoUser): AppRole {
  return user.role;
}
