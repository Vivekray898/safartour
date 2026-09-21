import { cache } from 'react';
import { getDb } from './db';

export interface CompanySettings {
  company_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  gst_enabled: number;
  gst_rate: number;
  gstin: string | null;
  gst_legal_name: string | null;
  gst_state: string | null;
  gst_state_code: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  upi_id: string | null;
  payment_terms: string | null;
  cancellation_policy: string | null;
  terms_conditions: string | null;
  pdf_footer_text: string | null;
  quotation_prefix: string;
}

const DEFAULTS: CompanySettings = {
  company_name: 'Safar Tours',
  logo_url: null,
  address: null,
  phone: null,
  whatsapp: null,
  email: null,
  website: null,
  gst_enabled: 0,
  gst_rate: 5,
  gstin: null,
  gst_legal_name: null,
  gst_state: null,
  gst_state_code: null,
  bank_name: null,
  bank_account_name: null,
  bank_account_number: null,
  bank_ifsc: null,
  upi_id: null,
  payment_terms: null,
  cancellation_policy: null,
  terms_conditions: null,
  pdf_footer_text: null,
  quotation_prefix: 'QT',
};

/**
 * Read the singleton company settings row. Cached per request so the PDF
 * generator, settings page and layout all share one lookup. Never throws —
 * a settings failure must not break quotation rendering.
 */
export const getCompanySettings = cache(async (): Promise<CompanySettings> => {
  try {
    const row = await getDb()
      .prepare('SELECT * FROM company_settings WHERE id = 1')
      .get() as Partial<CompanySettings> | undefined;
    if (!row) return { ...DEFAULTS };
    return { ...DEFAULTS, ...row };
  } catch (error) {
    console.error('[crm] company settings lookup failed, using defaults:', error);
    return { ...DEFAULTS };
  }
});
