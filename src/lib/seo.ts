import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
};

export function buildMetadata({
  title,
  description,
  path,
  ogImage,
}: PageMetaInput): Metadata {
  const url = `${siteConfig.url}${path}`;
  const image =
    ogImage ??
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: siteConfig.legalName,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      postalCode: siteConfig.address.postalCode,
      addressRegion: siteConfig.address.state,
      addressCountry: "IN",
    },
    openingHours: ["Mo-Sa 09:00-20:00", "Su 10:00-18:00"],
    sameAs: [siteConfig.social.facebook, siteConfig.social.instagram],
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.href}`,
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function touristTripJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  itinerary?: { day: number; title: string; activities: string[] }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: opts.name,
    description: opts.description,
    url: `${siteConfig.url}${opts.path}`,
    provider: {
      "@type": "TravelAgency",
      name: siteConfig.legalName,
      url: siteConfig.url,
      telephone: siteConfig.phone,
    },
    ...(opts.itinerary
      ? {
          itinerary: {
            "@type": "ItemList",
            itemListElement: opts.itinerary.map((d) => ({
              "@type": "ListItem",
              position: d.day,
              item: {
                "@type": "TouristAttraction",
                name: `Day ${d.day}: ${d.title}`,
              },
            })),
          },
        }
      : {}),
  };
}
