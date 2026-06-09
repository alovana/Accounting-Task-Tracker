import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

export default async function LoginPage() {
  const currentUser = await getCurrentSessionUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{APP_NAME}</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">เข้าสู่ระบบ</h1>
        </div>

        {currentUser ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            เข้าสู่ระบบอยู่แล้ว: {currentUser.fullName} ({currentUser.role})
          </div>
        ) : null}

        <LoginForm />
      </div>
    </main>
  );
}
