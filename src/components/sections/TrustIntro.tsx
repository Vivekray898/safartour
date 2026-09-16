import { MapPin, ShieldCheck, PhoneCall } from "lucide-react";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/data/site";

export default function TrustIntro() {
  return (
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
  );
}
