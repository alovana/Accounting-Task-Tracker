"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findDemoUserByCredentials } from "@/lib/auth/demo-users";
import { demoSession, sessionCookieNames } from "@/lib/auth/session";
import { getSupabaseAuthClient, getSupabaseServerClient } from "@/lib/supabase/server";

export type LoginActionState = {
  error?: string;
};

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

async function signInWithDemoUser(email: string, password: string) {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const demoUser = findDemoUserByCredentials(email, password);

  if (!demoUser) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieNames.accessToken, `${demoSession.accessPrefix}${demoUser.email}`, sessionCookieOptions);
  cookieStore.set(sessionCookieNames.refreshToken, "demo", sessionCookieOptions);
  return true;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  try {
    const authClient = getSupabaseAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      if (await signInWithDemoUser(email, password)) {
        redirect("/dashboard");
      }

      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    const supabase = getSupabaseServerClient();
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, active")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.active) {
      await authClient.auth.signOut();
      return { error: "บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าใช้งานระบบ" };
    }

    const cookieStore = await cookies();
    cookieStore.set(sessionCookieNames.accessToken, data.session.access_token, sessionCookieOptions);
    cookieStore.set(sessionCookieNames.refreshToken, data.session.refresh_token, sessionCookieOptions);
  } catch (error) {
    console.error("Failed to sign in with Supabase Auth", error);
    if (await signInWithDemoUser(email, password)) {
      redirect("/dashboard");
    }

    return { error: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้" };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(sessionCookieNames.accessToken)?.value;
  const refreshToken = cookieStore.get(sessionCookieNames.refreshToken)?.value;

  if (accessToken && refreshToken && refreshToken !== "demo") {
    try {
      const authClient = getSupabaseAuthClient();
      await authClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      await authClient.auth.signOut();
    } catch (error) {
      console.error("Failed to sign out from Supabase Auth", error);
    }
  }

  cookieStore.delete(sessionCookieNames.accessToken);
  cookieStore.delete(sessionCookieNames.refreshToken);
  redirect("/login");
}
