import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { company, siteUrl, whatsappLink } from "@/config/company";
import { services } from "@/config/services";
import { getDict } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { FloatingActions } from "@/components/floating-actions";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";

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


export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  return (
    <>
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
      <JsonLd data={localBusinessJsonLd(locale)} />
    </>
  );
}
