"use client";

import { useRef } from 'react';
import { Search } from 'lucide-react';

export interface CRMFilterSelect {
  name: string;
  value: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
}

/**
 * Client-side filter bar for server-rendered CRM list pages.
 *
 * Wraps the controls in a real <form method="GET"> so the server page can
 * re-render from URL search params (the data itself stays server-fetched).
 * Selects submit automatically on change; the search input submits on Enter
 * or via the icon button. Nothing is filtered client-side, so large datasets
 * stay fast.
 */
export default function CRMFilterBar({
  basePath,
  searchName = 'search',
  searchValue = '',
  searchPlaceholder = 'Search...',
  selects = [],
  clearHref,
  clearLabel = 'Clear filters',
}: {
  basePath: string;
  searchName?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  selects?: CRMFilterSelect[];
  clearHref?: string;
  clearLabel?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const submit = () => formRef.current?.requestSubmit();

  const hasActiveFilters =
    searchValue !== '' || selects.some(s => s.value !== '');

  return (
    <form
      ref={formRef}
      action={basePath}
      method="GET"
      className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center"
    >
      <div className="relative flex-1 min-w-[180px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          name={searchName}
          defaultValue={searchValue}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {selects.map(select => (
        <select
          key={select.name}
          name={select.name}
          defaultValue={select.value}
          aria-label={select.label || select.name}
          onChange={submit}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 max-w-[10rem]"
        >
          {select.options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      <button
        type="submit"
        className="px-3 py-2 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg transition-colors"
      >
        Apply
      </button>

      {hasActiveFilters && clearHref && (
        <a
          href={clearHref}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          {clearLabel}
        </a>
      )}
    </form>
  );
}
