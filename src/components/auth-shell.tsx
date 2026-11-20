import type { ReactNode } from "react";
import { PortalProvider } from "@/components/portal/portal-provider";
import { getPortalDict } from "@/i18n/portal";
import type { Locale } from "@/i18n/config";

/** Frame shared by the public login / sign-up / account pages (reuses the portal's form + message components). */
export function AuthShell({ locale, title, lead, children, wide }: { locale: Locale; title: string; lead?: string; children: ReactNode; wide?: boolean }) {
  return (
    <PortalProvider locale={locale} t={getPortalDict(locale)}>
      <section className="bg-mist py-12 sm:py-16">
        <div className={`container ${wide ? "max-w-4xl" : "max-w-md"}`}>
          <h1 className="text-3xl font-extrabold">{title}</h1>
          {lead && <p className="mt-2 text-ink-500">{lead}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </PortalProvider>
  );
}
