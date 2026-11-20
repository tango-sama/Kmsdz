/**
 * Browser-side image -> WebP conversion that KEEPS THE ORIGINAL PIXEL DIMENSIONS (print quality).
 * Only the encoding quality is lowered, step by step, until the file fits the upload limit.
 * Pixels are only reduced as an absolute last resort (or if a side exceeds WebP's 16383 px format limit).
 * Must run in the browser (canvas); never import from server code.
 */
export type ConvertResult = {
  file: File;
  width: number;
  height: number;
  originalSize: number;
  quality: number; // 0..1 used for the final encode
  downscaled: boolean;
};

export const CONVERTIBLE = ["image/jpeg", "image/png", "image/webp"];
const WEBP_MAX_SIDE = 16383;
const Q_HIGH = 0.92; // first attempt (visually near-lossless)
const Q_LOW = 0.4; // lowest quality we accept before touching pixels

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", quality));
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    // honours EXIF rotation (phone photos), keeps full resolution
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function render(src: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);
  return canvas;
}

/**
 * @returns the converted file, or null when conversion is not possible/useful
 *          (caller then keeps the original). Throws only on unexpected errors.
 */
export async function convertToWebp(file: File, maxBytes: number): Promise<ConvertResult | null> {
  if (!CONVERTIBLE.includes(file.type)) return null;
  const img = await decode(file);
  try {
    let w = img.width;
    let h = img.height;
    const side = Math.max(w, h);
    let downscaled = false;
    if (side > WEBP_MAX_SIDE) {
      const k = WEBP_MAX_SIDE / side;
      w = Math.floor(w * k);
      h = Math.floor(h * k);
      downscaled = true;
    }

    let best: { blob: Blob; q: number; w: number; h: number } | null = null;
    const canvas = render(img.source, w, h);

    // 1) full resolution: highest quality first, then bisect the quality (max ~6 encodes in total)
    const high = await toBlob(canvas, Q_HIGH);
    if (!high || high.type !== "image/webp") return null; // browser cannot encode WebP
    if (high.size <= maxBytes) {
      best = { blob: high, q: Q_HIGH, w, h };
    } else {
      const low = await toBlob(canvas, Q_LOW);
      if (low && low.size <= maxBytes) {
        best = { blob: low, q: Q_LOW, w, h };
        let lo = Q_LOW;
        let hi = Q_HIGH;
        for (let i = 0; i < 4; i++) {
          const mid = (lo + hi) / 2;
          const b = await toBlob(canvas, mid);
          if (b && b.size <= maxBytes) {
            best = { blob: b, q: mid, w, h };
            lo = mid;
          } else hi = mid;
        }
      } else if (low) {
        // 2) last resort only: even the lowest quality does not fit -> reduce pixels as little as possible
        let scale = Math.min(0.95, Math.sqrt(maxBytes / low.size) * 0.95);
        for (let i = 0; i < 6 && !best; i++, scale *= 0.88) {
          const sw = Math.max(1, Math.round(w * scale));
          const sh = Math.max(1, Math.round(h * scale));
          const b = await toBlob(render(img.source, sw, sh), 0.7);
          if (b && b.size <= maxBytes) best = { blob: b, q: 0.7, w: sw, h: sh };
        }
        downscaled = true;
      }
    }
    if (!best) return null;
    // keep the original when it is already within the limit and WebP would not make it smaller
    if (file.size <= maxBytes && best.blob.size >= file.size && file.type !== "image/webp") return null;
    const name = file.name.replace(/\.[^./\\]+$/, "") + ".webp";
    return {
      file: new File([best.blob], name, { type: "image/webp", lastModified: Date.now() }),
      width: best.w,
      height: best.h,
      originalSize: file.size,
      quality: best.q,
      downscaled,
    };
  } finally {
    img.close();
  }
}
