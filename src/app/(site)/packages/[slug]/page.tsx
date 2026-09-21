import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PageHero from "@/components/hero/PageHero";
import PackageGrid from "@/components/packages/PackageGrid";
import GuideCard from "@/components/guides/GuideCard";
import FAQSection from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { buildMetadata } from "@/lib/seo";
import { destinations, getDestination } from "@/data/destinations";
import { getPackagesByDestination } from "@/data/packages";
import { guides } from "@/data/guides";
import { homeFaqs } from "@/data/faqs";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = getDestination(slug);
  if (!destination) return {};
  return buildMetadata({
    title: `${destination.name} Tour Packages`,
    description: `Explore ${destination.name} tour packages with comfortable stays, sightseeing and reliable transportation. ${destination.shortDescription}`,
    path: `/packages/${destination.slug}`,
    ogImage: destination.heroImage,
  });
}

export default async function DestinationPage({ params }: { params: Params }) {
  const { slug } = await params;
  const destination = getDestination(slug);
  if (!destination) notFound();

  const destinationPackages = getPackagesByDestination(slug);
  const relatedGuides = guides.filter((g) => g.destination === slug).slice(0, 3);
  const attractionFaqs = homeFaqs.slice(0, 4);

  return (
    <>
      <PageHero
        title={`${destination.name} Tour Packages`}
        subtitle={destination.shortDescription}
        image={destination.heroImage}
        imageAlt={destination.heroImageAlt}
        priority
      >
        <Breadcrumbs
          items={[
            { name: "Packages", href: "/packages" },
            { name: destination.name, href: `/packages/${destination.slug}` },
          ]}
        />
      </PageHero>

      <Container className="py-12 lg:py-16">
        {/* About */}
        <section aria-labelledby="about-destination" className="max-w-3xl">
          <h2 id="about-destination" className="font-display text-2xl font-bold sm:text-3xl">
            About {destination.name}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            {destination.description}
          </p>
        </section>

        {/* Attractions */}
        <section aria-labelledby="attractions" className="mt-14">
          <h2 id="attractions" className="font-display text-2xl font-bold sm:text-3xl">
            Places to Visit in {destination.name}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destination.attractions.map((a) => (
              <div
                key={a.name}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <h3 className="font-display text-base font-semibold text-foreground">
                  {a.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {a.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Container>

      {/* Available Packages */}
      {destinationPackages.length > 0 ? (
        <section
          aria-labelledby="destination-packages"
          className="bg-card py-14 lg:py-16"
        >
          <Container>
            <SectionHeading
              eyebrow="Itineraries"
              title={`${destination.name} Tour Packages`}
              description="Choose a ready plan or ask us to tailor one around your dates."
            />
            <div className="mt-10">
              <PackageGrid packages={destinationPackages} />
            </div>
          </Container>
        </section>
      ) : null}

      <Container className="py-12 lg:py-16">
        {/* Best time */}
        {destination.bestTime ? (
          <section aria-labelledby="best-time" className="max-w-3xl">
            <h2 id="best-time" className="font-display text-2xl font-bold sm:text-3xl">
              Best Time to Visit {destination.name}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              {destination.bestTime}
            </p>
          </section>
        ) : null}

        {/* Gallery */}
        <section aria-labelledby="gallery" className="mt-14">
          <h2 id="gallery" className="font-display text-2xl font-bold sm:text-3xl">
            {destination.name} Gallery
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {destination.gallery.map((img) => (
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
      </Container>

      {/* Related guides */}
      {relatedGuides.length > 0 ? (
        <section aria-labelledby="related-guides" className="bg-card py-14 lg:py-16">
          <Container>
            <SectionHeading
              eyebrow="Plan Smarter"
              title={`${destination.name} Travel Guides`}
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedGuides.map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <FAQSection
        faqs={attractionFaqs}
        withSchema
        title={`${destination.name} — Frequently Asked Questions`}
      />

      <FinalCTA
        title={`Ready to explore ${destination.name}?`}
        description="Tell us your dates and group size — we'll send a tailored quote."
      />
    </>
  );
}
