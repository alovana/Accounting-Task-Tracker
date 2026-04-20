import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { RoleAccessBadge } from "@/components/auth/role-access-badge";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { label: "แดชบอร์ด", href: "/dashboard" },
  { label: "ลูกค้า", href: "/customers" },
  { label: "เช็กลิสต์", href: "/checklists" },
  { label: "งานรายเดือน", href: "/work-cycles" },
  { label: "รายงาน", href: "/reports" },
  { label: "ตั้งค่า", href: "/settings" },
];

export async function AppShell({ children }: AppShellProps) {
  const user = await getCurrentSessionUser();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.18),_transparent_32%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_42%,_#e0f2fe_100%)] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 shrink-0 border-r border-white/60 bg-slate-950/95 text-white shadow-[18px_0_40px_-28px_rgba(15,23,42,0.85)] backdrop-blur">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="inline-flex rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Task Management</div>
            <h1 className="mt-4 text-xl font-semibold leading-tight">{APP_NAME}</h1>
            <p className="mt-2 text-sm text-slate-300">Track accounting workflows, deadlines, and team progress in one place.</p>
          </div>
          <nav className="space-y-2 px-4 py-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex w-full items-center rounded-2xl border border-transparent bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-100 transition hover:border-sky-300/20 hover:bg-sky-400/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="border-b border-sky-100/80 bg-white/75 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-700">Web App</p>
                <h2 className="text-lg font-semibold text-slate-950">{APP_NAME}</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 px-4 py-3 text-right shadow-[0_18px_35px_-28px_rgba(30,64,175,0.45)]">
                  <p className="text-sm font-semibold text-slate-800">{user?.email ?? "-"}</p>
                  <p className="text-xs text-slate-500">{user?.fullName ?? "ไม่ได้เข้าสู่ระบบ"}</p>
                </div>
                <RoleAccessBadge role={user?.role ?? "staff"} />
                <LogoutButton />
              </div>
            </div>
          </header>

          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
