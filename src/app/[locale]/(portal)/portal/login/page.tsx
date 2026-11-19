import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { getPortalDict } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getCurrentActor } from "@/lib/auth/server";
import { isDbConfigured } from "@/lib/db";
import { ActionForm } from "@/components/portal/action-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { loginAction } from "../actions";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await getCurrentActor()) redirect(`/${locale}/portal`);
  const t = getPortalDict(locale);
  const d = getDict(locale);
  const configured = isDbConfigured();
  const dev = process.env.NODE_ENV !== "production";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink text-white lg:block">
        <Image src="/images/hero.webp" alt="" fill sizes="50vw" className="object-cover opacity-40" priority />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Image src="/images/brand/logo-dark.png" alt="KMS" width={648} height={487} className="h-20 w-auto self-start" />
          <div>
            <ShieldCheck className="mb-4 h-10 w-10 text-brand" aria-hidden />
            <h2 className="text-4xl font-extrabold">{t.name}</h2>
            <p className="mt-3 max-w-md text-lg text-white/75">{t.login.lead}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <Image src="/images/brand/logo-light.png" alt="KMS" width={648} height={487} className="h-14 w-auto lg:hidden" />
            <span className="hidden lg:block" />
            <LanguageSwitcher locale={locale} label={d.nav.switchTo} ariaLabel={d.nav.switchAria} />
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold"><Lock className="h-7 w-7 text-brand" aria-hidden />{t.login.title}</h1>
          <p className="mt-2 text-ink-500 lg:hidden">{t.login.lead}</p>

          {!configured ? (
            <div role="alert" className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
              <p className="font-extrabold">{t.login.notConfiguredTitle}</p>
              <p className="mt-1 text-sm">{t.login.notConfiguredText}</p>
            </div>
          ) : (
            <ActionForm action={loginAction} className="card mt-8 space-y-5 p-6" submitLabel={t.login.submit} submitClassName="btn btn-primary btn-lg w-full">
              <div>
                <label htmlFor="username" className="label">{t.login.username}</label>
                <input id="username" name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required maxLength={64} dir="ltr" className="field text-start" />
              </div>
              <div>
                <label htmlFor="password" className="label">{t.login.password}</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} dir="ltr" className="field text-start" />
              </div>
            </ActionForm>
          )}
          {dev && configured && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">{t.login.devHint}</p>}
          <p className="mt-6 text-center text-sm text-ink-500">{t.login.help}</p>
          <p className="mt-2 text-center text-xs text-ink-400">{t.login.footer}</p>
          <p className="mt-6 text-center"><Link href={`/${locale}`} className="text-sm font-bold text-brand hover:underline">{t.login.back}</Link></p>
        </div>
      </div>
    </div>
  );
}
