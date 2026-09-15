import { MapPinned, CalendarCheck, CarFront, Headset, type LucideIcon } from "lucide-react";
import Container from "@/components/ui/Container";

const items: { icon: LucideIcon; label: string }[] = [
  { icon: MapPinned, label: "Local Travel Experts" },
  { icon: CalendarCheck, label: "Custom Itineraries" },
  { icon: CarFront, label: "Reliable Transfers" },
  { icon: Headset, label: "Dedicated Support" },
];

export default function TrustStrip() {
  return (
    <section aria-label="Our promise to travellers" className="border-b border-border bg-card">
      <Container className="py-7">
        <ul className="grid grid-cols-2 gap-5 text-center sm:grid-cols-4">
          {items.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
