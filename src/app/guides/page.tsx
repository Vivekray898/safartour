import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PageHero from "@/components/hero/PageHero";
import GuideGrid from "@/components/guides/GuideGrid";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { buildMetadata } from "@/lib/seo";
import { guides } from "@/data/guides";
import { images } from "@/data/images";

export const metadata = buildMetadata({
  title: "Travel Guides — Sikkim, Darjeeling & Northeast India",
  description:
    "Practical destination guides from the Safar Tours team — best times to visit, how to reach, permits and local tips for the Eastern Himalaya.",
  path: "/guides",
  ogImage: images.guides.src,
});

export default function GuidesPage() {
  const [featured, ...rest] = guides;

  return (
    <>
      <PageHero
        title="Travel Guides & Inspiration"
        subtitle="Destination knowledge from a team that drives these roads every week."
        image={images.guides.src}
        imageAlt={images.guides.alt}
        priority
        compact
      >
        <Breadcrumbs items={[{ name: "Guides", href: "/guides" }]} />
      </PageHero>

      {/* Featured */}
      <Container className="py-12 lg:py-16">
        <SectionHeading eyebrow="Editor's Pick" title="Featured Guide" align="left" />
        <article className="mt-8 grid overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:grid-cols-2">
          <div className="relative min-h-[260px] lg:min-h-[340px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.heroImage}
              alt={featured.heroImageAlt}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
          </div>
          <div className="flex flex-col justify-center p-7 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Featured Guide
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground lg:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              {featured.excerpt}
            </p>
            <a
              href={`/guides/${featured.slug}`}
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Read the Guide
            </a>
          </div>
        </article>
      </Container>

      {/* All guides */}
      <Container className="pb-14 lg:pb-20">
        <SectionHeading eyebrow="Keep Reading" title="All Destination Guides" align="left" />
        <div className="mt-8">
          <GuideGrid guides={rest} />
        </div>
      </Container>

      <FinalCTA
        title="Turn inspiration into an itinerary"
        description="Tell us which destinations caught your eye — we'll plan the route."
      />
    </>
  );
}
