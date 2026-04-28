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

  return (
    <nav className="mt-6 space-y-2.5">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "group flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition duration-200",
              isActive
                ? "border-slate-900/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.65)]"
                : "border-slate-200/80 bg-white text-slate-600 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.35)] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950",
            ].join(" ")}
          >
            <span>{item.label}</span>
            <span
              className={[
                "h-2.5 w-2.5 rounded-full transition",
                isActive ? "bg-white/90 shadow-[0_0_0_4px_rgba(255,255,255,0.12)]" : "bg-slate-200 group-hover:bg-slate-400",
              ].join(" ")}
            />
          </Link>
        );
      })}
    </nav>
  );
}
