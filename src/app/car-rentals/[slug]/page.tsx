import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Users, Luggage } from "lucide-react";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PageHero from "@/components/hero/PageHero";
import RouteCard from "@/components/cars/RouteCard";
import VehicleGrid from "@/components/cars/VehicleGrid";
import FAQSection from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import EnquiryModal from "@/components/forms/EnquiryModal";
import { buildMetadata } from "@/lib/seo";
import { getVehicle, vehicles } from "@/data/vehicles";
import { routes } from "@/data/routes";
import { homeFaqs } from "@/data/faqs";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return vehicles.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicle(slug);
  if (!vehicle) return {};
  return buildMetadata({
    title: `${vehicle.name} Rental in Siliguri — ${vehicle.capacity}`,
    description: `${vehicle.description} Book a ${vehicle.name} with an experienced driver for transfers, sightseeing and tours across North Bengal & Sikkim.`,
    path: `/car-rentals/${vehicle.slug}`,
    ogImage: vehicle.image,
  });
}

export default async function VehicleDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const vehicle = getVehicle(slug);
  if (!vehicle) notFound();

  const otherVehicles = vehicles.filter((v) => v.slug !== slug).slice(0, 3);
  const vehicleFaqs = homeFaqs.filter((f) =>
    ["Do you provide airport and railway pickup?", "Can I book a private vehicle?"].includes(
      f.question
    )
  );

  return (
    <>
      <PageHero
        title={`${vehicle.name} Rental`}
        subtitle={vehicle.description}
        image={vehicle.image}
        imageAlt={vehicle.imageAlt}
        priority
        compact
      >
        <Breadcrumbs
          items={[
            { name: "Car Rentals", href: "/car-rentals" },
            { name: vehicle.name, href: `/car-rentals/${vehicle.slug}` },
          ]}
        />
      </PageHero>

      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {/* Key facts */}
            <section aria-labelledby="vehicle-facts">
              <h2 id="vehicle-facts" className="font-display text-2xl font-bold sm:text-3xl">
                Vehicle Details
              </h2>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <dt className="flex items-center gap-2 text-sm font-semibold text-muted">
                    <Users className="h-4 w-4 text-primary" aria-hidden />
                    Capacity
                  </dt>
                  <dd className="mt-1.5 font-display text-lg font-bold text-foreground">
                    {vehicle.capacity}
                  </dd>
                </div>
                {vehicle.luggage ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <dt className="flex items-center gap-2 text-sm font-semibold text-muted">
                      <Luggage className="h-4 w-4 text-primary" aria-hidden />
                      Luggage
                    </dt>
                    <dd className="mt-1.5 font-display text-lg font-bold text-foreground">
                      {vehicle.luggage}
                    </dd>
                  </div>
                ) : null}
                <div className="rounded-xl border border-border bg-card p-5 sm:col-span-2">
                  <dt className="text-sm font-semibold text-muted">
                    Common models
                  </dt>
                  <dd className="mt-1.5 text-base text-foreground">
                    {vehicle.models.join(" • ")}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Features */}
            <section aria-labelledby="vehicle-features">
              <h2 id="vehicle-features" className="font-display text-2xl font-bold sm:text-3xl">
                Features & Comfort
              </h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {vehicle.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3.5 text-sm text-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </section>

            {/* Available for */}
            <section aria-labelledby="vehicle-uses">
              <h2 id="vehicle-uses" className="font-display text-2xl font-bold sm:text-3xl">
                Comfortable For
              </h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {vehicle.availableFor.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="font-display text-lg font-bold text-foreground">
                {vehicle.name}
              </p>
              <p className="mt-1 text-sm text-muted">{vehicle.capacity}</p>
              <p className="mt-3 font-display text-xl font-bold text-foreground">
                Get Current Fare
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Fares depend on route, distance and duration.
              </p>
              <div className="mt-5">
                <EnquiryModal
                  label="Get Rental Quote"
                  title={`Book a ${vehicle.name}`}
                  initialValues={{ destination: "Car Rental / Transfer", package: vehicle.name }}
                  className="w-full"
                />
              </div>
            </div>
          </aside>
        </div>
      </Container>

      {/* Popular routes with this vehicle */}
      <section className="bg-card py-14 lg:py-16" aria-labelledby="vehicle-routes">
        <Container>
          <SectionHeading
            eyebrow="Where It Goes"
            title="Popular Routes"
            description={`Routes where the ${vehicle.name} is a favourite.`}
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {routes.slice(0, 3).map((r) => (
              <RouteCard key={r.slug} route={r} />
            ))}
          </div>
        </Container>
      </section>

      <FAQSection faqs={vehicleFaqs} title="Rental FAQs" />

      {/* Other vehicles */}
      <Container className="py-14 lg:py-16">
        <SectionHeading eyebrow="More Options" title="Other Vehicles" />
        <div className="mt-10">
          <VehicleGrid vehicles={otherVehicles} />
        </div>
      </Container>

      <FinalCTA
        title="Ready to hit the road?"
        description="Tell us your route and dates — we'll confirm your vehicle and driver."
      />
    </>
  );
}
