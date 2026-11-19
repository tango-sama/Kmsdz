import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getPortalDict } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { PortalProvider } from "@/components/portal/portal-provider";

export const dynamic = "force-dynamic"; // session-dependent: never prerender

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getPortalDict(locale);
  return { title: `${t.name} | KMS`, robots: { index: false, follow: false, nocache: true } };
}

export default async function PortalLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <PortalProvider locale={locale} t={getPortalDict(locale)}>
      <div className="min-h-screen bg-mist">{children}</div>
    </PortalProvider>
  );
}
