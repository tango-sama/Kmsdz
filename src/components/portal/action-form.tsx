"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, KeyRound, Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/portal/action-types";
import { usePortal } from "./portal-provider";

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children?: ReactNode;
  className?: string;
  submitLabel?: ReactNode;
  submitClassName?: string;
  successMessage?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
  hideSubmit?: boolean;
  inline?: boolean; // compact (no message box; errors as small text)
  encType?: string;
};

export function ActionForm({ action, children, className = "", submitLabel, submitClassName = "btn btn-primary", successMessage, resetOnSuccess, confirm, hideSubmit, inline, encType }: Props) {
  const { locale, t } = usePortal();
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
    if (state?.nonce) {
      setShown(state.nonce);
      if (state.ok && !state.temp) {
        const id = setTimeout(() => setShown(null), 4000);
        return () => clearTimeout(id);
      }
    }
  }, [state, resetOnSuccess]);

  const show = shown !== null && state?.nonce === shown;
  const error = show && state?.error ? (t.errors as Record<string, string>)[state.error] || t.errors.UNKNOWN : "";

  return (
    <form
      ref={ref}
      action={formAction}
      encType={encType}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      {children}
      {!hideSubmit && (
        <button
          type="submit"
          disabled={pending}
          className={submitClassName}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {submitLabel}
        </button>
      )}
      {error && (
        <p role="alert" className={`flex items-start gap-2 text-sm font-semibold text-red-600 ${inline ? "mt-1" : "mt-4 rounded-xl bg-red-50 p-3"}`}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {show && state?.ok && !state.temp && successMessage && (
        <p role="status" className="mt-3 flex items-center gap-2 text-sm font-semibold text-green-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {successMessage}
        </p>
      )}
      {show && state?.temp && <TempPassword username={state.temp.username} password={state.temp.password} />}
    </form>
  );
}

function TempPassword({ username, password }: { username: string; password: string }) {
  const { t } = usePortal();
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="mt-4 rounded-2xl border-2 border-brand/40 bg-brand-50 p-4">
      <p className="flex items-center gap-2 font-extrabold text-ink"><KeyRound className="h-4 w-4 text-brand" aria-hidden />{t.users.tempTitle}</p>
      <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className="text-ink-500">{t.users.fields.username}</dt>
        <dd className="ltr-isolate font-bold">{username}</dd>
        <dt className="text-ink-500">{t.login.password}</dt>
        <dd className="ltr-isolate select-all rounded-lg bg-white px-3 py-1 font-mono text-base font-bold tracking-wider">{password}</dd>
      </dl>
      <p className="mt-2 text-xs text-ink-600">{t.users.tempNote}</p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${username} / ${password}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
        className="btn btn-outline mt-3 !py-1.5 !text-sm"
      >
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        {copied ? t.common.copied : t.common.copy}
      </button>
    </div>
  );
}
