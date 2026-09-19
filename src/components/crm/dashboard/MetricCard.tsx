import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'green' | 'amber' | 'red' | 'gray';
  href?: string;
}

const colors = {
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-gray-50 text-gray-600',
};

const borderColors = {
  blue: 'border-blue-200',
  purple: 'border-purple-200',
  green: 'border-green-200',
  amber: 'border-amber-200',
  red: 'border-red-200',
  gray: 'border-gray-200',
};

export default function MetricCard({ title, value, icon: Icon, color, href }: MetricCardProps) {
  const content = (
    <div className={`rounded-lg border ${borderColors[color]} bg-white p-4 ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return <div className="block">{content}</div>;
}
