import Image from "next/image";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { images } from "@/data/images";
import { getWhatsAppUrl, generalEnquiryMessage } from "@/lib/whatsapp";

export default function FinalCTA({
  title = "Ready to explore the Himalayas?",
  description = "Let's plan your next journey.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden py-20 md:py-24">
      <Image
        src={images.finalCta.src}
        alt={images.finalCta.alt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"
        aria-hidden
      />
      <Container className="relative">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-white/85">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/contact" variant="secondary" size="lg">
              Get Free Quote
            </Button>
            <Button
              href={getWhatsAppUrl(generalEnquiryMessage())}
              variant="whatsapp"
              size="lg"
            >
              WhatsApp Us
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
