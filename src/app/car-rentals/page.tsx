import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PageHero from "@/components/hero/PageHero";
import VehicleGrid from "@/components/cars/VehicleGrid";
import RouteCard from "@/components/cars/RouteCard";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import FAQSection from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import EnquiryModal from "@/components/forms/EnquiryModal";
import { buildMetadata } from "@/lib/seo";
import { images } from "@/data/images";
import { vehicles } from "@/data/vehicles";
import { routes } from "@/data/routes";
import { homeFaqs } from "@/data/faqs";

export const metadata = buildMetadata({
  title: "Car Rentals & Taxi Services in Siliguri, North Bengal & Sikkim",
  description:
    "Rent well-maintained SUVs, sedans, tempo travellers and buses with experienced hill drivers. Airport & railway transfers, sightseeing and multi-day tours across North Bengal and Sikkim.",
  path: "/car-rentals",
  ogImage: images.carRental.src,
});

const transferServices = [
  {
    title: "Airport Transfers",
    description:
      "Pickup and drop at Bagdogra Airport (IXB) with flight tracking and meet-and-greet at the arrival gate.",
  },
  {
    title: "Railway Transfers",
    description:
      "NJP station pickups with platform-side meeting points — no haggling, no waiting.",
  },
  {
    title: "Sightseeing",
    description:
      "Full-day and half-day sightseeing packages across Darjeeling, Gangtok, Kalimpong and the Dooars.",
  },
  {
    title: "Custom Transfers",
    description:
      "Multi-city itineraries, wedding logistics, corporate movement and group departures — planned end to end.",
  },
];

const carFaqs = homeFaqs.filter((f) =>
  ["Do you provide car rentals?", "Do you provide airport and railway pickup?", "Can I book a private vehicle?"].includes(
    f.question
  )
);

export default function CarRentalsPage() {
  return (
    <>
      <PageHero
        title="Reliable Car Rentals Across North Bengal & Sikkim"
        subtitle="Well-maintained vehicles, experienced hill drivers and transparent quotes — from airport pickups to multi-day mountain tours."
        image={images.carRental.src}
        imageAlt={images.carRental.alt}
        priority
      >
        <Breadcrumbs items={[{ name: "Car Rentals", href: "/car-rentals" }]} />
      </PageHero>

      {/* Vehicle categories */}
      <Container className="py-12 lg:py-16">
        <SectionHeading
          eyebrow="Our Fleet"
          title="Vehicle Categories"
          description="Choose the right vehicle for your group size, route and budget."
        />
        <div className="mt-10">
          <VehicleGrid vehicles={vehicles} />
        </div>
      </Container>

      {/* Transfer services */}
      <section className="bg-card py-14 lg:py-16" aria-labelledby="transfers-heading">
        <Container>
          <SectionHeading
            eyebrow="Beyond Rentals"
            title="Transfers & Services"
            description="Every journey starts and ends with a transfer — we make sure it's the easiest part of your trip."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {transferServices.map((s) => (
              <div
                key={s.title}
                className="rounded-xl border border-border bg-background p-5 shadow-sm"
              >
                <h3 className="font-display text-base font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <EnquiryModal
              label="Get Rental Quote"
              title="Get Rental Quote"
              formType="car"
              initialValues={{ destination: "Car Rental / Transfer" }}
            />
          </div>
        </Container>
      </section>

      {/* Popular routes */}
      <Container className="py-14 lg:py-16">
        <SectionHeading
          eyebrow="Point to Point"
          title="Popular Routes"
          description="Fixed, reliable transfers between the region's airports, stations and hill destinations."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      <WhyChooseUs />

      <FAQSection faqs={carFaqs} eyebrow="Car Rental Questions" />

      <FinalCTA
        title="Need a vehicle for your trip?"
        description="Tell us your route and dates — we'll send the right car with the right driver."
      />
    </>
  );
}
