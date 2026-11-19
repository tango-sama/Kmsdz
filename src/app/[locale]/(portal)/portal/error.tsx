"use client";

import { AlertTriangle } from "lucide-react";
import { usePortal } from "@/components/portal/portal-provider";

/** Friendly fallback instead of the generic "Application error" screen. */
export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = usePortal();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-600" aria-hidden />
      <p className="mt-4 text-lg font-extrabold">{t.errors.UNKNOWN}</p>
      <button onClick={reset} className="btn btn-primary mt-6">{t.common.back}</button>
    </div>
  );
}
