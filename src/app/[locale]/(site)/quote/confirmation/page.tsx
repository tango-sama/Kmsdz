import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDict } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";
import { ConfirmationView } from "@/components/confirmation-view";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  return buildMetadata({ locale, path: "/quote/confirmation", title: d.seo.confirmationTitle, description: d.seo.quoteDescription, noindex: true });
}

export default async function ConfirmationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  return (
    <>
      <PageHero
        locale={locale}
        title={d.quote.title}
        crumbs={[{ label: d.common.home, href: `/${locale}` }, { label: d.quote.breadcrumb, href: `/${locale}/quote` }, { label: d.confirmation.title }]}
      />
      <Section tone="mist" className="!py-10 sm:!py-14">
        <ConfirmationView />
      </Section>
    </>
  );
}
