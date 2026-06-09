import { NextResponse } from "next/server";
import { findDemoUserByCredentials } from "@/lib/auth/demo-users";
import { demoSession, sessionCookieNames } from "@/lib/auth/session";

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Demo login is disabled" }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim() ?? "";
  const password = body.password?.trim() ?? "";
  const demoUser = findDemoUserByCredentials(email, password);

  if (!demoUser) {
    return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieNames.accessToken, `${demoSession.accessPrefix}${demoUser.email}`, sessionCookieOptions);
  response.cookies.set(sessionCookieNames.refreshToken, "demo", sessionCookieOptions);
  return response;
}
