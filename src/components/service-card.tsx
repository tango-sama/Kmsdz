import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Service } from "@/config/services";
import { getDict } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { ServiceIconView } from "./icons";

export function ServiceCard({ service, locale, priority = false }: { service: Service; locale: Locale; priority?: boolean }) {
  const d = getDict(locale);
  const c = service[locale];
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const secondary = service[locale === "ar" ? "fr" : "ar"].title;
  return (
    <article className="card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link href={`/${locale}/services/${service.slug}`} className="relative block aspect-[16/10] overflow-hidden" tabIndex={-1} aria-hidden>
        <Image
          src={service.image}
          alt=""
          fill
          sizes="(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw"
          priority={priority}
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
        <span className="absolute bottom-3 start-3 grid h-11 w-11 place-items-center rounded-xl bg-brand text-white shadow-glow">
          <ServiceIconView name={service.icon} className="h-5 w-5" />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-xl font-extrabold text-ink">
          <Link href={`/${locale}/services/${service.slug}`} className="hover:text-brand">{c.title}</Link>
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-ink-400">
          <span lang={locale === "ar" ? "fr" : "ar"} dir={locale === "ar" ? "ltr" : "rtl"}>{secondary}</span>
        </p>
        <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-500">{c.short}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href={`/${locale}/quote?service=${service.slug}`} className="btn btn-primary !px-4 !py-2.5 !text-sm">
            {d.servicesPage.cardCta}
          </Link>
          <Link href={`/${locale}/services/${service.slug}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-700 hover:text-brand">
            {d.common.readMore}
            <Arrow className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
