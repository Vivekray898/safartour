import type { NextConfig } from "next";

const redirects = [
  // Legacy /pages/* URLs
  { source: "/pages/contact", destination: "/contact", permanent: true },
  { source: "/pages/gallery", destination: "/gallery", permanent: true },
  { source: "/pages/car-rentals", destination: "/car-rentals", permanent: true },
  { source: "/pages/about-us", destination: "/about-us", permanent: true },
  {
    source: "/pages/best-travel-agency-in-siliguri",
    destination: "/about-us",
    permanent: true,
  },
  { source: "/pages/christmas", destination: "/packages", permanent: true },
  // Legacy guide URLs → new guide slugs
  {
    source: "/guides/darjeeling-tour-guide",
    destination: "/guides/darjeeling-travel-guide",
    permanent: true,
  },
  {
    source: "/guides/sikkim-tour-guide",
    destination: "/guides/sikkim-travel-guide",
    permanent: true,
  },
  {
    source: "/guides/kalimpong-tour-guide",
    destination: "/guides/kalimpong-travel-guide",
    permanent: true,
  },
  {
    source: "/guides/sikkim-darjeeling-tour-guide",
    destination: "/guides/sikkim-darjeeling-travel-guide",
    permanent: true,
  },
  {
    source: "/guides/darjeeling-kalimpong-tour-guide",
    destination: "/guides/darjeeling-kalimpong-travel-guide",
    permanent: true,
  },
  {
    source: "/guides/sikkim-kalimpong-tour-guide",
    destination: "/guides/sikkim-kalimpong-travel-guide",
    permanent: true,
  },
];

// Baseline security headers. Kept small and boring on purpose: enough to
// close the obvious holes, nothing that breaks the site.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    // Everything the site actually needs: its own styles, Google Fonts, the
    // Unsplash images behind next/image, the WhatsApp deep link and Supabase.
    // 'unsafe-inline' for styles is required by Tailwind v4 and next/font.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src 'self' https://www.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Phase 3 will serve CMS media from Supabase Storage.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // The CRM must never be cached by a CDN or the browser.
        source: "/crm/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
  async redirects() {
    return redirects;
  },
};

export default nextConfig;
