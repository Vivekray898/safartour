import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_DOCUMENT_TYPES } from '@/config/crm';
import { formatCRMDate } from '@/lib/crm/format';
import CRMEmptyState from '@/components/crm/common/CRMEmptyState';
import Link from 'next/link';
import { FileText, Download } from 'lucide-react';

export default async function DocumentsPage() {
  const session = await requireAuth();
  const db = getDb();

  const documents = await db.prepare(`
    SELECT d.*,
      t.reference as trip_reference,
      c.name as customer_name,
      u.name as uploaded_by_name
    FROM documents d
    LEFT JOIN trips t ON d.trip_id = t.id
    LEFT JOIN customers c ON d.customer_id = c.id
    LEFT JOIN users u ON d.uploaded_by = u.id
    ORDER BY d.created_at DESC
    LIMIT 100
  `).all();

  const documentTypeLabels: Record<string, string> = {
    id_proof: 'ID Proof',
    passport: 'Passport',
    visa: 'Visa',
    permit: 'Permit',
    ticket: 'Ticket',
    hotel_voucher: 'Hotel Voucher',
    payment_receipt: 'Payment Receipt',
    quotation: 'Quotation',
    invoice: 'Invoice',
    itinerary: 'Itinerary',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500">{documents.length} documents</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-0 py-0">
                    <CRMEmptyState
                      icon={FileText}
                      title="No documents uploaded"
                      description="ID proofs, tickets, vouchers and other trip documents uploaded from a trip's page will appear here."
                    />
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{doc.file_name}</span>
                          <p className="text-xs text-gray-500">{doc.notes || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {documentTypeLabels[doc.document_type] || doc.document_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {doc.trip_reference ? (
                        <Link href={`/crm/leads/${doc.trip_id}`} className="text-sm font-medium text-green-700 hover:text-green-800">
                          {doc.trip_reference}
                        </Link>
                      ) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{doc.customer_name || doc.trip_reference || 'No customer'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.uploaded_by_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatCRMDate(doc.created_at, '—')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {(doc.file_size || 0) > 1024 * 1024
                        ? `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`
                        : `${(doc.file_size / 1024).toFixed(0)} KB`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
