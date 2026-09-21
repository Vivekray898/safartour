"use client";

import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

export interface CRMField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  defaultValue?: string | number | null;
  /** Render half-width on sm+ (two-column form grid). */
  half?: boolean;
  helpText?: string;
  min?: number;
  max?: number;
  step?: string;
  rows?: number;
}

/**
 * Reusable create/edit form in a modal for CRM entities.
 *
 * Server pages compose this with a field list + submit handler; the form
 * handles labels, required markers, validation message, saving state,
 * duplicate-submit prevention and success/error feedback.
 */
export default function CRMEntityForm({
  open,
  title,
  description,
  fields,
  submitLabel = 'Save',
  savingLabel = 'Saving...',
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description?: string;
  fields: CRMField[];
  submitLabel?: string;
  savingLabel?: string;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setLocalError(null);

    const formData = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    for (const field of fields) {
      const raw = formData.get(field.name);
      values[field.name] = typeof raw === 'string' ? raw.trim() : '';
    }

    // Browser handles native required validation; still guard here.
    for (const field of fields) {
      if (field.required && field.type !== 'checkbox' && !values[field.name]) {
        setLocalError(`${field.label} is required`);
        return;
      }
    }

    try {
      await onSubmit(values);
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Something went wrong');
    }
  };

  const displayError = error ?? localError;

  return (
    <Modal open={open} onClose={saving ? () => {} : onClose} labelledBy="crm-form-title">
      <form onSubmit={handleSubmit} className="p-5 sm:p-6">
        <h2 id="crm-form-title" className="text-lg font-semibold text-gray-900 pr-8">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(field => (
            <div key={field.name} className={field.half === false ? 'sm:col-span-2' : field.half ? 'sm:col-span-1' : 'sm:col-span-2'}>
              <label htmlFor={`crm-${field.name}`} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={`crm-${field.name}`}
                  name={field.name}
                  required={field.required}
                  placeholder={field.placeholder}
                  defaultValue={field.defaultValue ?? ''}
                  rows={field.rows ?? 3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              ) : field.type === 'select' ? (
                <select
                  id={`crm-${field.name}`}
                  name={field.name}
                  required={field.required}
                  defaultValue={field.defaultValue ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {field.options?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 py-2 text-sm text-gray-700">
                  <input
                    id={`crm-${field.name}`}
                    type="checkbox"
                    name={field.name}
                    defaultChecked={Boolean(field.defaultValue)}
                    className="w-4 h-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
                  />
                  {field.helpText ?? 'Enabled'}
                </label>
              ) : (
                <input
                  id={`crm-${field.name}`}
                  type={field.type ?? 'text'}
                  name={field.name}
                  required={field.required}
                  placeholder={field.placeholder}
                  defaultValue={field.defaultValue ?? ''}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              )}
            </div>
          ))}
        </div>

        {displayError && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
            {displayError}
            <button
              type="button"
              onClick={() => setLocalError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? savingLabel : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
