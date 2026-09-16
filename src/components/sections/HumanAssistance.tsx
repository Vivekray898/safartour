import { Phone, MessageCircle } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { siteConfig } from "@/data/site";
import { getWhatsAppUrl, generalEnquiryMessage } from "@/lib/whatsapp";

export default function HumanAssistance() {
  return (
    <section className="border-y border-border bg-card py-12 sm:py-14" aria-labelledby="help-deciding-heading">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl border border-primary/15 bg-primary/[0.03] p-6 sm:p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Personal Guidance
          </p>
          <h2
            id="help-deciding-heading"
            className="mt-2 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground"
          >
            Need help deciding?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-muted">
            You don&apos;t have to figure out mountain routes, road permits, or driving
            times by yourself. Speak with someone from our Siliguri team — we&apos;re happy to
            help you choose the right places and pace for your family.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              href={getWhatsAppUrl(generalEnquiryMessage())}
              variant="whatsapp"
              size="md"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Chat on WhatsApp
            </Button>
            <Button
              href={`tel:${siteConfig.phone}`}
              variant="outline"
              size="md"
            >
              <Phone className="h-4 w-4 text-primary" aria-hidden />
              Call {siteConfig.phoneDisplay}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No obligation &bull; Reachable 9:00 AM &ndash; 8:00 PM daily
          </p>
        </div>
      </Container>
    </section>
  );
}
