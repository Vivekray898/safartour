import { chromium } from 'playwright';
import { getCompanySettings, type CompanySettings } from './settings';
import { formatCRMDate, formatCRMDateRange, formatCRMMoney } from './format';

export interface QuotationPDFData {
  reference: string;
  date: string;
  validUntil: string | null;
  status: string;
  customer: {
    name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    city: string | null;
  };
  trip: {
    reference: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    total_pax: number | null;
    adults: number | null;
  };
  items: Array<{
    category: string;
    description: string;
    details: string | null;
    quantity: number;
    amount: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  finalAmount: number;
  notes: string | null;
  terms: string | null;
  prepared_by: string | null;
}

function escapeHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const CATEGORY_LABELS: Record<string, string> = {
  hotel: 'Hotel',
  transport: 'Transport',
  sightseeing: 'Sightseeing',
  other: 'Service',
};

/** Escape a Supabase Storage URL for safe use in an HTML attribute. */
function safeUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  return /^https:\/\//i.test(trimmed) ? escapeHtml(trimmed) : '';
}

/**
 * Generate a professional travel-agency quotation PDF.
 *
 * Branding, GST config, banking and footer content all come from the
 * company settings (admin-editable in /crm/settings). Dates are formatted
 * timezone-safely; long itineraries paginate cleanly.
 */
export async function generateQuotationPDF(data: QuotationPDFData): Promise<Buffer> {
  const settings = await getCompanySettings();
  const html = generateQuotationHTML(data, settings);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#9ca3af;padding:0 14mm;display:flex;justify-content:space-between;">
          <span>${escapeHtml(settings.company_name)} — Generated ${formatCRMDate(new Date())}</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function generateQuotationHTML(data: QuotationPDFData, s: CompanySettings): string {
  const isDraft = data.status === 'draft';

  const itemRows = data.items.map(item => {
    const lineTotal = (Number(item.amount) || 0) * (Number(item.quantity) || 1);
    return `
    <tr class="item-row">
      <td class="cell-cat">${escapeHtml(CATEGORY_LABELS[item.category] ?? 'Service')}</td>
      <td class="cell-desc">
        <div class="desc-main">${escapeHtml(item.description)}</div>
        ${item.details ? `<div class="desc-sub">${escapeHtml(item.details)}</div>` : ''}
      </td>
      <td class="cell-qty">${Number(item.quantity) || 1}</td>
      <td class="cell-amt">${formatCRMMoney(item.amount)}</td>
      <td class="cell-amt cell-strong">${formatCRMMoney(lineTotal)}</td>
    </tr>`;
  }).join('');

  const gstEnabled = s.gst_enabled === 1 || data.taxRate > 0;
  const showGstLine = gstEnabled && (data.tax > 0 || data.taxRate > 0);
  const gstLabel = data.taxRate > 0 ? `GST @ ${data.taxRate}%` : 'GST';

  // Payment terms: per-quotation override, else company default, else generic.
  const paymentTerms = s.payment_terms || '50% advance to confirm the booking; balance before departure.';
  const termsHtml = data.terms || s.terms_conditions || '';
  const cancellationHtml = s.cancellation_policy || '';

  const bankBlock = (s.bank_name || s.bank_account_name || s.upi_id) ? `
    <div class="section avoid-break">
      <div class="section-title">Payment Information</div>
      <div class="info-box">
        ${s.bank_name ? `<div class="kv"><span>Bank</span><b>${escapeHtml(s.bank_name)}</b></div>` : ''}
        ${s.bank_account_name ? `<div class="kv"><span>Account Name</span><b>${escapeHtml(s.bank_account_name)}</b></div>` : ''}
        ${s.bank_account_number ? `<div class="kv"><span>Account No.</span><b>${escapeHtml(s.bank_account_number)}</b></div>` : ''}
        ${s.bank_ifsc ? `<div class="kv"><span>IFSC</span><b>${escapeHtml(s.bank_ifsc)}</b></div>` : ''}
        ${s.upi_id ? `<div class="kv"><span>UPI</span><b>${escapeHtml(s.upi_id)}</b></div>` : ''}
      </div>
    </div>` : '';

  const logoImg = safeUrl(s.logo_url)
    ? `<img class="logo-img" src="${safeUrl(s.logo_url)}" alt="${escapeHtml(s.company_name)}" />`
    : '';

  const contactBits = [
    s.phone ? `☎ ${escapeHtml(s.phone)}` : '',
    s.email ? `✉ ${escapeHtml(s.email)}` : '',
    s.website ? escapeHtml(s.website) : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      font-size: 11px; line-height: 1.55; color: #1f2937; background: white;
    }
    .avoid-break { page-break-inside: avoid; }
    tr.item-row { page-break-inside: avoid; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
      padding-bottom: 14px; border-bottom: 3px solid #166534; margin-bottom: 18px; }
    .brand { display: flex; gap: 12px; align-items: center; }
    .logo-img { max-height: 56px; max-width: 180px; object-fit: contain; }
    .brand-name { font-size: 21px; font-weight: 700; color: #166534; letter-spacing: -0.3px; }
    .brand-sub { font-size: 9px; color: #6b7280; margin-top: 1px; }
    .brand-contact { font-size: 9px; color: #6b7280; margin-top: 4px; }
    .doc-head { text-align: right; }
    .doc-title { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #111827; }
    .doc-ref { font-size: 13px; font-weight: 600; color: #166534; margin-top: 2px; }
    .doc-status { display: inline-block; margin-top: 5px; font-size: 8.5px; font-weight: 700; letter-spacing: 0.8px;
      text-transform: uppercase; padding: 2px 8px; border-radius: 999px;
      background: ${isDraft ? '#fef3c7' : '#dcfce7'}; color: ${isDraft ? '#92400e' : '#166534'}; }

    .meta-grid { display: flex; gap: 12px; margin-bottom: 16px; }
    .meta-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; page-break-inside: avoid; }
    .meta-label { font-size: 8.5px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 5px; }
    .meta-line { font-size: 10.5px; margin-top: 2px; }
    .meta-line b { font-weight: 600; color: #111827; }

    .section { margin-bottom: 14px; }
    .section-title { font-size: 10px; font-weight: 700; color: #166534; text-transform: uppercase;
      letter-spacing: 0.8px; margin-bottom: 7px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }

    table { width: 100%; border-collapse: collapse; }
    th { background: #f0fdf4; padding: 7px 9px; font-size: 8.5px; text-transform: uppercase; color: #374151;
      text-align: left; font-weight: 700; border-bottom: 2px solid #166534; letter-spacing: 0.4px; }
    td { padding: 7px 9px; border-bottom: 1px solid #f3f4f6; font-size: 10.5px; vertical-align: top; }
    .cell-cat { width: 74px; color: #6b7280; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.3px; }
    .cell-desc { } 
    .desc-main { font-weight: 500; color: #111827; }
    .desc-sub { color: #6b7280; font-size: 9.5px; margin-top: 1px; }
    .cell-qty { width: 40px; text-align: center; }
    .cell-amt { width: 92px; text-align: right; white-space: nowrap; }
    .cell-strong { font-weight: 600; }

    .totals { margin-top: 10px; margin-left: auto; width: 260px; page-break-inside: avoid; }
    .totals td { padding: 6px 9px; border-bottom: none; }
    .totals .label { text-align: right; color: #4b5563; }
    .totals .value { text-align: right; font-weight: 600; white-space: nowrap; }
    .totals .discount .value { color: #15803d; }
    .totals tr.grand td { border-top: 2px solid #166534; padding-top: 9px; font-size: 13px; font-weight: 700; }
    .totals tr.grand .value { color: #166534; }

    .info-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; font-size: 10.5px; }
    .kv { display: flex; justify-content: space-between; padding: 2px 0; }
    .kv span { color: #6b7280; }
    .terms-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; font-size: 9.8px; color: #4b5563; white-space: pre-line; }

    .thankyou { margin-top: 22px; text-align: center; font-size: 10px; color: #166534; font-weight: 600; }
    .pdf-footer { margin-top: 10px; text-align: center; font-size: 8.5px; color: #9ca3af; }

    .watermark { position: fixed; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-38deg);
      font-size: 88px; color: rgba(22, 101, 52, 0.05); font-weight: 900; pointer-events: none; white-space: nowrap; z-index: -1; }
  </style>
</head>
<body>
  ${isDraft ? '<div class="watermark">DRAFT</div>' : ''}

  <div class="header">
    <div class="brand">
      ${logoImg}
      <div>
        <div class="brand-name">${escapeHtml(s.company_name)}</div>
        <div class="brand-sub">Tour Packages &amp; Travel Services</div>
        <div class="brand-contact">${contactBits}</div>
      </div>
    </div>
    <div class="doc-head">
      <div class="doc-title">Quotation</div>
      <div class="doc-ref">${escapeHtml(data.reference)}</div>
      <div class="doc-status">${escapeHtml(data.status)}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-label">Quotation Details</div>
      <div class="meta-line">Date: <b>${formatCRMDate(data.date)}</b></div>
      <div class="meta-line">Valid Until: <b>${data.validUntil ? formatCRMDate(data.validUntil) : 'Not specified'}</b></div>
      ${data.prepared_by ? `<div class="meta-line">Prepared By: <b>${escapeHtml(data.prepared_by)}</b></div>` : ''}
    </div>
    <div class="meta-card">
      <div class="meta-label">Customer</div>
      <div class="meta-line"><b>${escapeHtml(data.customer.name)}</b></div>
      ${data.customer.phone ? `<div class="meta-line">${escapeHtml(data.customer.phone)}</div>` : ''}
      ${data.customer.email ? `<div class="meta-line">${escapeHtml(data.customer.email)}</div>` : ''}
      ${data.customer.city ? `<div class="meta-line">${escapeHtml(data.customer.city)}</div>` : ''}
    </div>
    <div class="meta-card">
      <div class="meta-label">Trip</div>
      <div class="meta-line"><b>${escapeHtml(data.trip.destination || 'Trip')}</b></div>
      <div class="meta-line">${formatCRMDateRange(data.trip.start_date, data.trip.end_date)}</div>
      <div class="meta-line">${Number(data.trip.total_pax ?? data.trip.adults ?? 0)} traveller(s)</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Itinerary &amp; Services</div>
    <table>
      <thead>
        <tr>
          <th>Item</th><th>Description</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Rate</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:16px;">No items listed</td></tr>'}
      </tbody>
    </table>

    <table class="totals">
      <tbody>
        <tr><td class="label">Subtotal</td><td class="value">${formatCRMMoney(data.subtotal)}</td></tr>
        ${data.discount > 0 ? `<tr class="discount"><td class="label">Discount</td><td class="value">− ${formatCRMMoney(data.discount)}</td></tr>` : ''}
        ${showGstLine ? `<tr><td class="label">${gstLabel}</td><td class="value">${formatCRMMoney(data.tax)}</td></tr>` : ''}
        <tr class="grand"><td class="label">Grand Total</td><td class="value">${formatCRMMoney(data.finalAmount)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section avoid-break">
    <div class="section-title">Payment Terms</div>
    <div class="terms-box">${escapeHtml(paymentTerms)}</div>
  </div>

  ${bankBlock}

  ${termsHtml ? `
  <div class="section avoid-break">
    <div class="section-title">Terms &amp; Conditions</div>
    <div class="terms-box">${escapeHtml(termsHtml)}</div>
  </div>` : ''}

  ${cancellationHtml ? `
  <div class="section avoid-break">
    <div class="section-title">Cancellation Policy</div>
    <div class="terms-box">${escapeHtml(cancellationHtml)}</div>
  </div>` : ''}

  ${data.notes ? `
  <div class="section avoid-break">
    <div class="section-title">Notes</div>
    <div class="terms-box">${escapeHtml(data.notes)}</div>
  </div>` : ''}

  <div class="thankyou">Thank you for choosing ${escapeHtml(s.company_name)} for your travel plans!</div>
  ${s.pdf_footer_text ? `<div class="pdf-footer">${escapeHtml(s.pdf_footer_text)}</div>` : ''}
</body>
</html>
`;
}
