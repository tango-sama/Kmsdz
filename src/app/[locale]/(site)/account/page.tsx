import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogOut, Mail, ShieldAlert } from "lucide-react";
import { getPortalDict } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { requireCustomer } from "@/lib/auth/server";
import { ActionForm } from "@/components/portal/action-form";
import { AuthShell } from "@/components/auth-shell";
import { changePasswordAction, logoutAction } from "../../(portal)/portal/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getPortalDict(locale).auth.accountTitle, robots: { index: false, follow: false } };
}

/** Customer area. Customers who signed up on the website live here; staff never do (they are sent to /portal). */
export default async function CustomerAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const me = await requireCustomer(locale);
  const t = getPortalDict(locale);
  const a = t.auth;

  return (
    <AuthShell locale={locale} title={`${a.welcome} ${me.fullName}`} lead={a.accountLead} wide>
      {me.mustChangePassword && (
        <p role="alert" className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 font-semibold text-amber-900 ring-1 ring-amber-300"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />{t.account.force}</p>
      )}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6">
            <h2 className="mb-4 font-extrabold">{a.profile}</h2>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-ink-500">{a.fullName}</dt><dd className="font-bold">{me.fullName}</dd></div>
              <div><dt className="text-ink-500">{a.email}</dt><dd className="ltr-isolate break-all font-bold">{me.username}</dd></div>
            </dl>
            <form action={logoutAction} className="mt-5">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="from" value="site" />
              <button type="submit" className="btn btn-outline !py-2 !text-sm"><LogOut className="h-4 w-4" aria-hidden />{a.logout}</button>
            </form>
          </section>
          <section className="card p-6">
            <h2 className="font-extrabold">{a.requestQuote}</h2>
            <p className="mt-1 text-sm text-ink-500">{a.requestQuoteText}</p>
            <Link href={`/${locale}/quote`} className="btn btn-primary mt-4">{a.requestQuote}</Link>
            <h2 className="mt-6 flex items-center gap-2 font-extrabold"><Mail className="h-4 w-4 text-brand" aria-hidden />{a.contactUs}</h2>
            <p className="mt-1 text-sm text-ink-500">{a.contactUsText}</p>
            <Link href={`/${locale}/contact`} className="btn btn-outline mt-4">{a.contactUs}</Link>
          </section>
        </div>
        <ActionForm action={changePasswordAction} className="card h-fit space-y-4 p-6 lg:col-span-3" submitLabel={t.account.change} successMessage={t.account.changed} resetOnSuccess>
          <h2 className="font-extrabold">{t.account.change}</h2>
          <div><label className="label" htmlFor="current">{t.account.current}</label><input id="current" name="current" type="password" autoComplete="current-password" required dir="ltr" className="field text-start" /></div>
          <div><label className="label" htmlFor="next">{t.account.next}</label><input id="next" name="next" type="password" autoComplete="new-password" required minLength={8} maxLength={128} dir="ltr" className="field text-start" /></div>
          <div><label className="label" htmlFor="confirm">{t.account.confirm}</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required dir="ltr" className="field text-start" /></div>
          <p className="text-xs text-ink-500">{t.account.rules} {t.account.otherDevices}</p>
        </ActionForm>
      </div>
    </AuthShell>
  );
}
