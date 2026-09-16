import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import GuideGrid from "@/components/guides/GuideGrid";
import PackageCard from "@/components/packages/PackageCard";
import FAQSection from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import JsonLd from "@/components/seo/JsonLd";
import { buildMetadata, faqJsonLd } from "@/lib/seo";
import { getGuide, guides } from "@/data/guides";
import { packages } from "@/data/packages";
import { getRouteForDestination } from "@/data/routes";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return buildMetadata({
    title: guide.title,
    description: guide.excerpt,
    path: `/guides/${guide.slug}`,
    ogImage: guide.heroImage,
  });
}

export default async function GuidePage({ params }: { params: Params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const destinationSlug = guide.destination;
  const relatedPackages = packages
    .filter((p) => p.destinationSlug === destinationSlug)
    .slice(0, 3);
  const transferRoute = getRouteForDestination(destinationSlug);
  const otherGuides = guides.filter((g) => g.slug !== slug).slice(0, 3);

  return (
    <>
      {guide.faqs ? <JsonLd data={faqJsonLd(guide.faqs)} /> : null}

      <Container className="py-10 pt-28 lg:pt-32">
        <Breadcrumbs
          items={[
            { name: "Guides", href: "/guides" },
            { name: guide.title, href: `/guides/${guide.slug}` },
          ]}
        />

        <article className="mt-6">
          <header className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Travel Guide
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {guide.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              {guide.excerpt}
            </p>
            {guide.publishedAt ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Published{" "}
                {new Date(guide.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </header>

          <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-xl">
            <Image
              src={guide.heroImage}
              alt={guide.heroImageAlt}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-4">
            <div className="lg:col-span-3">
              {/* TOC */}
              <nav
                aria-label="Table of contents"
                className="rounded-xl border border-border bg-card p-5"
              >
                <p className="text-sm font-semibold text-foreground">
                  In this guide
                </p>
                <ol className="mt-3 space-y-1.5">
                  {guide.content.map((section, i) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {i + 1}. {section.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              {/* Sections */}
              <div className="mt-10 space-y-10">
                {guide.content.map((section) => (
                  <section key={section.id} aria-labelledby={section.id}>
                    <h2
                      id={section.id}
                      className="scroll-mt-24 font-display text-2xl font-bold text-foreground"
                    >
                      {section.heading}
                    </h2>
                    {section.paragraphs.map((p, i) => (
                      <p
                        key={i}
                        className="mt-4 text-base leading-relaxed text-muted"
                      >
                        {p}
                      </p>
                    ))}
                    {section.list ? (
                      <ul className="mt-4 space-y-2">
                        {section.list.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
                          >
                            <span
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary"
                              aria-hidden
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="font-display text-base font-bold">
                  Planning a trip?
                </p>
                <p className="mt-1.5 text-sm text-muted">
                  We operate tours across this region — get a free, no-pressure
                  quote.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Get Free Quote
                </Link>
                <Link
                  href={`/packages/${destinationSlug}`}
                  className="mt-2.5 flex w-full items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  View Packages
                </Link>
                {transferRoute ? (
                  <Link
                    href={`/routes/${transferRoute.slug}`}
                    className="mt-2.5 block rounded-lg px-1 py-1.5 text-center text-xs font-medium text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {transferRoute.from} → {transferRoute.to}: {transferRoute.duration?.replace("~", "approx. ") ?? "private transfer"}
                  </Link>
                ) : null}
              </div>
            </aside>
          </div>
        </article>
      </Container>

      {/* Related packages */}
      {relatedPackages.length > 0 ? (
        <section className="bg-card py-14 lg:py-16" aria-labelledby="guide-packages">
          <Container>
            <SectionHeading
              eyebrow="Ready to Book?"
              title="Related Packages"
              align="left"
            />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPackages.map((p) => (
                <PackageCard key={p.slug} pkg={p} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {guide.faqs && guide.faqs.length > 0 ? (
        <FAQSection faqs={guide.faqs} title="Guide FAQs" />
      ) : null}

      {/* More guides */}
      <Container className="py-14 lg:py-16">
        <SectionHeading eyebrow="Keep Reading" title="More Travel Guides" align="left" />
        <div className="mt-8">
          <GuideGrid guides={otherGuides} />
        </div>
      </Container>

      <FinalCTA />
    </>
  );
}
