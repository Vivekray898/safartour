import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PageHero from "@/components/hero/PageHero";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import HowItWorks from "@/components/sections/HowItWorks";
import Testimonials from "@/components/sections/Testimonials";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";
import { images } from "@/data/images";
import { siteConfig } from "@/data/site";

export const metadata = buildMetadata({
  title: "About Us — Siliguri Travel Agency",
  description:
    "Safar Tours & Travels is a Siliguri-based travel company offering tours, comfortable stays and reliable transportation across Sikkim, Darjeeling, Kalimpong, the Dooars and Northeast India.",
  path: "/about-us",
  ogImage: images.about.src,
});

const promiseItems = [
  {
    title: "Your time is our most valuable asset",
    description:
      "We plan routes and timings that maximise your experience — not our convenience.",
  },
  {
    title: "Consistent quality, whatever you book",
    description:
      "From an economy hatchback to a tempo traveller, our vehicles and drivers meet the same standard of care.",
  },
  {
    title: "Service that begins at arrival",
    description:
      "The moment you step out at Bagdogra or NJP, a Safar Tours driver is there — and our support stays reachable until we drop you back.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About Safar Tours"
        subtitle="A Siliguri-based team that believes your needs come first — and that travel across the Northeast should feel effortless."
        image={images.about.src}
        imageAlt={images.about.alt}
        priority
      >
        <Breadcrumbs items={[{ name: "About Us", href: "/about-us" }]} />
      </PageHero>

      {/* Our story */}
      <Container className="py-12 lg:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Our Story"
              title="Born in Siliguri, Built for the Hills"
              align="left"
            />
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted">
              <p>
                {siteConfig.fullName} specialises in travel services across
                Northeast India — focused on Sikkim, Darjeeling, Kalimpong, the
                Dooars and nearby regions. We&apos;re based on NJP Main Road in
                Siliguri, minutes from the airport and railway station where
                most Himalayan journeys begin.
              </p>
              <p>
                We started with a simple frustration: the car rental market in
                Siliguri was limited, unreliable and opaque. So we built the
                service we wished existed — clear quotes, well-maintained
                vehicles, experienced hill drivers and pickup that starts the
                moment you land.
              </p>
              <p>
                Today we run full tour packages, custom itineraries, car
                rentals and transfers across the region — with the same
                promise on every trip: your needs come first.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-7 shadow-sm">
            <SectionHeading eyebrow="Our Mission" title="Travel Without Friction" align="left" />
            <p className="mt-4 text-base leading-relaxed text-muted">
              To make travel across Northeast India as reliable and
              comfortable as it is beautiful — with honest planning, local
              knowledge and support that answers when you call.
            </p>
            <div className="mt-6 border-t border-border pt-6">
              <p className="text-sm font-semibold text-foreground">
                Where we operate
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Darjeeling · Sikkim · Kalimpong · Dooars · Meghalaya ·
                Arunachal Pradesh · Bhutan (on request)
              </p>
            </div>
          </div>
        </div>
      </Container>

      <WhyChooseUs />

      {/* Our promise */}
      <section className="bg-card py-14 lg:py-16" aria-labelledby="promise-heading">
        <Container>
          <SectionHeading
            eyebrow="Our Promise"
            title="What Every Safar Tours Trip Includes"
            description="Whatever the destination, these commitments stay the same."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {promiseItems.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-border bg-background p-6"
              >
                <h3 className="font-display text-base font-bold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <HowItWorks />

      <Testimonials />

      <section className="py-14 text-center lg:py-16">
        <Container>
          <SectionHeading
            title="Let's Plan Your Journey"
            description="Tell us where you're dreaming of — we'll handle the rest."
          />
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/contact" variant="primary" size="lg">
              Contact Us
            </Button>
            <Button href="/packages" variant="outline" size="lg">
              Browse Packages
            </Button>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}
