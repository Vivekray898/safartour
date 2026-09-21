import Link from 'next/link';
import { Calendar, Users, Car, Clock } from 'lucide-react';
import { formatCurrency } from '@/config/crm';
import { formatCRMDate } from '@/lib/crm/format';
import { CRMStatusBadge } from '@/components/crm/common/CRMStatusBadge';

interface UpcomingTripsListProps {
  trips: Array<{
    id: number;
    reference: string;
    start_date: string | null;
    end_date: string | null;
    total_pax: number | null;
    customer_name: string | null;
    customer_phone: string | null;
    destination: string | null;
    vehicle_type: string | null;
    status: string;
    quoted_amount: number | null;
    paid_amount: number | null;
  }>;
}

export default function UpcomingTripsList({ trips }: UpcomingTripsListProps) {
  const formatDate = (date: string | null) => formatCRMDate(date, 'N/A');

  const getVehicleLabel = (vehicle: string | null) => {
    if (!vehicle) return 'Not assigned';
    return vehicle.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
        <Link
          href="/crm/leads?status=booked"
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          View all →
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No upcoming trips scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => {
            const pending = (trip.quoted_amount || 0) - (trip.paid_amount || 0);

            return (
              <Link
                key={trip.id}
                href={`/crm/leads/${trip.id}`}
                className="block p-3 border border-gray-100 rounded-lg hover:border-green-200 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        {formatDate(trip.start_date)}
                      </span>
                      <span className="text-xs text-gray-500">{trip.reference}</span>
                    </div>
                    <div className="font-semibold text-gray-900 truncate">{trip.customer_name || 'No customer'}</div>
                    <div className="text-sm text-gray-600 truncate">{trip.destination || 'No destination'}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="text-sm font-medium text-gray-900">{trip.total_pax || 0} pax</div>
                    {pending > 0 && (
                      <div className="text-xs text-red-600 mt-0.5">{formatCurrency(pending)} pending</div>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-gray-50">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {trip.start_date ? formatDate(trip.start_date) + ' - ' + (trip.end_date ? formatDate(trip.end_date) : 'N/A') : 'No dates'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    {getVehicleLabel(trip.vehicle_type)}
                  </span>
                  <CRMStatusBadge status={trip.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
