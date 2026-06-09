"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

type SidebarNavProps = {
  items: readonly NavItem[];
};

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const mobileItems = items.filter((item) => ["/dashboard", "/work-cycles", "/customers", "/settings"].includes(item.href));

  return (
    <>
      <nav className="mt-6 hidden space-y-2.5 xl:block">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950",
              ].join(" ")}
            >
              <span>{item.label}</span>
              <span className={isActive ? "h-2.5 w-2.5 rounded-full bg-white" : "h-2.5 w-2.5 rounded-full bg-slate-200"} />
            </Link>
          );
        })}
      </nav>

      <nav className="grid grid-cols-4 gap-1 xl:hidden">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-2xl px-2 py-2.5 text-center text-xs font-semibold transition",
                isActive ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
