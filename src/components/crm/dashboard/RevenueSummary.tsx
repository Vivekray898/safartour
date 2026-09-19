import { formatCurrency } from '@/config/crm';
import { TrendingUp, DollarSign, CheckCircle, Clock } from 'lucide-react';

interface RevenueSummaryProps {
  revenue: {
    quoted: { total: number };
    booked: { total: number };
    collected: { total: number };
    pending: number;
  };
}

export default function RevenueSummary({ revenue }: RevenueSummaryProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Quoted Value</p>
              <p className="text-xs text-green-600">Total accepted quotations</p>
            </div>
          </div>
          <p className="text-xl font-bold text-green-700">
            {formatCurrency(revenue.quoted.total)}
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Booked Value</p>
              <p className="text-xs text-blue-600">Confirmed trips</p>
            </div>
          </div>
          <p className="text-xl font-bold text-blue-700">
            {formatCurrency(revenue.booked.total)}
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">Amount Collected</p>
              <p className="text-xs text-emerald-600">Payments received</p>
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-700">
            {formatCurrency(revenue.collected.total)}
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="text-sm text-amber-700 font-medium">Amount Pending</p>
              <p className="text-xs text-amber-600">Still to be collected</p>
            </div>
          </div>
          <p className="text-xl font-bold text-amber-700">
            {formatCurrency(revenue.pending)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Collection Rate:</span>
          <span className="font-semibold text-gray-900">
            {revenue.booked.total > 0
              ? Math.round((revenue.collected.total / revenue.booked.total) * 100)
              : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
