import {
  Map,
  Car,
  Route,
  Headset,
  BedDouble,
  FileText,
  type LucideIcon,
} from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { whyChooseUs } from "@/data/site";

const iconMap: Record<string, LucideIcon> = {
  map: Map,
  car: Car,
  route: Route,
  headset: Headset,
  bed: BedDouble,
  fileText: FileText,
};

export default function WhyChooseUs() {
  return (
    <section className="py-16 md:py-20 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow="Why Safar Tours"
          title="Why Choose Safar Tours"
          description="A Siliguri-based team that treats your time as the most valuable asset — from the first enquiry to the final drop-off."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item) => {
            const Icon = iconMap[item.icon] ?? Map;
            return (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
