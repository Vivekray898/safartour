import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, X, BedDouble, Car, Info } from "lucide-react";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PackageHero from "@/components/packages/PackageHero";
import Itinerary from "@/components/packages/Itinerary";
import RelatedPackages from "@/components/packages/RelatedPackages";
import EnquiryModal from "@/components/forms/EnquiryModal";
import FAQSection from "@/components/sections/FAQ";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { siteConfig } from "@/data/site";
import JsonLd from "@/components/seo/JsonLd";
import { buildMetadata, touristTripJsonLd } from "@/lib/seo";
import { getPackage, getRelatedPackages, packages } from "@/data/packages";
import { getDestination } from "@/data/destinations";
import { getWhatsAppUrl, packageEnquiryMessage } from "@/lib/whatsapp";

type Params = Promise<{ slug: string; package: string }>;

export function generateStaticParams() {
  return packages.map((p) => ({
    destination: p.destinationSlug,
    package: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug: destination, package: packageSlug } = await params;
  const pkg = getPackage(packageSlug);
  if (!pkg || pkg.destinationSlug !== destination) return {};
  return buildMetadata({
    title: `${pkg.title} — ${pkg.duration}`,
    description: `${pkg.description} Includes comfortable stays, private transport and sightseeing. Get a free quote from Safar Tours.`,
    path: `/packages/${destination}/${packageSlug}`,
    ogImage: pkg.heroImage,
  });
}

export default async function PackageDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug: destination, package: packageSlug } = await params;
  const pkg = getPackage(packageSlug);
  if (!pkg || pkg.destinationSlug !== destination) notFound();

  const destinationInfo = getDestination(destination);
  const related = getRelatedPackages(pkg);

  return (
    <>
      <JsonLd
        data={touristTripJsonLd({
          name: `${pkg.title} — ${pkg.duration}`,
          description: pkg.description,
          path: `/packages/${destination}/${packageSlug}`,
          itinerary: pkg.itinerary,
        })}
      />

      <PackageHero pkg={pkg} />

      <Container className="py-10 lg:py-12">
        <Breadcrumbs
          items={[
            { name: "Packages", href: "/packages" },
            {
              name: destinationInfo?.name ?? destination,
              href: `/packages/${destination}`,
            },
            { name: `${pkg.title}`, href: `/packages/${destination}/${pkg.slug}` },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-12 lg:col-span-2">
            {/* Quick overview */}
            <section aria-labelledby="overview">
              <h2
                id="overview"
                className="font-display text-2xl font-bold sm:text-3xl"
              >
                Quick Overview
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                {pkg.description}
              </p>
              {pkg.bestFor ? (
                <p className="mt-4 text-sm text-muted">
                  <span className="font-semibold text-foreground">Best for:</span>{" "}
                  {pkg.bestFor}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2">
                {pkg.highlights.map((h) => (
                  <span
                    key={h}
                    className="rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </section>

            {/* Itinerary */}
            <section aria-labelledby="itinerary">
              <h2
                id="itinerary"
                className="font-display text-2xl font-bold sm:text-3xl"
              >
                Day-by-Day Itinerary
              </h2>
              <div className="mt-6">
                <Itinerary days={pkg.itinerary} />
              </div>
            </section>

            {/* Inclusions & Exclusions */}
            <section aria-labelledby="inclusions">
              <h2
                id="inclusions"
                className="font-display text-2xl font-bold sm:text-3xl"
              >
                What&apos;s Included &amp; Not Included
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-base font-semibold text-primary">
                    Inclusions
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {pkg.inclusions.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-foreground"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-base font-semibold text-red-700">
                    Exclusions
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {pkg.exclusions.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-muted"
                      >
                        <X
                          className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Hotels & transport */}
            <section aria-labelledby="stay" className="grid gap-5 sm:grid-cols-2">
              {pkg.hotels ? (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 id="stay" className="flex items-center gap-2 font-display text-base font-semibold">
                    <BedDouble className="h-4 w-4 text-primary" aria-hidden />
                    Hotels / Stay
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {pkg.hotels.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                  <Car className="h-4 w-4 text-primary" aria-hidden />
                  Transportation
                </h3>
                <p className="mt-3 text-sm text-muted">
                  Private vehicle with an experienced hill driver for all
                  transfers and sightseeing mentioned in the itinerary.
                </p>
              </div>
            </section>

            {/* Gallery */}
            <section aria-labelledby="gallery">
              <h2
                id="gallery"
                className="font-display text-2xl font-bold sm:text-3xl"
              >
                Gallery
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {pkg.gallery.map((img) => (
                  <div
                    key={img.src}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl"
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Important info */}
            <section
              aria-labelledby="important-info"
              className="rounded-xl border border-secondary/30 bg-secondary/5 p-5"
            >
              <h2
                id="important-info"
                className="flex items-center gap-2 font-display text-base font-semibold"
              >
                <Info className="h-4 w-4 text-secondary-dark" aria-hidden />
                Important Information
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Prices vary by season, hotel category and group size — request
                a quote for exact rates. High-altitude excursions (Tsomgo Lake,
                Nathula, North Sikkim) require permits and are subject to
                weather and road conditions.
              </p>
            </section>

            {/* FAQ */}
            {pkg.faqs && pkg.faqs.length > 0 ? (
              <div className="-mx-0">
                <FAQSection
                  faqs={pkg.faqs}
                  withSchema
                  title="Package FAQs"
                />
              </div>
            ) : null}
          </div>

          {/* Sidebar - Informative & Contextual */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div
              id="enquiry"
              className="scroll-mt-24 rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                {destinationInfo?.name ?? pkg.destinationSlug} &bull; {pkg.duration}
              </span>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">
                Get Latest Price
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Transparent rates based on your travel season, group size, and hotel category.
              </p>

              <div className="mt-5 space-y-2 border-y border-border py-4 text-xs sm:text-sm text-foreground">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Vehicle</span>
                  <span className="font-medium">Private (dedicated for your party)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Driver</span>
                  <span className="font-medium">Experienced local hill driver</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Stays</span>
                  <span className="font-medium">Handpicked comfortable hotels</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Itinerary</span>
                  <span className="font-medium">Fully customizable</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="w-full">
                  <EnquiryModal
                    label="Ask About This Package"
                    title={`Enquire About ${pkg.title}`}
                    subtitle="Share a few details and we will send you pricing and a day-by-day plan."
                    variant="primary"
                    size="lg"
                    className="w-full"
                    initialValues={{
                      destination: destinationInfo?.name ?? pkg.destinationSlug,
                      package: `${pkg.title} (${pkg.duration})`,
                    }}
                  />
                </div>

                <Link
                  href={getWhatsAppUrl(
                    packageEnquiryMessage(pkg.title, pkg.duration)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#25D366]" aria-hidden>
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.25 8.25 0 0 1-3.95-1l-.28-.17-2.98.78.8-2.9-.19-.3a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm-2.5 3.16c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01z" />
                  </svg>
                  Chat on WhatsApp
                </Link>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Prefer to call?{" "}
                <a href={`tel:${siteConfig.phone}`} className="font-semibold text-primary hover:underline">
                  {siteConfig.phoneDisplay}
                </a>
              </p>
            </div>
          </aside>
        </div>
      </Container>

      {/* Related packages */}
      <section className="bg-card py-14 lg:py-16">
        <Container>
          <SectionHeading
            eyebrow="Keep Exploring"
            title="Related Packages"
          />
          <div className="mt-10">
            <RelatedPackages packages={related} />
          </div>
        </Container>
      </section>
    </>
  );
}
