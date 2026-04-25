import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { APP_NAME, APP_NAME_TH } from "@/lib/constants";

export default async function LoginPage() {
  const currentUser = await getCurrentSessionUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_45%,_#e8eefc_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center">
          <p className="text-lg font-semibold tracking-[0.18em] text-slate-700 uppercase">{APP_NAME}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">{APP_NAME_TH}</h1>
        </div>

        {currentUser ? (
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/95 p-4 text-sm text-emerald-800 shadow-[0_18px_40px_-30px_rgba(22,163,74,0.55)] backdrop-blur">
            เข้าสู่ระบบอยู่แล้วเป็น {currentUser.fullName} ({currentUser.role})
          </div>
        ) : null}

        <LoginForm />
      </div>
    </main>
  );
}
