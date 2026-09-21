"use client";

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface CRMRowAction {
  label: string;
  /** Visual tone — destructive actions render red. */
  danger?: boolean;
  onSelect: () => void;
}

/**
 * Row actions dropdown (View / Edit / Duplicate / Archive / Delete).
 * Keeps list rows clean: one ⋯ button instead of 5 giant buttons.
 * Accessible: Escape closes, outside click closes, focus returns to trigger.
 */
export default function CRMRowActions({
  actions,
  label = 'Actions',
}: {
  actions: CRMRowAction[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-44 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg py-1"
        >
          {actions.map(action => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                action.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
