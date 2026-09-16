import Hero from "@/components/hero/Hero";
import TrustIntro from "@/components/sections/TrustIntro";
import PackageGrid from "@/components/packages/PackageGrid";
import DestinationGrid from "@/components/destinations/DestinationGrid";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import CustomTourCTA from "@/components/sections/CustomTourCTA";
import HumanAssistance from "@/components/sections/HumanAssistance";
import Testimonials from "@/components/sections/Testimonials";
import FAQSection from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import VehicleGrid from "@/components/cars/VehicleGrid";
import GuideGrid from "@/components/guides/GuideGrid";
import Button from "@/components/ui/Button";
import JsonLd from "@/components/seo/JsonLd";
import { buildMetadata, organizationJsonLd } from "@/lib/seo";
import { packages } from "@/data/packages";
import { destinations } from "@/data/destinations";
import { vehicles } from "@/data/vehicles";
import { guides } from "@/data/guides";
import { homeFaqs } from "@/data/faqs";

export const metadata = buildMetadata({
  title: "Sikkim, Darjeeling & Northeast India Tour Packages",
  description:
    "Safar Tours & Travels — thoughtfully planned tour packages, car rentals, airport & railway transfers across Sikkim, Darjeeling, Kalimpong, Dooars and Northeast India.",
  path: "/",
});

export default function Home() {
  // Show 4 representative packages
  const popularPackages = packages.slice(0, 4);

  // 6 balanced destinations
  const featuredDestinations = destinations.filter((d) =>
    ["darjeeling", "sikkim", "kalimpong", "dooars", "meghalaya", "arunachal-pradesh"].includes(
      d.slug
    )
  );

  return (
    <>
      <JsonLd data={organizationJsonLd()} />

      <main className="pb-16 lg:pb-0">
        {/* 1. Hero */}
        <Hero />

        {/* 2. Trust / Introduction */}
        <TrustIntro />

        {/* 3. Popular Destinations */}
        <section
          id="destinations"
          className="scroll-mt-20 py-14 sm:py-16 md:py-20"
          aria-labelledby="destinations-heading"
        >
          <Container>
            <SectionHeading
              eyebrow="Where We Go"
              title="Explore Popular Destinations"
              description="From quiet hill stations and pine forests to high-altitude mountain valleys."
            />
            <div className="mt-10">
              <DestinationGrid destinations={featuredDestinations} />
            </div>
          </Container>
        </section>

        {/* 4. Popular Packages */}
        <section className="border-t border-border bg-card py-14 sm:py-16 md:py-20" aria-labelledby="packages-heading">
          <Container>
            <SectionHeading
              eyebrow="Popular Trips"
              title="Featured Holiday Packages"
              description="Complete journeys with private transportation, handpicked stays, and flexible pacing."
            />
            <div className="mt-10">
              <PackageGrid packages={popularPackages} />
            </div>
            <div className="mt-10 text-center">
              <Button href="/packages" variant="outline" size="lg">
                View All Packages &rarr;
              </Button>
            </div>
          </Container>
        </section>

        {/* 5. Why Travel with Safar Tours */}
        <WhyChooseUs />

        {/* 6. Custom Trips */}
        <CustomTourCTA />

        {/* 7. Car Rentals */}
        <section className="border-t border-border bg-card py-14 sm:py-16 md:py-20" aria-labelledby="cars-heading">
          <Container>
            <SectionHeading
              eyebrow="Private Transportation"
              title="Our Fleet for Every Trip"
              description="From nimble hatchbacks to group tempo travellers — every rental includes an experienced hill driver."
            />
            <div className="mt-10">
              <VehicleGrid vehicles={vehicles.slice(0, 3)} />
            </div>
            <div className="mt-10 text-center">
              <Button href="/car-rentals" variant="outline" size="lg">
                Explore All Car Rentals &rarr;
              </Button>
            </div>
          </Container>
        </section>

        {/* 8. Travel Guides */}
        <section className="py-14 sm:py-16 md:py-20" aria-labelledby="guides-heading">
          <Container>
            <SectionHeading
              eyebrow="Travel Advice"
              title="Destination Guides"
              description="Practical advice from our local team — best travel seasons, routes, and mountain insights."
            />
            <div className="mt-10">
              <GuideGrid guides={guides.slice(0, 3)} />
            </div>
            <div className="mt-10 text-center">
              <Button href="/guides" variant="outline" size="lg">
                All Travel Guides &rarr;
              </Button>
            </div>
          </Container>
        </section>

        {/* Human Contact Touchpoint */}
        <HumanAssistance />

        {/* 9. Testimonials */}
        <Testimonials />

        {/* 10. FAQ */}
        <FAQSection
          faqs={homeFaqs}
          withSchema
          eyebrow="Common Questions"
          title="Frequently Asked Questions"
          description="Clear answers about booking, mountain travel, and our services."
        />

        {/* 11. Final CTA */}
        <FinalCTA />
      </main>
    </>
  );
}
