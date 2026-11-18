import "server-only";

/**
 * Optional attachment storage on Vercel Blob (BLOB_READ_WRITE_TOKEN).
 * Without a token, files are NOT stored and the API reports `filesStored: false`
 * so the visitor is told to send them by WhatsApp / e-mail.
 */
export function isStorageConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function storeFile(reference: string, file: File): Promise<string> {
  const { put } = await import("@vercel/blob");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
  const blob = await put(`kms-requests/${reference}/${safe}`, file, {
    access: "public",
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: file.type,
  });
  return blob.url;
}

/** Verify real file content (not just the declared MIME type / extension). */
export async function sniffFile(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const startsWith = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
  if (file.type === "application/pdf") return startsWith(0x25, 0x50, 0x44, 0x46); // %PDF
  if (file.type === "image/jpeg") return startsWith(0xff, 0xd8, 0xff);
  if (file.type === "image/png") return startsWith(0x89, 0x50, 0x4e, 0x47);
  if (file.type === "image/webp") return startsWith(0x52, 0x49, 0x46, 0x46) && head[8] === 0x57 && head[9] === 0x45; // RIFF....WE
  return false;
}
