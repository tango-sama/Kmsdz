"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { usePortal } from "./portal-provider";

export function AudiencePicker({ workers, defaultAudience = "all", defaultIds = [] }: { workers: { id: string; fullName: string; username: string }[]; defaultAudience?: "all" | "selected"; defaultIds?: string[] }) {
  const { t } = usePortal();
  const [audience, setAudience] = useState(defaultAudience);
  return (
    <fieldset className="rounded-2xl border border-ink/10 p-4">
      <legend className="px-2 text-sm font-bold text-ink-700">{t.audience.label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {(["all", "selected"] as const).map((v) => (
          <label key={v} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${audience === v ? "border-brand bg-brand-50" : "border-ink/10 hover:border-brand/40"}`}>
            <input type="radio" name="audience" value={v} checked={audience === v} onChange={() => setAudience(v)} className="h-4 w-4 accent-brand" />
            {v === "all" ? <Eye className="h-4 w-4 text-ink-500" aria-hidden /> : <EyeOff className="h-4 w-4 text-ink-500" aria-hidden />}
            {t.audience[v]}
          </label>
        ))}
      </div>
      {audience === "selected" && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-ink-500">{t.audience.hint}</p>
          {workers.length === 0 ? (
            <p className="text-sm font-semibold text-amber-700">{t.audience.noWorkers}</p>
          ) : (
            <ul className="grid max-h-48 gap-1.5 overflow-auto sm:grid-cols-2">
              {workers.map((w) => (
                <li key={w.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-mist px-3 py-2 text-sm">
                    <input type="checkbox" name="userIds" value={w.id} defaultChecked={defaultIds.includes(w.id)} className="h-4 w-4 accent-brand" />
                    <span className="font-semibold">{w.fullName}</span>
                    <span className="ltr-isolate text-xs text-ink-400">@{w.username}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </fieldset>
  );
}
