import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { getDict } from "@/i18n";
import { getPortalDict } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { getCurrentActor } from "@/lib/auth/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PortalNav, type NavItem } from "@/components/portal/portal-nav";
import { logoutAction } from "../actions";

export default async function AppLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await getCurrentActor();
  if (!actor) redirect(`/${locale}/portal/login`);
  const t = getPortalDict(locale);
  const d = getDict(locale);
  const base = `/${locale}/portal`;

  const items: NavItem[] = actor.mustChangePassword
    ? []
    : [
        { key: "dashboard", href: base, label: t.nav.dashboard },
        { key: "jobs", href: `${base}/jobs`, label: t.nav.jobs },
        { key: "files", href: `${base}/files`, label: t.nav.files },
        { key: "news", href: `${base}/news`, label: t.nav.news },
        ...(actor.role === "admin" ? [{ key: "users" as const, href: `${base}/users`, label: t.nav.users }] : []),
      ];

  const logout = (
    <form action={logoutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white">
        <LogOut className="h-4 w-4" aria-hidden />
        {t.nav.logout}
      </button>
    </form>
  );

  return (
    <>
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-72 flex-col bg-ink p-5 text-white lg:flex">
        <Link href={base} className="mb-8 flex items-center gap-3">
          <Image src="/images/brand/logo-dark.png" alt="KMS" width={648} height={487} className="h-12 w-auto" />
          <span className="leading-tight"><span className="block text-sm font-extrabold">{t.name}</span><span className="block text-xs text-white/60">KMS</span></span>
        </Link>
        <PortalNav items={items} locale={locale} variant="side" label={t.nav.menu} />
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <Link href={`${base}/account`} className="block rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10">
            <span className="block truncate text-sm font-extrabold">{actor.fullName}</span>
            <span className="block text-xs text-white/60">{t.roles[actor.role]} · <span className="ltr-isolate">@{actor.username}</span></span>
          </Link>
          <Link href={`/${locale}`} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white"><ExternalLink className="h-4 w-4" aria-hidden />{t.nav.site}</Link>
          {logout}
          <div className="px-2 pt-2"><LanguageSwitcher locale={locale} label={d.nav.switchTo} ariaLabel={d.nav.switchAria} className="!bg-white/10 !text-white !border-white/20" /></div>
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-ink px-4 py-2.5 text-white lg:hidden">
        <Link href={base} className="flex items-center gap-2.5">
          <Image src="/images/brand/logo-dark.png" alt="KMS" width={648} height={487} className="h-9 w-auto" />
          <span className="text-sm font-extrabold">{t.name}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`${base}/account`} className="max-w-[7rem] truncate rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">{actor.fullName}</Link>
          <form action={logoutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" aria-label={t.nav.logout} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"><LogOut className="h-4 w-4" aria-hidden /></button>
          </form>
        </div>
      </header>

      <div className="lg:ps-72">
        <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-8 lg:pb-12 lg:pt-10">{children}</main>
      </div>
      {items.length > 0 && <PortalNav items={items} locale={locale} variant="bottom" label={t.nav.menu} />}
    </>
  );
}
