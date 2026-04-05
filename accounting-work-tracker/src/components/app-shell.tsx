import Link from "next/link";
import { RoleAccessBadge } from "@/components/auth/role-access-badge";

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

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-slate-200 bg-white lg:block">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-sm font-medium text-blue-600">Accounting Work Tracker</p>
            <h1 className="mt-1 text-lg font-semibold">ระบบติดตามงานบัญชี</h1>
          </div>
          <nav className="space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm text-slate-500">พร้อมใช้งาน MVP และเตรียม deploy</p>
                <h2 className="text-lg font-semibold">ศูนย์ติดตามงานบัญชี</h2>
              </div>
              <RoleAccessBadge role="admin" />
            </div>
          </header>

          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
