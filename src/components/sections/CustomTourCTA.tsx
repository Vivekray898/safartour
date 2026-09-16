import Image from "next/image";
import Container from "@/components/ui/Container";
import EnquiryModal from "@/components/forms/EnquiryModal";
import { images } from "@/data/images";

export default function CustomTourCTA() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24" aria-labelledby="custom-tour-heading">
      <Image
        src={images.customTour.src}
        alt="Mountain landscape in the Eastern Himalayas"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-primary-dark/85" aria-hidden />
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Custom Travel Planning
          </p>
          <h2
            id="custom-tour-heading"
            className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Have something different in mind?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">
            Tell us where you want to go. We&apos;ll help you plan the journey around you —
            your schedule, your family, and your budget.
          </p>
          <div className="mt-8 flex justify-center">
            <EnquiryModal
              label="Plan a Custom Trip"
              title="Plan Your Custom Journey"
              subtitle="Tell us where you'd like to travel. We'll put together an itinerary for you."
              variant="secondary"
              size="lg"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
