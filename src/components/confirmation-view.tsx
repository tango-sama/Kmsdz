"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Info, Check } from "lucide-react";
import { LAST_SUBMISSION_KEY } from "@/lib/client-submit";
import { useI18n } from "./i18n-provider";

type Saved = { reference: string; filesStored: boolean };

/**
 * Shows the confirmation ONLY if this browser actually received a successful API response
 * (the record is written to sessionStorage after ok:true). Opening the URL directly shows nothing fake.
 */
export function ConfirmationView() {
  const { locale, dict: d } = useI18n();
  const t = d.confirmation;
  const [state, setState] = useState<"loading" | "ok" | "none">("loading");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_SUBMISSION_KEY);
      const parsed = raw ? (JSON.parse(raw) as Saved & { at: number }) : null;
      if (parsed && typeof parsed.reference === "string" && /^KMS-\d{6}-[A-Z0-9]{6}$/.test(parsed.reference)) {
        setSaved(parsed);
        setState("ok");
        return;
      }
    } catch {}
    setState("none");
  }, []);

  if (state === "loading") return <div className="h-64" aria-hidden />;

  if (state === "none" || !saved) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <Info className="mx-auto h-12 w-12 text-ink-400" aria-hidden />
        <h2 className="mt-4 text-2xl font-extrabold">{t.noRecent}</h2>
        <p className="mt-2 text-ink-500">{t.noRecentText}</p>
        <Link href={`/${locale}/quote`} className="btn btn-primary mt-6">{d.nav.quote}</Link>
      </div>
    );
  }

  return (
    <div className="card mx-auto max-w-2xl p-8 sm:p-10">
      <div className="text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50"><CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden /></span>
        <h2 className="mt-5 text-3xl font-extrabold">{t.title}</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-500">{t.text}</p>
      </div>

      <div className="mt-8 rounded-2xl bg-ink p-6 text-center text-white">
        <p className="text-sm text-white/70">{t.reference}</p>
        <p className="ltr-isolate mt-1 whitespace-nowrap text-xl font-extrabold tracking-wider text-brand sm:text-3xl sm:tracking-widest" dir="ltr">{saved.reference}</p>
        <p className="mt-2 text-xs text-white/60">{t.referenceHint}</p>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(saved.reference);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {}
          }}
          className="btn btn-ghost mt-4 !py-2 !text-sm"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? t.copied : t.copy}
        </button>
      </div>

      {!saved.filesStored && (
        <p role="note" className="mt-5 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t.filesNotStored}
        </p>
      )}

      <h3 className="mt-8 text-lg font-extrabold">{t.whatNext}</h3>
      <ol className="mt-3 space-y-3">
        {t.next.map((n, i) => (
          <li key={n} className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">{i + 1}</span>
            <span className="pt-0.5 text-ink-700">{n}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={`/${locale}`} className="btn btn-primary">{t.backHome}</Link>
        <Link href={`/${locale}/quote`} className="btn btn-outline" onClick={() => { try { sessionStorage.removeItem(LAST_SUBMISSION_KEY); } catch {} }}>{t.newRequest}</Link>
      </div>
    </div>
  );
}
