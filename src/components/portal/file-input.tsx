"use client";

import { useRef, useState } from "react";
import { FILE_TYPES, extOf } from "@/lib/portal/filetypes";
import { CONVERTIBLE, convertToWebp } from "@/lib/portal/image-convert";
import { fmtSize } from "@/i18n/portal";
import { Loader2, ImageIcon } from "lucide-react";
import { usePortal } from "./portal-provider";

// stay under the 4 MiB server cap (the host also adds multipart overhead)
const TARGET_BYTES = 3_900_000;

/**
 * File picker that (1) converts JPG/PNG images to WebP in the browser at FULL resolution,
 * lowering only the encoding quality until the file fits, and (2) validates size/type before uploading.
 */
export function FileInput({ name = "file", id = "file", accept }: { name?: string; id?: string; accept: string }) {
  const { t } = usePortal();
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const fail = (el: HTMLInputElement, msg: string) => {
    el.setCustomValidity(msg);
    setError(msg);
    setInfo("");
    el.reportValidity();
  };

  async function onChange(el: HTMLInputElement) {
    setError("");
    setInfo("");
    el.setCustomValidity("");
    let f = el.files?.[0];
    if (!f) return;
    if (!FILE_TYPES[extOf(f.name)]) return fail(el, t.errors.FILE_TYPE);

    if (CONVERTIBLE.includes(f.type)) {
      setBusy(true);
      el.setCustomValidity(t.files.converting); // block submit while converting
      try {
        const r = await convertToWebp(f, TARGET_BYTES);
        if (r) {
          const dt = new DataTransfer();
          dt.items.add(r.file);
          el.files = dt.files;
          f = r.file;
          setInfo(
            (r.downscaled ? t.files.convertedScaled : t.files.converted)
              .replace("{w}", String(r.width)).replace("{h}", String(r.height))
              .replace("{size}", fmtSize(r.file.size)).replace("{orig}", fmtSize(r.originalSize)),
          );
        }
      } catch {
        // conversion failed (very large image / old browser): fall through and validate the original
      } finally {
        setBusy(false);
        el.setCustomValidity("");
      }
    }

    if (f.size > 4 * 1024 * 1024) return fail(el, t.errors.FILE_SIZE);
  }

  return (
    <>
      <input
        ref={ref}
        id={id}
        name={name}
        type="file"
        required
        accept={accept}
        className="field !p-2.5"
        aria-invalid={error ? true : undefined}
        aria-busy={busy}
        onChange={(e) => void onChange(e.currentTarget)}
      />
      {busy && (
        <p role="status" className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-ink-600">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />{t.files.converting}
        </p>
      )}
      {info && !busy && (
        <p role="status" className="mt-1.5 flex items-start gap-2 text-sm font-semibold text-green-700">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span className="ltr-isolate">{info}</span>
        </p>
      )}
      {error && <p role="alert" className="mt-1.5 text-sm font-semibold text-red-600">{error}</p>}
    </>
  );
}
