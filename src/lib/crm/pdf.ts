import { chromium } from 'playwright';

export async function generateQuotationPDF(data: {
  reference: string;
  date: string;
  validUntil: string | null;
  customer: {
    name: string;
    phone: string | null;
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
  finalAmount: number;
  notes: string | null;
  terms: string | null;
  prepared_by: string | null;
  company: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
}): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const html = generateQuotationHTML(data);

  await page.setContent(html, { waitUntil: 'networkidle' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });

  await browser.close();
  return Buffer.from(pdf);
}

function generateQuotationHTML(data: {
  reference: string;
  date: string;
  validUntil: string | null;
  customer: {
    name: string;
    phone: string | null;
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
  finalAmount: number;
  notes: string | null;
  terms: string | null;
  prepared_by: string | null;
  company: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
}): string {
  const itemRows = data.items.map(item => `
    <tr>
      <td class="py-2 px-3 border-b border-gray-100 text-sm">${item.category === 'hotel' ? '🏨' : item.category === 'transport' ? '🚗' : item.category === 'sightseeing' ? '📍' : '📦'}</td>
      <td class="py-2 px-3 border-b border-gray-100 text-sm">${item.description}</td>
      <td class="py-2 px-3 border-b border-gray-100 text-sm">${item.details || '-'}</td>
      <td class="py-2 px-3 border-b border-gray-100 text-sm text-center">${item.quantity}</td>
      <td class="py-2 px-3 border-b border-gray-100 text-sm text-right">₹${item.amount.toLocaleString()}</td>
    </tr>
  `).join('');

  const formattedDate = new Date(data.date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const validUntilText = data.validUntil ? new Date(data.validUntil).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Not specified';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1f2937;
      background: white;
    }
    .header {
      border-bottom: 3px solid #166534;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #166534;
      letter-spacing: -0.5px;
    }
    .logo-sub {
      font-size: 10px;
      color: #6b7280;
      margin-top: 2px;
    }
    .quote-ref {
      text-align: right;
    }
    .quote-ref-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .quote-ref-value {
      font-size: 16px;
      font-weight: 600;
      color: #166534;
      margin-top: 2px;
    }
    .company-info {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #6b7280;
    }
    .section {
      margin-bottom: 15px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 600;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0;
    }
    .info-item {
      padding: 6px 8px;
      border: 1px solid #e5e7eb;
      margin: 2px;
      font-size: 11px;
    }
    .info-label {
      font-size: 9px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .info-value {
      font-size: 11px;
      font-weight: 500;
      color: #1f2937;
      margin-top: 1px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #f9fafb;
      padding: 8px 10px;
      font-size: 9px;
      text-transform: uppercase;
      color: #6b7280;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    th.right, td.right {
      text-align: right;
    }
    th.center, td.center {
      text-align: center;
    }
    .total-row td {
      padding: 10px 10px;
      border-top: 2px solid #166534;
      border-bottom: none;
      font-weight: 600;
      font-size: 12px;
    }
    .grand-total td {
      padding: 12px 10px;
      background: #166534;
      color: white;
      font-weight: 700;
      font-size: 14px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
      color: #6b7280;
    }
    .footer-two-col {
      display: flex;
      justify-content: space-between;
    }
    .notes-box {
      background: #f9fafb;
      padding: 10px;
      border-left: 3px solid #166534;
      font-size: 10px;
      color: #4b5563;
      margin-top: 10px;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      color: rgba(22, 101, 52, 0.03);
      font-weight: 900;
      pointer-events: none;
      white-space: nowrap;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    @media (max-width: 595px) {
      body { font-size: 10px; }
      .info-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="watermark">DRAFT</div>

  <div class="header">
    <div class="header-top">
      <div>
        <div class="logo">${data.company.name}</div>
        <div class="logo-sub">Tour Packages & Travel Services</div>
      </div>
      <div class="quote-ref">
        <div class="quote-ref-label">Quotation</div>
        <div class="quote-ref-value">${data.reference}</div>
      </div>
    </div>
    <div class="company-info">
      ${data.company.address}<br>
      📞 ${data.company.phone} &nbsp;|&nbsp; ✉️ ${data.company.email}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Date & Validity</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Date</div>
        <div class="info-value">${formattedDate}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Valid Until</div>
        <div class="info-value">${validUntilText}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Customer Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Name</div>
        <div class="info-value">${data.customer.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Phone</div>
        <div class="info-value">${data.customer.phone || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${data.customer.email || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">City</div>
        <div class="info-value">${data.customer.city || '-'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Trip Reference: ${data.trip.reference}</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Destination</div>
        <div class="info-value">${data.trip.destination || 'Not specified'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Travel Dates</div>
        <div class="info-value">${data.trip.start_date ? new Date(data.trip.start_date).toLocaleDateString('en-IN') : 'N/A'} ${data.trip.end_date ? ' - ' + new Date(data.trip.end_date).toLocaleDateString('en-IN') : ''}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Travelers</div>
        <div class="info-value">${data.trip.total_pax || data.trip.adults || 0} ${data.trip.total_pax === 1 ? 'traveller' : 'travellers'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Quote Details</div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Description</th>
          <th>Details</th>
          <th class="center">Qty</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="total-row">
          <td colspan="4" class="text-right">Subtotal</td>
          <td class="right">₹${data.subtotal.toLocaleString()}</td>
        </tr>
        ${data.discount > 0 ? `
        <tr class="total-row">
          <td colspan="4" class="text-right text-green-600">Discount</td>
          <td class="right text-green-600">-₹${data.discount.toLocaleString()}</td>
        </tr>` : ''}
        ${data.tax > 0 ? `
        <tr class="total-row">
          <td colspan="4" class="text-right">Tax</td>
          <td class="right">₹${data.tax.toLocaleString()}</td>
        </tr>` : ''}
        <tr class="grand-total">
          <td colspan="4" class="text-right">Total Amount</td>
          <td class="right text-right">₹${data.finalAmount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${data.notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <div class="notes-box">${data.notes}</div>
  </div>` : ''}

  ${data.terms ? `
  <div class="section">
    <div class="section-title">Terms & Conditions</div>
    <div class="notes-box">${data.terms}</div>
  </div>` : ''}

  <div class="footer">
    <div class="footer-two-col">
      <div>
        <strong>Payment Information</strong><br>
        Please make payment to confirm your booking.<br>
        Payment methods: Cash, UPI, Bank Transfer, Card
      </div>
      <div>
        <strong>Contact Us</strong><br>
        ${data.company.phone}<br>
        ${data.company.email}
      </div>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; font-size: 9px; color: #9ca3af;">
    Thank you for considering ${data.company.name} for your travel plans!
  </div>
</body>
</html>
`;
}
