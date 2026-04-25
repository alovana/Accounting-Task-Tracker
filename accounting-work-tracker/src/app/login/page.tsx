import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { APP_NAME_TH } from "@/lib/constants";

export default async function LoginPage() {
  const currentUser = await getCurrentSessionUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">{APP_NAME_TH}</h1>
        </div>

        {currentUser ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            เข้าสู่ระบบอยู่แล้วเป็น {currentUser.fullName} ({currentUser.role})
          </div>
        ) : null}

        <LoginForm />
      </div>
    </main>
  );
}
