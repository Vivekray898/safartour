import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import { destinations } from "@/data/destinations";
import { packages } from "@/data/packages";
import { vehicles } from "@/data/vehicles";
import { routes } from "@/data/routes";
import { guides } from "@/data/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/packages`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/car-rentals`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/routes`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about-us`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const destinationPages: MetadataRoute.Sitemap = destinations.map((d) => ({
    url: `${base}/packages/${d.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const packagePages: MetadataRoute.Sitemap = packages.map((p) => ({
    url: `${base}/packages/${p.destinationSlug}/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const vehiclePages: MetadataRoute.Sitemap = vehicles.map((v) => ({
    url: `${base}/car-rentals/${v.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const routePages: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${base}/routes/${r.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const guidePages: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${base}/guides/${g.slug}`,
    lastModified: g.publishedAt ? new Date(g.publishedAt) : now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...destinationPages,
    ...packagePages,
    ...vehiclePages,
    ...routePages,
    ...guidePages,
  ];
}
