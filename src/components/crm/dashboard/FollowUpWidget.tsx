import Link from 'next/link';
import { Calendar, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { CRM_FOLLOWUP_TYPES } from '@/config/crm';
import { formatCRMDate } from '@/lib/crm/format';

interface FollowUpWidgetProps {
  overdue: Array<{
    id: number;
    trip_id: number;
    scheduled_date: string;
    scheduled_time: string | null;
    followup_type: string;
    note: string | null;
    trip_reference: string;
    customer_name: string | null;
    destination: string | null;
  }>;
  today: Array<{
    id: number;
    trip_id: number;
    scheduled_time: string | null;
    followup_type: string;
    note: string | null;
    trip_reference: string;
    customer_name: string | null;
    destination: string | null;
    status: string;
  }>;
}

export default function FollowUpWidget({ overdue, today }: FollowUpWidgetProps) {
  const followupTypeLabels: Record<string, string> = {
    call: 'Call',
    whatsapp: 'WhatsApp',
    email: 'Email',
    meeting: 'Meeting',
    other: 'Other',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Follow-ups</h2>
      </div>

      <div className="divide-y divide-gray-50">
        {overdue.length > 0 && (
          <div className="py-3">
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Overdue ({overdue.length})</span>
            </div>
            <div className="space-y-1.5">
              {overdue.map(f => (
                <Link
                  key={f.id}
                  href={`/crm/leads/${f.trip_id}`}
                  className="flex items-center justify-between gap-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-red-900 truncate">{f.customer_name || f.trip_reference || 'Unknown'}</div>
                    <div className="text-xs text-red-600 truncate mt-0.5">
                      {f.destination || f.trip_reference || ''} — {followupTypeLabels[f.followup_type] || f.followup_type}
                    </div>
                  </div>
                  <div className="text-xs text-red-600 font-medium whitespace-nowrap shrink-0">
                    {formatCRMDate(f.scheduled_date)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="py-3">
          <div className="flex items-center gap-2 text-amber-600 text-sm font-medium mb-2">
            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Today ({today.length})</span>
          </div>
          {today.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
              No follow-ups scheduled for today
            </div>
          ) : (
            <div className="space-y-1.5">
              {today.map(f => (
                <Link
                  key={f.id}
                  href={`/crm/leads/${f.trip_id}`}
                  className="flex items-center justify-between gap-2 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-amber-900 truncate">{f.customer_name || f.trip_reference || 'Unknown'}</div>
                    <div className="text-xs text-amber-600 truncate mt-0.5">
                      {f.destination || f.trip_reference || ''} — {followupTypeLabels[f.followup_type] || f.followup_type}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 whitespace-nowrap shrink-0">
                    {f.scheduled_time && <span>{f.scheduled_time}</span>}
                    {f.note && <span className="truncate max-w-[80px]">• {f.note}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <Link
          href="/crm/followups"
          className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
        >
          View all follow-ups
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
