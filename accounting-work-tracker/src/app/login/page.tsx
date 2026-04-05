import { LoginForm } from "@/components/auth/login-form";
import { RoleAccessBadge } from "@/components/auth/role-access-badge";
import { APP_NAME_TH } from "@/lib/constants";
import { rolePermissions } from "@/lib/auth/permissions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-center rounded-3xl bg-slate-900 p-8 text-white shadow-xl lg:p-10">
          <p className="text-sm font-medium text-blue-300">Phase 6 Hardening & Deployment Prep</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight lg:text-4xl">
            {APP_NAME_TH}
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-300 lg:text-base">
            ระบบกลางสำหรับติดตามสถานะงานบัญชีของลูกค้าแบบรายเดือน พร้อม role-based
            access, deployment readiness, และโครงสร้างที่พร้อมต่อยอด production
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <div key={role} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <RoleAccessBadge role={role as keyof typeof rolePermissions} />
                <p className="mt-3 text-sm text-slate-200">permissions: {permissions.length}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center">
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
