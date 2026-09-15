import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, X, BedDouble, Car, Info } from "lucide-react";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PackageHero from "@/components/packages/PackageHero";
import Itinerary from "@/components/packages/Itinerary";
import RelatedPackages from "@/components/packages/RelatedPackages";
import EnquiryForm from "@/components/forms/EnquiryForm";
import FAQSection from "@/components/sections/FAQ";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
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

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted">
                {pkg.duration} ·{" "}
                {destinationInfo?.name ?? pkg.destinationSlug}
              </p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">
                Get Latest Price
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Share your dates &amp; group size for an exact quote.
              </p>
              <div className="mt-5" id="enquiry">
                <EnquiryForm
                  compact
                  initialValues={{
                    destination: destinationInfo?.name ?? "",
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
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1da851] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1da851]"
              >
                Get Quote on WhatsApp
              </Link>
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
