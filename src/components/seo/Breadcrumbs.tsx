import Link from "next/link";
import { ChevronRight } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export type Crumb = { name: string; href: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb">
      <JsonLd data={breadcrumbJsonLd(all)} />
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {all.map((item, i) => {
          const isLast = i === all.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 opacity-60"
                  aria-hidden
                />
              )}
              {isLast ? (
                <span aria-current="page" className="font-medium">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="opacity-80 transition-opacity hover:opacity-100 hover:underline"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
