import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import Link from 'next/link';

/**
 * Empty state for CRM list pages: explains what will appear here and offers
 * the primary action. Server-rendered (no interactivity needed).
 */
export default function CRMEmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
