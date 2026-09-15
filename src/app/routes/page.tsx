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
    "Private taxi transfers between Bagdogra Airport, NJP station, Darjeeling, Gangtok, Pelling and more. Get current fares from Safar Tours.",
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
        title="Transfer Routes Across the Region"
        subtitle="Private, fixed-price-quote transfers between airports, railway stations and every major hill destination."
        image={images.carRental.src}
        imageAlt={images.carRental.alt}
        priority
        compact
      >
        <Breadcrumbs items={[{ name: "Routes", href: "/routes" }]} />
      </PageHero>

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
