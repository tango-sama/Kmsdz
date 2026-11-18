"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Phone } from "lucide-react";
import { WhatsAppIcon } from "./icons";

export function FloatingActions({ whatsappHref, phoneHref, labels }: { whatsappHref: string; phoneHref: string; labels: { whatsapp: string; call: string; top: string } }) {
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-4 end-4 z-30 flex flex-col items-center gap-3 sm:bottom-6 sm:end-6">
      <button
        type="button"
        aria-label={labels.top}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`grid h-11 w-11 place-items-center rounded-full bg-ink text-white shadow-lift transition duration-300 hover:bg-brand ${showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
        tabIndex={showTop ? 0 : -1}
      >
        <ArrowUp className="h-5 w-5" aria-hidden />
      </button>
      <a href={phoneHref} aria-label={labels.call} className="grid h-12 w-12 place-items-center rounded-full bg-brand text-white shadow-glow transition hover:bg-brand-600 lg:hidden">
        <Phone className="h-5 w-5" aria-hidden />
      </a>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={labels.whatsapp}
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-105 hover:bg-[#1fb957]"
      >
        <WhatsAppIcon className="h-8 w-8" />
      </a>
    </div>
  );
}
