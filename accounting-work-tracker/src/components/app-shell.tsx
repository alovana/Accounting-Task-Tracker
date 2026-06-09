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
  { label: "Dashboard", href: "/dashboard", permission: "view_dashboard" },
  { label: "My Tasks", href: "/work-cycles", permission: "manage_work_cycles" },
  { label: "Checklist", href: "/checklists", permission: "manage_checklists" },
  { label: "ลูกค้า", href: "/customers", permission: "manage_customers" },
  { label: "ตั้งค่า", href: "/settings" },
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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white xl:block">
          <div className="flex h-full flex-col px-5 py-5">
            <SidebarDigitalClock />
            <SidebarNav items={visibleNavItems} />

            <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current Session</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">{user?.fullName ?? "ยังไม่ได้เข้าสู่ระบบ"}</p>
              <p className="mt-1 text-sm text-slate-500">{user?.email ?? "-"}</p>
              <div className="mt-4 flex items-center gap-2">
                <RoleAccessBadge role={user?.role ?? "staff"} />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-950">{APP_NAME}</h1>
                <p className="text-xs font-medium text-slate-500">{user?.fullName ?? "Mobile work tracker"}</p>
              </div>
              <LogoutButton />
            </div>
          </header>

          <div className="flex-1 pb-20 xl:pb-0">{children}</div>

          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-16px_40px_-28px_rgba(15,23,42,0.4)] xl:hidden">
            <SidebarNav items={visibleNavItems} />
          </nav>
        </div>
      </div>
    </div>
  );
}
