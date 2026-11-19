/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  // embedded Postgres used for local preview only (loaded at runtime, not bundled)
  serverExternalPackages: ["@electric-sql/pglite"],
  // worker portal: admin file uploads (Vercel itself caps request bodies at ~4.5 MB)
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/:locale(ar|fr)/portal/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
