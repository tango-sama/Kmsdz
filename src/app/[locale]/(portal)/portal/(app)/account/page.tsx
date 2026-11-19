import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getPortalDict, fmtDate } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { requireActor } from "@/lib/auth/server";
import { ActionForm } from "@/components/portal/action-form";
import { PageTitle } from "@/components/portal/bits";
import { changePasswordAction } from "../../actions";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const me = await requireActor(locale, { allowMustChange: true });
  const t = getPortalDict(locale);
  const a = t.account;
  return (
    <>
      <PageTitle title={a.title} />
      {me.mustChangePassword && (
        <p role="alert" className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 font-semibold text-amber-900 ring-1 ring-amber-300"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />{a.force}</p>
      )}
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-6 lg:col-span-2">
          <h2 className="mb-4 font-extrabold">{a.info}</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-ink-500">{t.users.fields.fullName}</dt><dd className="font-bold">{me.fullName}</dd></div>
            <div><dt className="text-ink-500">{t.users.fields.username}</dt><dd className="ltr-isolate font-bold">@{me.username}</dd></div>
            <div><dt className="text-ink-500">{t.users.fields.role}</dt><dd className="font-bold">{t.roles[me.role]}</dd></div>
          </dl>
        </section>
        <ActionForm action={changePasswordAction} className="card space-y-4 p-6 lg:col-span-3" submitLabel={a.change} successMessage={a.changed} resetOnSuccess>
          <div><label className="label" htmlFor="current">{a.current}</label><input id="current" name="current" type="password" autoComplete="current-password" required dir="ltr" className="field text-start" /></div>
          <div><label className="label" htmlFor="next">{a.next}</label><input id="next" name="next" type="password" autoComplete="new-password" required minLength={8} maxLength={128} dir="ltr" className="field text-start" /></div>
          <div><label className="label" htmlFor="confirm">{a.confirm}</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required dir="ltr" className="field text-start" /></div>
          <p className="text-xs text-ink-500">{a.rules} {a.otherDevices}</p>
        </ActionForm>
      </div>
    </>
  );
}
