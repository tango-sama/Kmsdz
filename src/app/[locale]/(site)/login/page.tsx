import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPortalDict } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { getCurrentActor, homeFor } from "@/lib/auth/server";
import { isDbConfigured } from "@/lib/db";
import { ActionForm } from "@/components/portal/action-form";
import { AuthShell } from "@/components/auth-shell";
import { loginAction } from "../../(portal)/portal/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getPortalDict(locale).auth.loginTitle, robots: { index: false, follow: false } };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const me = await getCurrentActor();
  if (me) redirect(homeFor(me, locale)); // already signed in: staff -> portal, customer -> account
  const a = getPortalDict(locale).auth;
  const t = getPortalDict(locale);

  return (
    <AuthShell locale={locale} title={a.loginTitle} lead={a.loginLead}>
      {!isDbConfigured() ? (
        <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          <p className="font-extrabold">{t.login.notConfiguredTitle}</p>
          <p className="mt-1 text-sm">{t.login.notConfiguredText}</p>
        </div>
      ) : (
        <ActionForm action={loginAction} className="card space-y-5 p-6" submitLabel={a.loginSubmit} submitClassName="btn btn-primary btn-lg w-full">
          <div>
            <label htmlFor="username" className="label">{a.identifier}</label>
            <input id="username" name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required maxLength={254} dir="ltr" className="field text-start" />
          </div>
          <div>
            <label htmlFor="password" className="label">{a.password}</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} dir="ltr" className="field text-start" />
          </div>
        </ActionForm>
      )}
      <p className="mt-6 text-center text-sm text-ink-600">{a.noAccount} <Link href={`/${locale}/signup`} className="font-bold text-brand hover:underline">{a.createOne}</Link></p>
      <p className="mt-2 text-center text-xs text-ink-400">{a.staffNote}</p>
    </AuthShell>
  );
}
