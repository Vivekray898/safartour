import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import { getDestination } from "@/data/destinations";
import { getWhatsAppUrl, packageEnquiryMessage } from "@/lib/whatsapp";
import type { TourPackage } from "@/data/packages";

export default function PackageHero({ pkg }: { pkg: TourPackage }) {
  const destination = getDestination(pkg.destinationSlug);
  return (
    <section className="relative flex min-h-[420px] items-end overflow-hidden lg:min-h-[520px]">
      <Image
        src={pkg.heroImage}
        alt={pkg.heroImageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary">
          {destination?.name ?? pkg.destinationSlug} Tour Package
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {pkg.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/90">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <Clock className="h-4 w-4" aria-hidden />
            {pkg.duration}
          </span>
          {destination ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-secondary" aria-hidden />
              {destination.name}
            </span>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="#enquiry" variant="secondary" size="lg">
            Get Free Quote
          </Button>
          <Button
            href={getWhatsAppUrl(
              packageEnquiryMessage(pkg.title, pkg.duration)
            )}
            variant="whatsapp"
            size="lg"
          >
            WhatsApp Us
          </Button>
        </div>
      </div>
    </section>
  );
}
