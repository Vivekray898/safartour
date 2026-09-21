"use client";

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Confirmation dialog for destructive actions (archive/delete).
 * Explains the consequence, requires explicit confirm, shows a busy state
 * and surfaces errors instead of failing silently.
 */
export default function CRMConfirm({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  busyLabel = 'Working...',
  destructive = true,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busyLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Action failed');
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} labelledBy="crm-confirm-title">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${destructive ? 'bg-red-100' : 'bg-amber-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${destructive ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div className="min-w-0">
            <h2 id="crm-confirm-title" className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{message}</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'
            }`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
