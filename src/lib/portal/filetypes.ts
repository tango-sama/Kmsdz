/** Allowed uploads for the worker portal. Content is verified (magic bytes), not just the extension. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024; // Vercel functions accept ~4.5 MB request bodies

type Def = { mime: string; inline: boolean; sniff: (b: Uint8Array) => boolean };
const starts = (b: Uint8Array, ...bytes: number[]) => bytes.every((x, i) => b[i] === x);
const looksText = (b: Uint8Array) => !b.slice(0, 2000).includes(0);

export const FILE_TYPES: Record<string, Def> = {
  pdf: { mime: "application/pdf", inline: true, sniff: (b) => starts(b, 0x25, 0x50, 0x44, 0x46) },
  png: { mime: "image/png", inline: true, sniff: (b) => starts(b, 0x89, 0x50, 0x4e, 0x47) },
  jpg: { mime: "image/jpeg", inline: true, sniff: (b) => starts(b, 0xff, 0xd8, 0xff) },
  jpeg: { mime: "image/jpeg", inline: true, sniff: (b) => starts(b, 0xff, 0xd8, 0xff) },
  webp: { mime: "image/webp", inline: true, sniff: (b) => starts(b, 0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", inline: false, sniff: (b) => starts(b, 0x50, 0x4b) },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", inline: false, sniff: (b) => starts(b, 0x50, 0x4b) },
  doc: { mime: "application/msword", inline: false, sniff: (b) => starts(b, 0xd0, 0xcf, 0x11, 0xe0) },
  xls: { mime: "application/vnd.ms-excel", inline: false, sniff: (b) => starts(b, 0xd0, 0xcf, 0x11, 0xe0) },
  txt: { mime: "text/plain; charset=utf-8", inline: false, sniff: looksText },
  csv: { mime: "text/csv; charset=utf-8", inline: false, sniff: looksText },
};

export const FILE_ACCEPT = Object.keys(FILE_TYPES).map((e) => "." + e).join(",");

export function extOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

export function checkFile(name: string, bytes: Uint8Array): { ok: true; mime: string; inline: boolean } | { ok: false; code: "FILE_TYPE" | "FILE_SIZE" | "FILE_REQUIRED" } {
  if (!bytes.length) return { ok: false, code: "FILE_REQUIRED" };
  if (bytes.length > MAX_FILE_BYTES) return { ok: false, code: "FILE_SIZE" };
  const def = FILE_TYPES[extOf(name)];
  if (!def || !def.sniff(bytes)) return { ok: false, code: "FILE_TYPE" };
  return { ok: true, mime: def.mime, inline: def.inline };
}

export function isInlineMime(mime: string): boolean {
  return Object.values(FILE_TYPES).some((d) => d.inline && d.mime === mime);
}

/** Safe value for Content-Disposition filename parameters. */
export function safeFilename(name: string): string {
  const cleaned = name.replace(/[\r\n"\\/;]/g, "_").replace(/[^\x20-\x7e؀-ۿÀ-ſ]/g, "_");
  return cleaned.slice(-120) || "file";
}
