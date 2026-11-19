"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FolderOpen, LayoutDashboard, Newspaper, Users } from "lucide-react";

const icons = { dashboard: LayoutDashboard, jobs: Briefcase, files: FolderOpen, news: Newspaper, users: Users };
export type NavItem = { key: keyof typeof icons; href: string; label: string };

export function PortalNav({ items, locale, variant, label }: { items: NavItem[]; locale: string; variant: "side" | "bottom"; label: string }) {
  const pathname = usePathname() || "";
  const active = (href: string) => (href === `/${locale}/portal` ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  if (variant === "side") {
    return (
      <nav aria-label={label} className="space-y-1">
        {items.map((it) => {
          const Icon = icons[it.key];
          return (
            <Link key={it.key} href={it.href} aria-current={active(it.href) ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition ${active(it.href) ? "bg-brand text-white shadow-glow" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
              <Icon className="h-5 w-5" aria-hidden />
              {it.label}
            </Link>
          );
        })}
      </nav>
    );
  }
  return (
    <nav aria-label={label} className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="flex">
        {items.map((it) => {
          const Icon = icons[it.key];
          return (
            <li key={it.key} className="flex-1">
              <Link href={it.href} aria-current={active(it.href) ? "page" : undefined} className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-bold ${active(it.href) ? "text-brand" : "text-white/70"}`}>
                <Icon className="h-5 w-5" aria-hidden />
                <span className="max-w-full truncate">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
