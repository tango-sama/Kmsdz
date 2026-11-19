import { NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/auth/server";
import { getFileForDownload } from "@/lib/portal/files";
import { safeFilename } from "@/lib/portal/filetypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authenticated file delivery. Files are never public: the session is checked, and the same SQL that
 * reads the bytes enforces the per-worker visibility. Hidden and missing files both answer 404.
 * ?download=1 forces a download; otherwise PDFs/images open in the browser (to print them).
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentActor();
  if (!actor || actor.mustChangePassword) return new NextResponse("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });

  const { id } = await params;
  const file = await getFileForDownload(actor, id);
  if (!file) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const forceDownload = new URL(req.url).searchParams.get("download") === "1";
  const disposition = file.inline && !forceDownload ? "inline" : "attachment";
  const name = safeFilename(file.filename);
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.data.length),
      "Content-Disposition": `${disposition}; filename="${name.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
