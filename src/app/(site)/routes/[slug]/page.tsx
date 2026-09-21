import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PageHero from "@/components/hero/PageHero";
import VehicleGrid from "@/components/cars/VehicleGrid";
import FAQSection from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import EnquiryModal from "@/components/forms/EnquiryModal";
import { buildMetadata } from "@/lib/seo";
import {
  getRoute,
  getRelatedRoutes,
  getDestinationForRoute,
  routes,
} from "@/data/routes";
import { vehicles as allVehicles } from "@/data/vehicles";
import { getWhatsAppUrl, routeEnquiryMessage } from "@/lib/whatsapp";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return routes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const route = getRoute(slug);
  if (!route) return {};
  return buildMetadata({
    title: route.title,
    description: `${route.description} Private ${route.routeType.toLowerCase()} with an experienced driver. Get current fare from Safar Tours.`,
    path: `/routes/${route.slug}`,
    ogImage: route.heroImage,
  });
}

export default async function RouteDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const route = getRoute(slug);
  if (!route) notFound();

  const recommended = route.recommendedVehicles
    .map((vSlug) => allVehicles.find((v) => v.slug === vSlug))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
  const destinationSlug = getDestinationForRoute(route.slug);
  const relatedRoutes = getRelatedRoutes(route.slug);

  return (
    <>
      <PageHero
        title={route.title}
        subtitle={route.description}
        image={route.heroImage}
        imageAlt={route.heroImageAlt}
        priority
        compact
      >
        <Breadcrumbs
          items={[
            { name: "Routes", href: "/routes" },
            { name: `${route.from} → ${route.to}`, href: `/routes/${route.slug}` },
          ]}
        />
      </PageHero>

      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {/* Overview */}
            <section aria-labelledby="route-overview">
              <h2 id="route-overview" className="font-display text-2xl font-bold sm:text-3xl">
                Route Overview
              </h2>
              <div className="mt-6 flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    From
                  </p>
                  <p className="mt-1 flex items-center gap-2 font-display text-lg font-bold text-foreground">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden />
                    {route.from}
                  </p>
                </div>
                <ArrowRight className="hidden h-6 w-6 rotate-90 text-secondary sm:rotate-0" aria-hidden />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    To
                  </p>
                  <p className="mt-1 flex items-center gap-2 font-display text-lg font-bold text-foreground">
                    <MapPin className="h-4 w-4 text-secondary" aria-hidden />
                    {route.to}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 px-4 py-2 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    <Clock className="mr-1 inline h-3 w-3" aria-hidden />
                    Trip Type
                  </p>
                  <p className="text-sm font-bold text-primary-dark">
                    {route.routeType}
                  </p>
                </div>
              </div>
              {route.distance || route.duration ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {route.distance ? (
                    <span className="rounded-lg bg-card px-3 py-1.5 font-medium text-foreground">
                      {route.distance}
                    </span>
                  ) : null}
                  {route.duration ? (
                    <span className="rounded-lg bg-card px-3 py-1.5 font-medium text-foreground">
                      <Clock className="mr-1 inline h-3.5 w-3.5 text-primary" aria-hidden />
                      approx. {route.duration.replace("~", "")} drive
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    Times vary with season and traffic — your quote includes the day&apos;s conditions.
                  </span>
                </div>
              ) : null}
              {route.journeyNote ? (
                <p className="mt-3 text-sm leading-relaxed text-muted">{route.journeyNote}</p>
              ) : null}
            </section>

            {/* Pickup / drop */}
            <section aria-labelledby="route-points" className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-base font-semibold">
                  Pickup Points
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {route.pickupPoints.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-base font-semibold">
                  Drop Points
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {route.dropPoints.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Popular stops */}
            <section aria-labelledby="route-stops">
              <h2 id="route-stops" className="font-display text-2xl font-bold sm:text-3xl">
                Popular Stops Along the Way
              </h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {route.popularStops.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-medium text-secondary-dark"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Why book */}
            <section aria-labelledby="route-why" className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <h2 id="route-why" className="font-display text-lg font-bold text-foreground">
                Why book this transfer with us?
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-muted">
                <li>• Fixed quote agreed before you travel — no surge, no haggling</li>
                <li>• Experienced hill drivers who know the route in every season</li>
                <li>• Flight and train tracking for arrivals, so delays never leave you stranded</li>
                <li>• Door-to-door service to your exact hotel or address</li>
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="font-display text-lg font-bold text-foreground">
                Get Current Fare
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Fares vary by vehicle and season — we reply with an exact quote.
              </p>
              <div className="mt-5">
                <EnquiryModal
                  label="Get Quote"
                  title={`${route.from} → ${route.to}`}
                  formType="car"
                  initialValues={{
                    destination: "Car Rental / Transfer",
                    package: `Transfer: ${route.from} → ${route.to}`,
                  }}
                  className="w-full"
                />
              </div>
              <a
                href={getWhatsAppUrl(routeEnquiryMessage(route.from, route.to))}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1da851] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
              >
                WhatsApp Us
              </a>
            </div>
          </aside>
        </div>
      </Container>

      {/* Make it a full trip */}
      <Container className="py-12 lg:py-14">
        <h2 className="font-display text-xl font-bold sm:text-2xl">
          Make it a full trip
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {destinationSlug ? (
            <Link
              href={`/packages/${destinationSlug}`}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Tours
              </p>
              <p className="mt-1.5 font-display text-base font-bold text-foreground">
                {route.to} tour packages
              </p>
              <p className="mt-1 text-sm text-muted">
                Ready-made itineraries that start with this transfer.
              </p>
            </Link>
          ) : null}
          <Link
            href="/car-rentals"
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Vehicles
            </p>
            <p className="mt-1.5 font-display text-base font-bold text-foreground">
              Keep the car for your whole trip
            </p>
            <p className="mt-1 text-sm text-muted">
              Multi-day rentals with the same driver throughout.
            </p>
          </Link>
          {relatedRoutes.map((r) => (
            <Link
              key={r.slug}
              href={`/routes/${r.slug}`}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Related transfer
              </p>
              <p className="mt-1.5 font-display text-base font-bold text-foreground">
                {r.from} → {r.to}
              </p>
              <p className="mt-1 text-sm text-muted">
                {r.duration ? `approx. ${r.duration.replace("~", "")}` : "Private transfer"}
              </p>
            </Link>
          ))}
        </div>
      </Container>

      {/* Recommended vehicles */}
      {recommended.length > 0 ? (
        <section className="bg-card py-14 lg:py-16" aria-labelledby="route-vehicles">
          <Container>
            <h2 id="route-vehicles" className="font-display text-2xl font-bold sm:text-3xl">
              Recommended Vehicles
            </h2>
            <div className="mt-8">
              <VehicleGrid vehicles={recommended} />
            </div>
          </Container>
        </section>
      ) : null}

      {route.faqs && route.faqs.length > 0 ? (
        <FAQSection faqs={route.faqs} title="Route FAQs" />
      ) : null}

      <FinalCTA
        title={`Travelling ${route.from} → ${route.to}?`}
        description="Message us your arrival time — we'll be waiting."
      />
    </>
  );
}
