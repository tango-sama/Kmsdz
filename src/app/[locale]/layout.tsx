import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "@fontsource-variable/cairo/wght.css";
import "@fontsource-variable/inter/wght.css";
import "../globals.css";
import { company, siteUrl } from "@/config/company";
import { getDict } from "@/i18n";
import { isLocale, localeMeta, locales } from "@/i18n/config";
import { I18nProvider } from "@/components/i18n-provider";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#111820", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  return {
    metadataBase: new URL(siteUrl),
    applicationName: company.legalName,
    title: { default: d.seo.homeTitle, template: `%s` },
    description: d.site.description,
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const meta = localeMeta[locale];

  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <body>
        <I18nProvider
          locale={locale}
          dict={{
            common: d.common,
            nav: d.nav,
            quote: d.quote,
            validation: d.validation,
            apiErrors: d.apiErrors,
            contact: d.contact,
            confirmation: d.confirmation,
            notFound: d.notFound,
          }}
        >
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
