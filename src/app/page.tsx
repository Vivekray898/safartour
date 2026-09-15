import Hero from "@/components/hero/Hero";
import TripSearch from "@/components/hero/TripSearch";
import Stats from "@/components/sections/Stats";
import PackageGrid from "@/components/packages/PackageGrid";
import DestinationGrid from "@/components/destinations/DestinationGrid";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import CustomTourCTA from "@/components/sections/CustomTourCTA";
import HowItWorks from "@/components/sections/HowItWorks";
import Testimonials from "@/components/sections/Testimonials";
import FAQSection from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";
import TrustStrip from "@/components/sections/TrustStrip";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import VehicleGrid from "@/components/cars/VehicleGrid";
import RouteCard from "@/components/cars/RouteCard";
import GuideGrid from "@/components/guides/GuideGrid";
import Button from "@/components/ui/Button";
import JsonLd from "@/components/seo/JsonLd";
import { buildMetadata, organizationJsonLd } from "@/lib/seo";
import { packages } from "@/data/packages";
import { destinations } from "@/data/destinations";
import { vehicles } from "@/data/vehicles";
import { routes } from "@/data/routes";
import { guides } from "@/data/guides";
import { homeFaqs } from "@/data/faqs";

export const metadata = buildMetadata({
  title: "Sikkim, Darjeeling & Northeast India Tour Packages",
  description:
    "Safar Tours & Travels — tour packages, car rentals, airport & railway transfers and sightseeing across Sikkim, Darjeeling, Kalimpong, Dooars and Northeast India. Plan your Himalayan journey today.",
  path: "/",
});

export default function Home() {
  const popularPackages = packages.slice(0, 6);
  const featuredDestinations = destinations.filter((d) =>
    ["darjeeling", "sikkim", "kalimpong", "dooars", "meghalaya", "arunachal-pradesh"].includes(
      d.slug
    )
  );

  return (
    <>
      <JsonLd data={organizationJsonLd()} />

      <main className="pb-20 lg:pb-0">
        <Hero />

        {/* Overlapping trip search card */}
        <div className="relative z-10 mx-auto -mt-16 w-full max-w-5xl px-4 sm:px-6 lg:-mt-20">
          <TripSearch />
        </div>

        <TrustStrip />
        <Stats />

        {/* Explore Destinations — asymmetric grid */}
        <section className="bg-card py-16 md:py-20 lg:py-24" aria-labelledby="destinations-heading">
          <Container>
            <SectionHeading
              eyebrow="Where We Go"
              title="Explore the Himalayas"
              description="From misty hill stations to high-altitude mountain escapes, discover destinations worth travelling for."
            />
            <div className="mt-12">
              <DestinationGrid destinations={featuredDestinations} />
            </div>
          </Container>
        </section>

        {/* Popular Packages */}
        <section className="py-16 md:py-20 lg:py-24" aria-labelledby="packages-heading">
          <Container>
            <SectionHeading
              eyebrow="Handpicked Journeys"
              title="Trips People Love"
              description="Handpicked journeys designed for unforgettable mountain escapes — private vehicles, comfortable stays and flexible dates."
            />
            <div className="mt-12">
              <PackageGrid packages={popularPackages} />
            </div>
            <div className="mt-10 text-center">
              <Button href="/packages" variant="outline" size="lg">
                View All Packages
              </Button>
            </div>
          </Container>
        </section>

        <WhyChooseUs />

        <CustomTourCTA />

        {/* Car Rentals */}
        <section className="py-16 md:py-20 lg:py-24" aria-labelledby="cars-heading">
          <Container>
            <SectionHeading
              eyebrow="Travel Your Way"
              title="Your Journey, Your Ride"
              description="Comfortable vehicles for airport transfers, sightseeing and long-distance journeys — always with an experienced hill driver."
            />
            <div className="mt-12">
              <VehicleGrid vehicles={vehicles.slice(0, 6)} />
            </div>
            <div className="mt-10 text-center">
              <Button href="/car-rentals" variant="outline" size="lg">
                Explore Car Rentals
              </Button>
            </div>
          </Container>
        </section>

        <HowItWorks />

        {/* Popular Routes */}
        <section className="bg-card py-16 md:py-20 lg:py-24" aria-labelledby="routes-heading">
          <Container>
            <SectionHeading
              eyebrow="Door to Door"
              title="Popular Transfer Routes"
              description="Private taxi transfers from Bagdogra Airport and NJP station to every major destination."
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {routes.slice(0, 6).map((r) => (
                <RouteCard key={r.slug} route={r} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button href="/routes" variant="outline" size="lg">
                View All Routes
              </Button>
            </div>
          </Container>
        </section>

        {/* Travel Guides */}
        <section className="py-16 md:py-20 lg:py-24" aria-labelledby="guides-heading">
          <Container>
            <SectionHeading
              eyebrow="Travel Inspiration"
              title="Travel Guides"
              description="Destination knowledge from a local team — best times, routes and practical tips."
            />
            <div className="mt-12">
              <GuideGrid guides={guides.slice(0, 3)} />
            </div>
            <div className="mt-10 text-center">
              <Button href="/guides" variant="outline" size="lg">
                All Travel Guides
              </Button>
            </div>
          </Container>
        </section>

        <Testimonials />

        <FAQSection
          faqs={homeFaqs}
          withSchema
          eyebrow="Good to Know"
          description="Quick answers about travelling with Safar Tours."
        />

        <FinalCTA
          title="Where will you go next?"
          description="Let's plan your Himalayan escape."
        />
      </main>
    </>
  );
}
