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

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return redirects;
  },
};

export default nextConfig;
