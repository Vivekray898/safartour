import Link from 'next/link';

/**
 * Server-rendered pagination for CRM list pages. Renders nothing when
 * everything fits on one page. Uses links (not buttons) so it works without
 * client JavaScript and preserves the page's active filters via `params`.
 */
export default function CRMPagination({
  basePath,
  page,
  totalCount,
  limit,
  params = {},
  label = 'items',
}: {
  basePath: string;
  page: number;
  totalCount: number;
  limit: number;
  params?: Record<string, string>;
  label?: string;
}) {
  if (totalCount <= limit) return null;

  const buildHref = (targetPage: number) => {
    const qs = new URLSearchParams(params);
    qs.set('page', String(targetPage));
    return `${basePath}?${qs.toString()}`;
  };

  const totalPages = Math.ceil(totalCount / limit);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);

  return (
    <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-gray-500">
        Showing {from} to {to} of {totalCount} {label}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Previous
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
            Previous
          </span>
        )}
        <span className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Next
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
