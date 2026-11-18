"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, Paperclip, Pencil, Phone, Trash2, Upload } from "lucide-react";
import { company, whatsappLink } from "@/config/company";
import { services } from "@/config/services";
import { wilayas } from "@/config/wilayas";
import { customerTypes, FILE_LIMITS, issuesToErrors, projectTypes, quoteSchema, quoteStepFields, validateFiles, type FieldErrors, type QuoteInput } from "@/lib/validation";
import { LAST_SUBMISSION_KEY, newIdempotencyKey, postSubmission } from "@/lib/client-submit";
import type { SubmitErrorCode } from "@/lib/types";
import { Field, Honeypot, TurnstileWidget } from "./form-bits";
import { useI18n } from "./i18n-provider";

const EMPTY: Required<QuoteInput> = {
  fullName: "", phone: "", email: "", customerType: "" as never, service: "" as never, wilaya: "", commune: "",
  projectType: "" as never, description: "", budget: "", startDate: "", notes: "",
};
const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export function QuoteForm() {
  const { locale, dict: d } = useI18n();
  const q = d.quote;
  const router = useRouter();
  const Next = locale === "ar" ? ArrowLeft : ArrowRight;
  const Prev = locale === "ar" ? ArrowRight : ArrowLeft;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [values, setValues] = useState<Required<QuoteInput>>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [token, setToken] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [apiError, setApiError] = useState<SubmitErrorCode | null>(null);

  const mountedAt = useRef(0);
  const idempotencyKey = useRef("");
  const submitting = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    mountedAt.current = performance.now();
    idempotencyKey.current = newIdempotencyKey();
    // preselect the service from ?service=slug
    const slug = new URLSearchParams(window.location.search).get("service");
    if (slug && services.some((s) => s.slug === slug)) setValues((v) => ({ ...v, service: slug as never }));
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const msg = (key?: string) => (key ? (d.validation as Record<string, string>)[key] || d.validation.required : undefined);
  const set = <K extends keyof QuoteInput>(k: K, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const fullErrors = (): FieldErrors => {
    const r = quoteSchema.safeParse(values);
    return r.success ? {} : issuesToErrors(r.error.issues);
  };

  const focusFirst = (errs: FieldErrors) => {
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) requestAnimationFrame(() => document.getElementById(`f-${first}`)?.focus());
  };

  const validateStep = (s: 1 | 2 | 3): boolean => {
    const all = fullErrors();
    const mine: FieldErrors = {};
    for (const f of quoteStepFields[s]) if (all[f]) mine[f] = all[f];
    if (s === 3) {
      const fe = validateFiles(files.map((f) => ({ name: f.name, size: f.size, type: f.type })));
      if (fe) mine.files = fe;
    }
    setErrors(mine);
    focusFirst(mine);
    return Object.keys(mine).length === 0;
  };

  const onFilesPicked = (list: FileList | null) => {
    if (!list) return;
    const merged = [...files, ...Array.from(list)];
    const fe = validateFiles(merged.map((f) => ({ name: f.name, size: f.size, type: f.type })));
    if (fe) {
      setErrors((e) => ({ ...e, files: fe }));
      return;
    }
    setErrors((e) => ({ ...e, files: "" }));
    setFiles(merged);
  };

  const go = (s: 1 | 2 | 3 | 4) => {
    setApiError(null);
    setStep(s);
  };

  async function submit() {
    if (submitting.current) return; // duplicate-submission guard (double tap / Enter key)
    const all = fullErrors();
    if (Object.keys(all).length) {
      setErrors(all);
      const firstStep = (Object.keys(quoteStepFields) as unknown as (1 | 2 | 3)[]).find((s) => quoteStepFields[s].some((f) => all[f]));
      if (firstStep) go(firstStep);
      return;
    }
    if (!consent) {
      setErrors({ consent: "consent" });
      return;
    }
    if (TURNSTILE_KEY && !token) {
      setApiError("TURNSTILE");
      return;
    }
    submitting.current = true;
    setStatus("submitting");
    setApiError(null);
    const res = await postSubmission({
      kind: "quote",
      locale,
      data: values,
      files,
      idempotencyKey: idempotencyKey.current,
      mountedAt: mountedAt.current,
      hp,
      consent,
      turnstileToken: token,
    });
    if (res.ok) {
      try {
        sessionStorage.setItem(LAST_SUBMISSION_KEY, JSON.stringify({ reference: res.reference, filesStored: res.filesStored, kind: "quote", at: Date.now() }));
      } catch {}
      router.push(`/${locale}/quote/confirmation`);
      return; // keep the button locked while navigating
    }
    submitting.current = false;
    setStatus("idle");
    setApiError(res.code);
    if (res.fieldErrors) {
      setErrors(res.fieldErrors);
      const firstStep = (Object.keys(quoteStepFields) as unknown as (1 | 2 | 3)[]).find((s) => quoteStepFields[s].some((f) => res.fieldErrors?.[f]));
      if (firstStep) go(firstStep);
    }
    setToken("");
    setResetSignal((n) => n + 1);
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      if (validateStep(step as 1 | 2)) go((step + 1) as 2 | 3);
    } else if (step === 3) {
      if (validateStep(3)) go(4);
    } else void submit();
  };

  const svcLabel = (slug: string) => (slug === "other" ? q.otherService : services.find((s) => s.slug === slug)?.[locale].title || "");
  const wilayaLabel = (code: string) => {
    const w = wilayas.find((x) => x.code === code);
    return w ? `${w.code} - ${w[locale]}` : "";
  };
  const fileSize = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

  const stepMeta = [q.s1, q.s2, q.s3, q.s4][step - 1];
  const summary = useMemo(
    () =>
      [
        { step: 1 as const, label: q.fields.fullName, value: values.fullName },
        { step: 1 as const, label: q.fields.phone, value: values.phone, ltr: true },
        { step: 1 as const, label: q.fields.email, value: values.email, ltr: true },
        { step: 1 as const, label: q.fields.customerType, value: values.customerType ? q.customerTypes[values.customerType] : "" },
        { step: 2 as const, label: q.fields.service, value: svcLabel(values.service) },
        { step: 2 as const, label: q.fields.wilaya, value: wilayaLabel(values.wilaya) },
        { step: 2 as const, label: q.fields.commune, value: values.commune },
        { step: 2 as const, label: q.fields.projectType, value: values.projectType ? q.projectTypes[values.projectType] : "" },
        { step: 2 as const, label: q.fields.description, value: values.description, wide: true },
        { step: 3 as const, label: q.fields.budget, value: values.budget },
        { step: 3 as const, label: q.fields.startDate, value: values.startDate, ltr: true },
        { step: 3 as const, label: q.fields.notes, value: values.notes, wide: true },
        { step: 3 as const, label: q.fields.files, value: files.map((f) => f.name).join("، "), wide: true, none: q.filesNone },
      ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, files, locale],
  );

  const errorText = apiError ? (d.apiErrors as Record<string, string>)[apiError] : "";
  const inputProps = (name: keyof QuoteInput) => ({
    id: `f-${name}`,
    name: String(name),
    value: values[name] as string,
    "aria-invalid": errors[name as string] ? (true as const) : undefined,
    "aria-describedby": errors[name as string] ? `f-${name}-err` : undefined,
    onChange: (e: { target: { value: string } }) => set(name, e.target.value),
  });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} noValidate className="card overflow-hidden" aria-busy={status === "submitting"}>
      {/* stepper */}
      <div className="border-b border-ink/5 bg-mist px-5 py-5 sm:px-8">
        <ol className="flex items-center justify-between gap-2" aria-label={`${q.stepLabel} ${step} ${q.of} 4`}>
          {q.stepper.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3 | 4;
            const done = n < step;
            const current = n === step;
            return (
              <li key={label} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={current ? "step" : undefined}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold transition ${done ? "bg-brand text-white" : current ? "bg-ink text-white ring-4 ring-brand/30" : "bg-white text-ink-400 ring-1 ring-ink/10"}`}>
                  {done ? <Check className="h-4 w-4" aria-hidden /> : n}
                </span>
                <span className={`hidden text-sm font-bold sm:inline ${current ? "text-ink" : "text-ink-400"}`}>{label}</span>
                {n < 4 && <span aria-hidden className={`mx-1 h-0.5 flex-1 rounded ${done ? "bg-brand" : "bg-ink/10"}`} />}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm font-bold text-ink-500 sm:hidden">
          {q.stepLabel} {step} {q.of} 4 · {q.stepper[step - 1]}
        </p>
      </div>

      <div className="px-5 py-7 sm:px-8 sm:py-9">
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold outline-none">{stepMeta.title}</h2>
        <p className="mt-1 text-ink-500">{stepMeta.text}</p>

        <Honeypot value={hp} onChange={setHp} />

        {step === 1 && (
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id="f-fullName" label={q.fields.fullName} error={msg(errors.fullName)}>
                <input {...inputProps("fullName")} className="field" autoComplete="name" maxLength={80} />
              </Field>
            </div>
            <Field id="f-phone" label={q.fields.phone} error={msg(errors.phone)} hint={q.fields.phoneHint}>
              <input {...inputProps("phone")} type="tel" inputMode="tel" dir="ltr" autoComplete="tel" placeholder="06 61 20 45 90" className="field text-start" />
            </Field>
            <Field id="f-email" label={q.fields.email} optional optionalLabel={d.common.optional} error={msg(errors.email)}>
              <input {...inputProps("email")} type="email" inputMode="email" dir="ltr" autoComplete="email" placeholder="name@example.com" className="field text-start" />
            </Field>
            <fieldset className="sm:col-span-2">
              <legend className="label">{q.fields.customerType}<span className="ms-1 text-brand" aria-hidden>*</span></legend>
              <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
                {customerTypes.map((c, i) => (
                  <label key={c} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 font-bold transition ${values.customerType === c ? "border-brand bg-brand-50 text-ink" : "border-ink/10 text-ink-700 hover:border-brand/50"}`}>
                    <input type="radio" id={i === 0 ? "f-customerType" : undefined} name="customerType" value={c} checked={values.customerType === c} onChange={() => set("customerType", c)} className="h-4 w-4 accent-brand" />
                    {q.customerTypes[c]}
                  </label>
                ))}
              </div>
              {errors.customerType && <p role="alert" className="mt-1.5 text-sm font-semibold text-red-600">{msg(errors.customerType)}</p>}
            </fieldset>
          </div>
        )}

        {step === 2 && (
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id="f-service" label={q.fields.service} error={msg(errors.service)}>
                <select {...inputProps("service")} className="field">
                  <option value="">{d.common.select}</option>
                  {services.map((s) => <option key={s.slug} value={s.slug}>{s[locale].title}</option>)}
                  <option value="other">{q.otherService}</option>
                </select>
              </Field>
            </div>
            <Field id="f-wilaya" label={q.fields.wilaya} error={msg(errors.wilaya)}>
              <select {...inputProps("wilaya")} className="field">
                <option value="">{d.common.select}</option>
                {wilayas.map((w) => <option key={w.code} value={w.code}>{w.code} - {w[locale]}</option>)}
              </select>
            </Field>
            <Field id="f-commune" label={q.fields.commune} error={msg(errors.commune)}>
              <input {...inputProps("commune")} className="field" autoComplete="address-level2" maxLength={80} />
            </Field>
            <fieldset className="sm:col-span-2">
              <legend className="label">{q.fields.projectType}<span className="ms-1 text-brand" aria-hidden>*</span></legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup">
                {projectTypes.map((p, i) => (
                  <label key={p} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 font-bold transition ${values.projectType === p ? "border-brand bg-brand-50 text-ink" : "border-ink/10 text-ink-700 hover:border-brand/50"}`}>
                    <input type="radio" id={i === 0 ? "f-projectType" : undefined} name="projectType" value={p} checked={values.projectType === p} onChange={() => set("projectType", p)} className="h-4 w-4 accent-brand" />
                    {q.projectTypes[p]}
                  </label>
                ))}
              </div>
              {errors.projectType && <p role="alert" className="mt-1.5 text-sm font-semibold text-red-600">{msg(errors.projectType)}</p>}
            </fieldset>
            <div className="sm:col-span-2">
              <Field id="f-description" label={q.fields.description} error={msg(errors.description)} hint={q.fields.descriptionHint}>
                <textarea {...inputProps("description")} rows={5} maxLength={2000} className="field resize-y" />
                <p className="mt-1 text-end text-xs text-ink-400" aria-hidden><span className="ltr-isolate">{values.description.length} / 2000</span></p>
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <Field id="f-budget" label={q.fields.budget} optional optionalLabel={d.common.optional} error={msg(errors.budget)} hint={q.fields.budgetHint}>
              <input {...inputProps("budget")} maxLength={60} className="field" />
            </Field>
            <Field id="f-startDate" label={q.fields.startDate} optional optionalLabel={d.common.optional} error={msg(errors.startDate)}>
              <input {...inputProps("startDate")} type="date" min={today} dir="ltr" className="field text-start" />
            </Field>
            <div className="sm:col-span-2">
              <Field id="f-notes" label={q.fields.notes} optional optionalLabel={d.common.optional} error={msg(errors.notes)}>
                <textarea {...inputProps("notes")} rows={4} maxLength={1000} className="field resize-y" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <span className="label">{q.fields.files} <span className="ms-1 text-xs font-medium text-ink-400">({d.common.optional})</span></span>
              <label htmlFor="f-files" className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition hover:border-brand hover:bg-brand-50 ${errors.files ? "border-red-400" : "border-ink/20"}`}>
                <Upload className="h-7 w-7 text-brand" aria-hidden />
                <span className="font-bold text-ink-700">{q.fields.addFiles}</span>
                <span className="text-xs text-ink-400">{q.fields.filesHint}</span>
                <input
                  id="f-files"
                  type="file"
                  multiple
                  accept={FILE_LIMITS.allowedExt.map((e) => "." + e).join(",")}
                  className="sr-only"
                  onChange={(e) => {
                    onFilesPicked(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {errors.files && <p role="alert" className="mt-1.5 text-sm font-semibold text-red-600">{msg(errors.files)}</p>}
              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl bg-mist px-4 py-2.5 text-sm">
                      <Paperclip className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <span className="min-w-0 flex-1 truncate font-semibold" dir="auto">{f.name}</span>
                      <span className="shrink-0 text-xs text-ink-400"><span className="ltr-isolate">{fileSize(f.size)}</span></span>
                      <button type="button" aria-label={`${q.fields.removeFile}: ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-7">
            <dl className="divide-y divide-ink/5 rounded-2xl border border-ink/10">
              {summary.map((row, i) => (
                <div key={i} className="grid gap-1 px-4 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
                  <dt className="text-sm font-bold text-ink-500">{row.label}</dt>
                  <dd className={`flex items-start justify-between gap-3 font-semibold text-ink ${row.wide ? "whitespace-pre-wrap break-words" : ""}`}>
                    <span className="min-w-0 break-words" dir={row.ltr ? "ltr" : "auto"}>{row.value || <span className="font-normal text-ink-400">{(row as { none?: string }).none || q.notProvided}</span>}</span>
                    {i === 0 || summary[i - 1].step !== row.step ? (
                      <button type="button" onClick={() => go(row.step)} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand hover:underline">
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        {q.edit}
                      </button>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>

            <label className={`mt-6 flex cursor-pointer items-start gap-3 rounded-xl p-4 ring-1 ${errors.consent ? "bg-red-50 ring-red-300" : "bg-mist ring-transparent"}`}>
              <input id="f-consent" type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setErrors((x) => ({ ...x, consent: "" })); }} className="mt-1 h-5 w-5 shrink-0 accent-brand" aria-invalid={errors.consent ? true : undefined} />
              <span className="text-sm font-semibold text-ink-700">{q.consent}</span>
            </label>
            {errors.consent && <p role="alert" className="mt-1.5 text-sm font-semibold text-red-600">{msg(errors.consent)}</p>}

            {TURNSTILE_KEY && (
              <div className="mt-5">
                <TurnstileWidget siteKey={TURNSTILE_KEY} onToken={setToken} resetSignal={resetSignal} lang={locale} />
              </div>
            )}
          </div>
        )}

        {apiError && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
            <p className="flex items-center gap-2 font-extrabold"><AlertTriangle className="h-5 w-5" aria-hidden />{q.errorTitle}</p>
            <p className="mt-1.5 text-sm">{apiError === "TURNSTILE" && !errorText ? q.turnstile : errorText}</p>
            <p className="mt-1.5 text-sm">{q.errorFallback}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${company.phones[0].tel}`} className="btn btn-dark !py-2 !text-sm"><Phone className="h-4 w-4" aria-hidden /><span className="ltr-isolate">{company.phones[0].display}</span></a>
              <a href={whatsappLink(q.waMessage)} target="_blank" rel="noopener noreferrer" className="btn !bg-[#25D366] !py-2 !text-sm text-white">{d.common.whatsapp}</a>
            </div>
          </div>
        )}

        {status === "submitting" && <p role="status" className="mt-5 text-sm font-semibold text-ink-500">{q.submitting}</p>}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button type="button" onClick={() => go((step - 1) as 1 | 2 | 3)} disabled={status === "submitting"} className="btn btn-outline">
              <Prev className="h-4 w-4" aria-hidden />
              {d.common.previous}
            </button>
          ) : <span />}
          <button type="submit" disabled={status === "submitting"} className="btn btn-primary btn-lg min-w-40">
            {status === "submitting" ? (
              <><Loader2 className="h-5 w-5 animate-spin" aria-hidden />{d.common.sending}</>
            ) : step < 4 ? (
              <>{d.common.next}<Next className="h-4 w-4" aria-hidden /></>
            ) : apiError ? q.retry : d.common.submit}
          </button>
        </div>
      </div>
    </form>
  );
}
