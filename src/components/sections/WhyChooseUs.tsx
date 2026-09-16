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

const whyChooseUs = [
  {
    title: "Local Hill Knowledge",
    description:
      "Based in Siliguri at the foot of the hills, we know road conditions, seasonal weather, and travel times from first-hand experience.",
    icon: "map",
  },
  {
    title: "Reliable Vehicles & Hill Drivers",
    description:
      "All trips use well-maintained private cars driven by courteous local drivers who know mountain driving safely.",
    icon: "car",
  },
  {
    title: "Flexible, Tailored Planning",
    description:
      "Every journey is shaped around your schedule, family preferences, and budget. No rigid tours or rushed sightseeing.",
    icon: "route",
  },
  {
    title: "Direct & Reachable Support",
    description:
      "From planning before you leave home to coordination on the road, our team is directly reachable on phone and WhatsApp.",
    icon: "headset",
  },
] as const;

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
    <section className="py-14 sm:py-16 md:py-20" aria-labelledby="why-us-heading">
      <Container>
        <SectionHeading
          eyebrow="Why Safar Tours"
          title="Why Travel with Safar Tours"
          description="Straightforward planning, local drivers, and personal support from start to finish."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyChooseUs.map((item) => {
            const Icon = iconMap[item.icon] ?? Map;
            return (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted">
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
