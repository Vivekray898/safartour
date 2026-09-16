import Image from "next/image";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EnquiryModal from "@/components/forms/EnquiryModal";
import { siteConfig } from "@/data/site";
import { images } from "@/data/images";
import { getWhatsAppUrl, generalEnquiryMessage } from "@/lib/whatsapp";

export default function FinalCTA({
  title = "Planning a trip to the Northeast?",
  description = "Let's make it simple. Talk to our local team in Siliguri for custom itineraries, car rentals, or honest travel advice.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden py-18 sm:py-20 md:py-24" aria-labelledby="final-cta-heading">
      <Image
        src={images.finalCta.src}
        alt="Mountain landscape at sunset"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50"
        aria-hidden
      />
      <Container className="relative">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Start Your Journey
          </p>
          <h2
            id="final-cta-heading"
            className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-3.5 text-base sm:text-lg leading-relaxed text-white/90">
            {description}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3.5">
            <EnquiryModal
              label="Talk to Safar Tours"
              title="Talk to Safar Tours"
              subtitle="Tell us a little about your trip. We'll get back to you personally."
              variant="secondary"
              size="lg"
            />
            <Button
              href={getWhatsAppUrl(generalEnquiryMessage())}
              variant="whatsapp"
              size="lg"
            >
              WhatsApp Us
            </Button>
          </div>
          <p className="mt-4 text-xs text-white/70">
            Or call us directly at {siteConfig.phoneDisplay}
          </p>
        </div>
      </Container>
    </section>
  );
}
