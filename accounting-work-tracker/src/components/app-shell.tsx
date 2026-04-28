import { LogoutButton } from "@/components/auth/logout-button";
import { RoleAccessBadge } from "@/components/auth/role-access-badge";
import { SidebarDigitalClock } from "@/components/sidebar-digital-clock";
import { SidebarNav } from "@/components/sidebar-nav";
import { canAccess } from "@/lib/auth/permissions";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { label: "แดชบอร์ด", href: "/dashboard", permission: "view_dashboard" },
  { label: "ลูกค้า", href: "/customers", permission: "manage_customers" },
  { label: "เช็กลิสต์", href: "/checklists", permission: "manage_checklists" },
  { label: "งานรายเดือน", href: "/work-cycles", permission: "manage_work_cycles" },
  { label: "รายงาน", href: "/reports", permission: "view_reports" },
  { label: "Notifications", href: "/notifications", permission: "manage_notifications" },
  { label: "โปรไฟล์ / ตั้งค่า", href: "/settings" },
] as const;

export async function AppShell({ children }: AppShellProps) {
  const user = await getCurrentSessionUser();
  const visibleNavItems = navItems.filter((item) => {
    if (!user) {
      return false;
    }

    if (!("permission" in item) || !item.permission) {
      return true;
    }

    return canAccess(user.role, item.permission);
  });

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#f8fafc_42%,_#f1f5f9_100%)] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/92 xl:block">
          <div className="flex h-full flex-col px-5 py-5">
            <SidebarDigitalClock />

            <SidebarNav items={visibleNavItems} />

            <div className="mt-auto rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Current Session</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">{user?.fullName ?? "ไม่ได้เข้าสู่ระบบ"}</p>
              <p className="mt-1 text-sm text-slate-500">{user?.email ?? "-"}</p>
              <div className="mt-4 flex items-center gap-2">
                <RoleAccessBadge role={user?.role ?? "staff"} />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">{APP_NAME}</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">My Dashboard</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right sm:block">
                  <p className="text-sm font-semibold text-slate-800">{user?.email ?? "-"}</p>
                  <p className="text-xs text-slate-500">{user?.fullName ?? "ไม่ได้เข้าสู่ระบบ"}</p>
                </div>
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
