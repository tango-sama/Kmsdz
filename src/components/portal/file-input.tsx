"use client";

import { useState } from "react";
import { FILE_TYPES, MAX_FILE_BYTES, extOf } from "@/lib/portal/filetypes";
import { usePortal } from "./portal-provider";

/** File picker that validates size/type in the browser BEFORE uploading (the host rejects bodies over ~4.5 MB). */
export function FileInput({ name = "file", id = "file", accept }: { name?: string; id?: string; accept: string }) {
  const { t } = usePortal();
  const [error, setError] = useState("");
  return (
    <>
      <input
        id={id}
        name={name}
        type="file"
        required
        accept={accept}
        className="field !p-2.5"
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          let msg = "";
          if (f) {
            if (f.size > MAX_FILE_BYTES) msg = t.errors.FILE_SIZE;
            else if (!FILE_TYPES[extOf(f.name)]) msg = t.errors.FILE_TYPE;
          }
          e.currentTarget.setCustomValidity(msg); // blocks submission with a native message
          setError(msg);
          if (msg) e.currentTarget.reportValidity();
        }}
      />
      {error && <p role="alert" className="mt-1.5 text-sm font-semibold text-red-600">{error}</p>}
    </>
  );
}
