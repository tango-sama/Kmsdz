"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Phone, Send } from "lucide-react";
import { company, whatsappLink } from "@/config/company";
import { contactSchema, issuesToErrors, type FieldErrors } from "@/lib/validation";
import { newIdempotencyKey, postSubmission } from "@/lib/client-submit";
import type { SubmitErrorCode } from "@/lib/types";
import { Field, Honeypot, TurnstileWidget } from "./form-bits";
import { useI18n } from "./i18n-provider";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export function ContactForm() {
  const { locale, dict: d } = useI18n();
  const c = d.contact;
  const [v, setV] = useState({ fullName: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [hp, setHp] = useState("");
  const [token, setToken] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [reference, setReference] = useState("");
  const [apiError, setApiError] = useState<SubmitErrorCode | null>(null);
  const mountedAt = useRef(0);
  const key = useRef("");
  const busy = useRef(false);

  useEffect(() => {
    mountedAt.current = performance.now();
    key.current = newIdempotencyKey();
  }, []);

  const msg = (k?: string) => (k ? (d.validation as Record<string, string>)[k] || d.validation.required : undefined);
  const set = (k: keyof typeof v, val: string) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    const r = contactSchema.safeParse(v);
    if (!r.success) {
      const errs = issuesToErrors(r.error.issues);
      setErrors(errs);
      const first = Object.keys(errs)[0];
      requestAnimationFrame(() => document.getElementById(`c-${first}`)?.focus());
      return;
    }
    if (TURNSTILE_KEY && !token) {
      setApiError("TURNSTILE");
      return;
    }
    busy.current = true;
    setStatus("submitting");
    setApiError(null);
    const res = await postSubmission({ kind: "contact", locale, data: v, idempotencyKey: key.current, mountedAt: mountedAt.current, hp, turnstileToken: token });
    if (res.ok) {
      setReference(res.reference);
      setStatus("done");
      return;
    }
    busy.current = false;
    setStatus("idle");
    setApiError(res.code);
    if (res.fieldErrors) setErrors(res.fieldErrors);
    setToken("");
    setResetSignal((n) => n + 1);
  }

  if (status === "done") {
    return (
      <div role="status" className="card p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" aria-hidden />
        <h2 className="mt-4 text-2xl font-extrabold">{c.successTitle}</h2>
        <p className="mt-2 text-ink-500">{c.successText}</p>
        <p className="mt-5 text-sm text-ink-500">{c.successRef}</p>
        <p className="ltr-isolate mt-1 rounded-xl bg-mist px-5 py-2 text-lg font-extrabold tracking-wider text-ink">{reference}</p>
      </div>
    );
  }

  const ip = (name: keyof typeof v) => ({
    id: `c-${name}`,
    name,
    value: v[name],
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? `c-${name}-err` : undefined,
    onChange: (e: { target: { value: string } }) => set(name, e.target.value),
  });
  const errorText = apiError ? (d.apiErrors as Record<string, string>)[apiError] : "";

  return (
    <form onSubmit={onSubmit} noValidate className="card p-6 sm:p-8" aria-busy={status === "submitting"}>
      <h2 className="text-2xl font-extrabold">{c.formTitle}</h2>
      <p className="mt-1 text-ink-500">{c.formText}</p>
      <Honeypot value={hp} onChange={setHp} />
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="c-fullName" label={c.fields.name} error={msg(errors.fullName)}>
            <input {...ip("fullName")} className="field" autoComplete="name" maxLength={80} />
          </Field>
        </div>
        <Field id="c-phone" label={c.fields.phone} error={msg(errors.phone)}>
          <input {...ip("phone")} type="tel" inputMode="tel" dir="ltr" autoComplete="tel" placeholder="06 61 20 45 90" className="field text-start" />
        </Field>
        <Field id="c-email" label={c.fields.email} optional optionalLabel={d.common.optional} error={msg(errors.email)}>
          <input {...ip("email")} type="email" inputMode="email" dir="ltr" autoComplete="email" className="field text-start" />
        </Field>
        <div className="sm:col-span-2">
          <Field id="c-message" label={c.fields.message} error={msg(errors.message)}>
            <textarea {...ip("message")} rows={5} maxLength={2000} className="field resize-y" />
          </Field>
        </div>
      </div>

      {TURNSTILE_KEY && <div className="mt-5"><TurnstileWidget siteKey={TURNSTILE_KEY} onToken={setToken} resetSignal={resetSignal} lang={locale} /></div>}

      {apiError && (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
          <p className="flex items-center gap-2 font-extrabold"><AlertTriangle className="h-5 w-5" aria-hidden />{d.quote.errorTitle}</p>
          <p className="mt-1.5 text-sm">{errorText || d.quote.turnstile}</p>
          <p className="mt-1.5 text-sm">{d.quote.errorFallback}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`tel:${company.phones[0].tel}`} className="btn btn-dark !py-2 !text-sm"><Phone className="h-4 w-4" aria-hidden /><span className="ltr-isolate">{company.phones[0].display}</span></a>
            <a href={whatsappLink(c.waMessage)} target="_blank" rel="noopener noreferrer" className="btn !bg-[#25D366] !py-2 !text-sm text-white">{d.common.whatsapp}</a>
          </div>
        </div>
      )}

      <button type="submit" disabled={status === "submitting"} className="btn btn-primary btn-lg mt-6 w-full sm:w-auto">
        {status === "submitting" ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden />{d.common.sending}</> : <><Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />{c.send}</>}
      </button>
    </form>
  );
}
