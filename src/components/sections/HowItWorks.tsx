import {
  MessageSquare,
  Map,
  CheckCircle2,
  Mountain,
  type LucideIcon,
} from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { howItWorks } from "@/data/site";

const iconMap: Record<string, LucideIcon> = {
  message: MessageSquare,
  map: Map,
  check: CheckCircle2,
  mountain: Mountain,
};

export default function HowItWorks() {
  return (
    <section className="bg-foreground py-16 text-white md:py-20">
      <Container>
        <SectionHeading
          eyebrow="Simple Process"
          title="How It Works"
          description="From first message to mountain memories — four simple steps."
          dark
        />
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step) => {
            const Icon = iconMap[step.icon] ?? MessageSquare;
            return (
              <li key={step.step} className="relative">
                <span
                  className="font-display text-5xl font-extrabold text-white/10"
                  aria-hidden
                >
                  {step.step}
                </span>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
