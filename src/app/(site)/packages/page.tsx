import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PackagesFilter from "@/components/packages/PackagesFilter";
import CustomTourCTA from "@/components/sections/CustomTourCTA";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { packages } from "@/data/packages";

export const metadata = buildMetadata({
  title: "Tour Packages — Sikkim, Darjeeling, Kalimpong & More",
  description:
    "Browse Safar Tours holiday packages for Sikkim, Darjeeling, Kalimpong and combined Himalayan circuits. Private vehicles, handpicked stays, customisable itineraries.",
  path: "/packages",
});

export default function PackagesPage() {
  return (
    <>
      <Container className="py-12 pt-28 lg:py-16 lg:pt-32">
        <Breadcrumbs items={[{ name: "Packages", href: "/packages" }]} />

        <div className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Tour Packages
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Every itinerary below is operated by our own team with a private
            vehicle and handpicked stays — and each one can be customised
            around your dates, budget and pace.
          </p>
        </div>

        <div className="mt-8">
          <PackagesFilter packages={packages} />
        </div>
      </Container>

      <CustomTourCTA />
      <FinalCTA />
    </>
  );
}
