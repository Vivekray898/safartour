import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'green' | 'amber' | 'red' | 'gray';
  href?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-200', border: 'border-l-blue-400' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-200', border: 'border-l-purple-400' },
  green: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-200', border: 'border-l-green-400' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200', border: 'border-l-amber-400' },
  red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200', border: 'border-l-red-400' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', ring: 'ring-gray-200', border: 'border-l-gray-400' },
};

export default function MetricCard({ title, value, icon: Icon, color, href }: MetricCardProps) {
  const c = colorMap[color];
  const content = (
    <div
      className={`relative rounded-lg border border-gray-200 border-l-4 ${c.border} bg-white p-4 transition-shadow hover:shadow-sm ${href ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
        </div>
        <div className={`shrink-0 w-9 h-9 rounded-lg ${c.bg} ${c.text} flex items-center justify-center ring-1 ${c.ring} transition-transform hover:scale-105`}>
          <Icon className="w-4.5 h-4.5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return <div className="block">{content}</div>;
}
