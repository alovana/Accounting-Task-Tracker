import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canAccess } from "@/lib/auth/permissions";
import { demoUsers, findDemoUserByEmail } from "@/lib/auth/demo-users";
import type { AppRole } from "@/lib/constants";
import { getSupabaseAuthClient, getSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types/auth";

const ACCESS_TOKEN_COOKIE_NAME = "att-access-token";
const REFRESH_TOKEN_COOKIE_NAME = "att-refresh-token";
const DEMO_ACCESS_PREFIX = "demo:";

async function readSessionTokens() {
  const cookieStore = await cookies();

  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value,
  };
}

function getDemoSessionUser(accessToken: string) {
  if (process.env.NODE_ENV === "production" || !accessToken.startsWith(DEMO_ACCESS_PREFIX)) {
    return null;
  }

  const email = accessToken.slice(DEMO_ACCESS_PREFIX.length);
  const demoUser = findDemoUserByEmail(email);

  if (!demoUser) {
    return null;
  }

  return {
    id: demoUser.id,
    email: demoUser.email,
    fullName: demoUser.fullName,
    role: demoUser.role,
  } satisfies SessionUser;
}

async function getSessionUserFromAccessToken(accessToken: string) {
  const demoUser = getDemoSessionUser(accessToken);

  if (demoUser) {
    return demoUser;
  }

  const authClient = getSupabaseAuthClient();
  const { data, error } = await authClient.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("full_name, role, active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.active) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: profile.full_name,
    role: profile.role as AppRole,
  } satisfies SessionUser;
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const { accessToken, refreshToken } = await readSessionTokens();

  if (!accessToken && !refreshToken) {
    if (process.env.NODE_ENV !== "production") {
      const adminUser = demoUsers.find((user) => user.role === "admin") ?? demoUsers[0];

      return {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.fullName,
        role: adminUser.role,
      } satisfies SessionUser;
    }

    return null;
  }

  if (accessToken) {
    const user = await getSessionUserFromAccessToken(accessToken);
    if (user) {
      return user;
    }
  }

  if (!refreshToken || refreshToken === "demo") {
    return null;
  }

  const authClient = getSupabaseAuthClient();
  const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session?.access_token) {
    return null;
  }

  return getSessionUserFromAccessToken(data.session.access_token);
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

export function getSessionRole(user: SessionUser): AppRole {
  return user.role;
}

export const sessionCookieNames = {
  accessToken: ACCESS_TOKEN_COOKIE_NAME,
  refreshToken: REFRESH_TOKEN_COOKIE_NAME,
};

export const demoSession = {
  accessPrefix: DEMO_ACCESS_PREFIX,
};
