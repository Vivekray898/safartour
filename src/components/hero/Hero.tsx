import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { images } from "@/data/images";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EnquiryModal from "@/components/forms/EnquiryModal";

export default function Hero() {
  return (
    <section className="relative flex min-h-[580px] items-center overflow-hidden py-24 sm:py-28 lg:min-h-[660px] lg:py-32">
      <Image
        src={images.hero.src}
        alt="Panoramic view of the Himalayan mountains and tea gardens"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Calm, readable gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30"
        aria-hidden
      />

      <Container className="relative pt-16 sm:pt-20">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
            Safar Tours & Travels • Siliguri
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Explore the Northeast with confidence
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-white/90">
            Thoughtfully planned journeys across Darjeeling, Sikkim, Kalimpong
            and beyond. Private vehicles, comfortable stays, and real local
            support throughout your trip.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Button href="/packages" variant="secondary" size="lg">
              Explore Trips
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <EnquiryModal
              label="Talk to a Travel Expert"
              title="Plan Your Trip with Safar Tours"
              subtitle="Tell us just a little about your trip. We'll help you plan the rest."
              variant="outline"
              size="lg"
              className="border-white/40 bg-white/10 text-white hover:border-white hover:bg-white/20"
            />
          </div>

          <div className="mt-9 border-t border-white/20 pt-5">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-white/80">
              Local expertise &bull; Personal assistance &bull; Flexible trip planning
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
