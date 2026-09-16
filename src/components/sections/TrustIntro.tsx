import { MapPin, ShieldCheck, PhoneCall, Plane, TrainFront, Car, ArrowRight } from "lucide-react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import RouteCard from "@/components/cars/RouteCard";
import { siteConfig } from "@/data/site";
import { getRoute } from "@/data/routes";

export default function TrustIntro() {
  const startRoutes = [
    "njp-to-darjeeling",
    "njp-to-gangtok",
    "bagdogra-airport-to-darjeeling",
    "siliguri-to-dooars",
  ]
    .map((slug) => getRoute(slug))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const pickupPoints = [
    {
      icon: Plane,
      name: "Bagdogra Airport (IXB)",
      note: "Driver waits at arrivals with flight tracking",
    },
    {
      icon: TrainFront,
      name: "New Jalpaiguri (NJP)",
      note: "Platform-side meeting, no haggling",
    },
    {
      icon: Car,
      name: "Siliguri & hotels",
      note: "Door pickup anywhere in town",
    },
  ];

  return (
    <>
    <section className="border-b border-border bg-card py-12 sm:py-14" aria-labelledby="trust-intro-heading">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Local Travel Specialists
            </p>
            <h2
              id="trust-intro-heading"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Straightforward travel planning from local people who know the hills.
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted">
              Based in Siliguri — the transit gateway to North Bengal and Sikkim —
              Safar Tours helps families, couples, and friends experience the Himalayas
              without the stress of navigating mountain roads or coordinating multiple drivers.
              From Bagdogra Airport and NJP station to remote corners of Sikkim, we take care of
              reliable transport, comfortable stays, and permits.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-3 lg:col-span-5">
            <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-4.5 w-4.5" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Siliguri Base
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                On the ground at Bagdogra & NJP for smooth pickups and departures.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-4.5 w-4.5" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Private Vehicles
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Dedicated cars with verified, hill-tested drivers for your party.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PhoneCall className="h-4.5 w-4.5" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Direct Contact
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Call or WhatsApp our team directly anytime at {siteConfig.phoneDisplay}.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>

    {/* Start your journey — NJP / Bagdogra / Siliguri → the hills */}
    <section
      className="border-b border-border py-14 sm:py-16"
      aria-labelledby="start-journey-heading"
    >
      <Container>
        <div className="grid items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Where Your Trip Begins
            </p>
            <h2
              id="start-journey-heading"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Start your journey from Siliguri
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted">
              We pick you up at Bagdogra Airport, NJP station, or anywhere in
              Siliguri — and take you to the hills, forests and valleys of
              Northeast India. One driver, one quote, door to door.
            </p>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <Button href="/routes" variant="outline" size="md">
              All routes &amp; journey times
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Pickup points */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {pickupPoints.map((p) => (
            <div
              key={p.name}
              className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary-dark">
                <p.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{p.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Popular routes with journey times */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {startRoutes.map((r) => (
            <RouteCard key={r.slug} route={r} />
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Planning a multi-day trip?{" "}
          <Link
            href="/car-rentals"
            className="font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Keep the same car and driver for your whole journey →
          </Link>
        </p>
      </Container>
    </section>
    </>
  );
}
