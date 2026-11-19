"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export default function NotFound() {
  const { locale, dict } = useI18n();
  return (
    <section className="bg-mist py-24 sm:py-32">
      <div className="container text-center">
        <span className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-brand text-white shadow-glow">
          <Compass className="h-10 w-10" aria-hidden />
        </span>
        <p className="text-7xl font-extrabold text-ink/10 sm:text-9xl">404</p>
        <h1 className="-mt-4 text-3xl font-extrabold sm:text-4xl">{dict.notFound.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-500">{dict.notFound.text}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/${locale}`} className="btn btn-primary btn-lg">{dict.notFound.home}</Link>
          <Link href={`/${locale}/services`} className="btn btn-outline btn-lg">{dict.notFound.services}</Link>
        </div>
      </div>
    </section>
  );
}
