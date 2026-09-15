import Image from "next/image";
import { Users, Heart, Tent, Briefcase, Route } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { images } from "@/data/images";

const tripTypes = [
  { icon: Users, label: "Family Trips" },
  { icon: Heart, label: "Honeymoon" },
  { icon: Tent, label: "Friends' Adventures" },
  { icon: Briefcase, label: "Corporate Retreats" },
  { icon: Route, label: "Customised Itineraries" },
];

export default function CustomTourCTA() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20 lg:py-24">
      <Image
        src={images.customTour.src}
        alt={images.customTour.alt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-primary-dark/85" aria-hidden />
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Can&apos;t find the perfect package?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
            Tell us what you want. We&apos;ll build a trip around your
            schedule, budget and interests.
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-2.5">
            {tripTypes.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-secondary" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
          <div className="mt-9">
            <Button href="/contact" variant="secondary" size="lg">
              Plan My Trip
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
