import type { Guide } from "@/data/guides";
import GuideCard from "@/components/guides/GuideCard";

export default function GuideGrid({ guides }: { guides: Guide[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {guides.map((g) => (
        <GuideCard key={g.slug} guide={g} />
      ))}
    </div>
  );
}
