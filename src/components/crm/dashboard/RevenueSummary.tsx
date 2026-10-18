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
  const rows = [
    {
      label: 'Quoted Value',
      sub: 'Total accepted quotations',
      amount: revenue.quoted.total,
      amountClass: 'text-green-700',
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-700',
      icon: TrendingUp,
    },
    {
      label: 'Booked Value',
      sub: 'Confirmed trips',
      amount: revenue.booked.total,
      amountClass: 'text-blue-700',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      icon: DollarSign,
    },
    {
      label: 'Amount Collected',
      sub: 'Payments received',
      amount: revenue.collected.total,
      amountClass: 'text-emerald-700',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      icon: CheckCircle,
    },
    {
      label: 'Amount Pending',
      sub: 'Still to be collected',
      amount: revenue.pending,
      amountClass: 'text-amber-700',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      icon: Clock,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Revenue Summary</h2>
      </div>

      <div className="divide-y divide-gray-50">
        {rows.map(row => (
          <div key={row.label} className={`flex items-center justify-between p-3 ${row.bg} rounded-lg m-3`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-lg ${row.iconBg} flex items-center justify-center shrink-0`}>
                <row.icon className={`w-4 h-4 ${row.iconColor}`} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${row.amountClass}`}>{row.label}</p>
                <p className={`text-xs ${row.amountClass.replace('700', '600')}`}>{row.sub}</p>
              </div>
            </div>
            <p className={`text-lg font-bold ${row.amountClass} tabular-nums shrink-0 ml-3`}>
              {formatCurrency(row.amount)}
            </p>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-500">Collection Rate</span>
        <span className="font-semibold text-gray-900 tabular-nums">
          {revenue.booked.total > 0
            ? Math.round((revenue.collected.total / revenue.booked.total) * 100)
            : 0}%
        </span>
      </div>
    </div>
  );
}
