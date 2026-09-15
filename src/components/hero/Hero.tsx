import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { images } from "@/data/images";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getWhatsAppUrl, generalEnquiryMessage } from "@/lib/whatsapp";

export default function Hero() {
  return (
    <section className="relative flex min-h-[560px] items-center overflow-hidden pb-24 lg:min-h-[640px] lg:pb-28">
      <Image
        src={images.hero.src}
        alt={images.hero.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20"
        aria-hidden
      />

      <Container className="relative pt-32 lg:pt-40">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-secondary">
            Your Journey Begins Here
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your Journey.
            <br />
            Our Local Expertise.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
            Discover Darjeeling, Sikkim, Kalimpong and the Northeast with
            thoughtfully planned journeys, comfortable stays and reliable
            local transportation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/packages" variant="secondary" size="lg">
              Explore Packages
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              href={getWhatsAppUrl(generalEnquiryMessage())}
              variant="whatsapp"
              size="lg"
            >
              Plan My Trip
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
