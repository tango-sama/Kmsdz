import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPortalDict } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { getCurrentActor, homeFor } from "@/lib/auth/server";
import { isDbConfigured } from "@/lib/db";
import { ActionForm } from "@/components/portal/action-form";
import { AuthShell } from "@/components/auth-shell";
import { signupAction } from "../../(portal)/portal/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getPortalDict(locale).auth.signupTitle, robots: { index: false, follow: false } };
}

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const me = await getCurrentActor();
  if (me) redirect(homeFor(me, locale));
  const t = getPortalDict(locale);
  const a = t.auth;

  return (
    <AuthShell locale={locale} title={a.signupTitle} lead={a.signupLead}>
      {!isDbConfigured() ? (
        <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          <p className="font-extrabold">{t.login.notConfiguredTitle}</p>
          <p className="mt-1 text-sm">{t.login.notConfiguredText}</p>
        </div>
      ) : (
        <ActionForm action={signupAction} className="card space-y-5 p-6" submitLabel={a.signupSubmit} submitClassName="btn btn-primary btn-lg w-full">
          <div>
            <label htmlFor="fullName" className="label">{a.fullName}</label>
            <input id="fullName" name="fullName" autoComplete="name" required minLength={2} maxLength={80} className="field" />
          </div>
          <div>
            <label htmlFor="email" className="label">{a.email}</label>
            <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} dir="ltr" className="field text-start" />
          </div>
          <div>
            <label htmlFor="password" className="label">{a.password}</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} dir="ltr" className="field text-start" />
            <p className="mt-1.5 text-xs text-ink-400">{a.passwordHint}</p>
          </div>
          <div>
            <label htmlFor="confirm" className="label">{a.confirm}</label>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={128} dir="ltr" className="field text-start" />
          </div>
          {/* honeypot: invisible to people, bots fill it */}
          <div aria-hidden="true" style={{ position: "absolute", insetInlineStart: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
            <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>
        </ActionForm>
      )}
      <p className="mt-6 text-center text-sm text-ink-600">{a.haveAccount} <Link href={`/${locale}/login`} className="font-bold text-brand hover:underline">{a.signIn}</Link></p>
    </AuthShell>
  );
}
