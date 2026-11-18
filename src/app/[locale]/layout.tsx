import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "@fontsource-variable/cairo/wght.css";
import "@fontsource-variable/inter/wght.css";
import "../globals.css";
import { company, siteUrl, whatsappLink } from "@/config/company";
import { services } from "@/config/services";
import { getDict } from "@/i18n";
import { isLocale, localeMeta, locales } from "@/i18n/config";
import { FloatingActions } from "@/components/floating-actions";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { I18nProvider } from "@/components/i18n-provider";
import { JsonLd } from "@/components/json-ld";

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

function localBusinessJsonLd(locale: "ar" | "fr") {
  const d = getDict(locale);
  return {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    "@id": `${siteUrl}/#business`,
    name: company.legalName,
    alternateName: [company.brand, company.nameAr],
    description: d.site.description,
    url: siteUrl,
    logo: `${siteUrl}/images/brand/logo-light.png`,
    image: `${siteUrl}/og.jpg`,
    telephone: company.phones.map((p) => p.tel),
    email: company.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: company.city.fr,
      addressCountry: company.countryCode,
      ...(company.streetAddress ? { streetAddress: company.streetAddress } : {}),
    },
    areaServed: { "@type": "Country", name: "Algeria" },
    availableLanguage: ["ar", "fr"],
    knowsAbout: services.map((s) => s.fr.title),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: locale === "ar" ? "خدماتنا" : "Nos services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s[locale].title, url: `${siteUrl}/${locale}/services/${s.slug}` },
      })),
    },
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
          <a href="#main" className="sr-only z-[100] rounded-lg bg-brand px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:start-3 focus:top-3">
            {d.nav.skip}
          </a>
          <Header locale={locale} />
          <main id="main">{children}</main>
          <Footer locale={locale} />
          <FloatingActions
            whatsappHref={whatsappLink(d.contact.waMessage)}
            phoneHref={`tel:${company.phones[0].tel}`}
            labels={{ whatsapp: d.common.whatsappAria, call: `${d.common.callUs} ${company.phones[0].display}`, top: d.common.backToTop }}
          />
        </I18nProvider>
        <JsonLd data={localBusinessJsonLd(locale)} />
      </body>
    </html>
  );
}
