import Container from "@/components/ui/Container";
import { stats, type Stat } from "@/data/site";

function StatItem({ stat }: { stat: Stat }) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl font-bold text-primary sm:text-4xl">
        {stat.value}
      </p>
      <p className="mt-1.5 text-sm font-medium text-muted">{stat.label}</p>
    </div>
  );
}

export default function Stats() {
  return (
    <section aria-label="Why travellers choose Safar Tours" className="border-b border-border bg-card">
      <Container className="py-10 lg:py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <StatItem key={s.label} stat={s} />
          ))}
        </div>
      </Container>
    </section>
  );
}
