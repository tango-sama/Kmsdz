import Link from "next/link";
import { Phone } from "lucide-react";
import { company } from "@/config/company";
import type { Locale } from "@/i18n/config";

export function CtaBand({ locale, title, text, button, call, href }: { locale: Locale; title: string; text: string; button: string; call: string; href?: string }) {
  return (
    <section className="relative overflow-hidden bg-brand text-white">
      <div aria-hidden className="absolute -end-24 -top-24 h-72 w-72 rotate-12 rounded-[3rem] bg-white/10" />
      <div aria-hidden className="absolute -bottom-28 start-1/3 h-64 w-64 -rotate-12 rounded-[3rem] bg-ink/15" />
      <div className="container relative flex flex-col items-start justify-between gap-8 py-14 lg:flex-row lg:items-center lg:py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
          <p className="mt-3 text-lg text-white/90">{text}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href={href ?? `/${locale}/quote`} className="btn btn-dark btn-lg">{button}</Link>
          <a href={`tel:${company.phones[0].tel}`} className="btn btn-lg border border-white/50 text-white hover:bg-white/10">
            <Phone className="h-5 w-5" aria-hidden />
            {call}
            <span className="ltr-isolate font-extrabold">{company.phones[0].display}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
