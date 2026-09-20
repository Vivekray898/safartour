import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_QUOTATION_STATUSES } from '@/config/crm';
import { CRMStatusBadge } from '@/components/crm/common/CRMStatusBadge';
import { formatCurrency } from '@/config/crm';
import Link from 'next/link';
import { FileText, Download, MessageSquare, Mail, ExternalLink } from 'lucide-react';

export default async function QuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;
  const db = getDb();

  const quotation = await db.prepare(`
    SELECT q.*,
      t.reference as trip_reference,
      t.destination as trip_destination,
      t.start_date as trip_start_date,
      t.end_date as trip_end_date,
      t.total_pax as trip_total_pax,
      t.adults as trip_adults,
      c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
      c.city as customer_city, c.preferred_contact as customer_preferred_contact,
      u.name as prepared_by_name
    FROM quotations q
    JOIN trips t ON q.trip_id = t.id
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN users u ON q.prepared_by = u.id
    WHERE q.id = ?
  `).get(id);

  if (!quotation) {
    return <div className="text-center py-12 text-gray-500">Quotation not found</div>;
  }

  const items = await db.prepare(`
    SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC
  `).all(id);

  const trip = await db.prepare('SELECT * FROM trips WHERE id = ?').get(quotation.trip_id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-lg">{quotation.reference}</span>
            <span className="text-sm text-gray-500">Version {quotation.version}</span>
            <CRMStatusBadge status={quotation.status} type="quotation" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Quotation</h1>
          <p className="text-gray-500 mt-1">For trip {quotation.trip_reference}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/crm/api/quotations/${id}/pdf`}
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
          <a
            href={`https://wa.me/${quotation.customer_phone?.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Send WhatsApp
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1 block">Date</label>
                <p className="text-gray-900">{new Date(quotation.quotation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1 block">Valid Until</label>
                <p className="text-gray-900">{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1 block">Prepared By</label>
                <p className="text-gray-900">{quotation.prepared_by_name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1 block">Sent Via</label>
                <p className="text-gray-900 capitalize">{quotation.sent_via || 'Not sent yet'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Details</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{item.category}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.description}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{item.details || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(item.amount * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-green-700">
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-900">Subtotal</td>
                    <td colSpan={2} className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(quotation.subtotal || 0)}</td>
                  </tr>
                  {quotation.discount > 0 && (
                    <tr className="border-t border-gray-100">
                      <td colSpan={3} className="px-4 py-2 text-right text-green-600">Discount</td>
                      <td colSpan={2} className="px-4 py-2 text-right text-green-600 font-medium">- {formatCurrency(quotation.discount)}</td>
                    </tr>
                  )}
                  {quotation.tax > 0 && (
                    <tr className="border-t border-gray-100">
                      <td colSpan={3} className="px-4 py-2 text-right text-gray-600">Tax</td>
                      <td colSpan={2} className="px-4 py-2 text-right text-gray-600 font-medium">{formatCurrency(quotation.tax)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900">Final Amount</td>
                    <td colSpan={2} className="px-4 py-3 text-right font-bold text-green-700 text-lg">{formatCurrency(quotation.final_amount || 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {quotation.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{quotation.notes}</p>
            </div>
          )}

          {quotation.terms && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Terms & Conditions</h2>
              <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{quotation.terms}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700">
                  {quotation.customer_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{quotation.customer_name}</p>
                  {quotation.customer_phone && (
                    <a href={`https://wa.me/${quotation.customer_phone.replace(/\D/g, '')}`} className="text-sm text-green-700 hover:underline">
                      {quotation.customer_phone}
                    </a>
                  )}
                  {quotation.customer_email && (
                    <a href={`mailto:${quotation.customer_email}`} className="text-sm text-blue-600 hover:underline">
                      {quotation.customer_email}
                    </a>
                  )}
                </div>
              </div>
              {quotation.customer_city && (
                <div className="text-sm text-gray-500">{quotation.customer_city}</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Reference</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Trip Ref</span>
                <Link href={`/crm/leads/${quotation.trip_id}`} className="text-green-700 font-medium hover:underline">
                  {quotation.trip_reference}
                </Link>
              </div>
              {quotation.trip_destination && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Destination</span>
                  <span className="text-sm text-gray-900">{quotation.trip_destination}</span>
                </div>
              )}
              {quotation.trip_start_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Travel Dates</span>
                  <span className="text-sm text-gray-900">
                    {new Date(quotation.trip_start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {quotation.trip_end_date ? ' - ' + new Date(quotation.trip_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
              )}
              {quotation.trip_total_pax && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Travelers</span>
                  <span className="text-sm text-gray-900">{quotation.trip_total_pax} pax</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Final Amount</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(quotation.final_amount || 0)}</p>
              </div>
              <a
                href={`/crm/api/quotations/${id}/pdf`}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-green-500 px-4 py-2 rounded-lg text-sm font-medium text-green-700 hover:text-green-800 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Preview
              </a>
            </div>
            <div className="space-y-2">
              <a
                href={`/crm/api/quotations/${id}/pdf`}
                download={`${quotation.reference}.pdf`}
                className="flex w-full items-center justify-center gap-2 bg-white border border-gray-200 hover:border-green-500 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
