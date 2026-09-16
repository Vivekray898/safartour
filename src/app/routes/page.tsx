import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PageHero from "@/components/hero/PageHero";
import RouteCard from "@/components/cars/RouteCard";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/data/routes";
import { images } from "@/data/images";

export const metadata = buildMetadata({
  title: "Taxi Routes & Transfers — Bagdogra, NJP, Darjeeling, Gangtok",
  description:
    "Route guide for private transfers between Bagdogra Airport, NJP station, Darjeeling, Gangtok, Kalimpong, the Dooars and more — journey times, vehicle options and current fares from Safar Tours.",
  path: "/routes",
  ogImage: images.carRental.src,
});

const groups = [
  { label: "Airport Transfers", type: "Airport Transfer" as const },
  { label: "Railway Transfers", type: "Railway Transfer" as const },
  { label: "Between Destinations", type: "Inter-city" as const },
];

export default function RoutesPage() {
  return (
    <>
      <PageHero
        title="Route & Fare Guide"
        subtitle="Private, fixed-quote transfers between Bagdogra Airport, NJP station and every major destination — with realistic journey times so you can plan your day."
        image={images.carRental.src}
        imageAlt={images.carRental.alt}
        priority
        compact
      >
        <Breadcrumbs items={[{ name: "Routes", href: "/routes" }]} />
      </PageHero>

      {/* How quoting works — the honest alternative to published price tables */}
      <Container className="pt-10 lg:pt-12">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-7">
          <h2 className="font-display text-lg font-bold text-foreground">
            How our fares work
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            We quote each transfer individually rather than publishing fixed
            prices, because the right fare depends on your vehicle, season, and
            exact pickup point. Every quote is agreed before you travel — no
            surge, no haggling at the station. Tell us your route and we reply
            with the current fare, usually within a few hours.
          </p>
        </div>
      </Container>

      {groups.map((group) => {
        const groupRoutes = routes.filter((r) => r.routeType === group.type);
        if (groupRoutes.length === 0) return null;
        return (
          <Container key={group.type} className="py-12 lg:py-14">
            <SectionHeading
              eyebrow={group.label}
              title={group.label}
              align="left"
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {groupRoutes.map((r) => (
                <RouteCard key={r.slug} route={r} />
              ))}
            </div>
          </Container>
        );
      })}

      <FinalCTA
        title="Need a route that's not listed?"
        description="We drive the whole region — tell us your pickup and drop points for a quick quote."
      />
    </>
  );
}
