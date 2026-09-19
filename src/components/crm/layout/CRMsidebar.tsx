"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Calendar, CreditCard, CheckSquare, FolderOpen, PenTool, HardDrive, Building2, Truck, Briefcase, Settings, LogOut, BarChart3 } from 'lucide-react';
import { CRMStatusBadge } from '@/components/crm/common/CRMStatusBadge';
import { useSearchParams } from 'next/navigation';

interface CRMsidebarProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

const navItems = [
  { href: '/crm', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'employee'] },
  { href: '/crm/leads', icon: FileText, label: 'Leads', roles: ['admin', 'employee'] },
  { href: '/crm/customers', icon: Users, label: 'Customers', roles: ['admin', 'employee'] },
  { href: '/crm/quotations', icon: PenTool, label: 'Quotations', roles: ['admin', 'employee'] },
  { href: '/crm/payments', icon: CreditCard, label: 'Payments', roles: ['admin', 'employee'] },
  { href: '/crm/followups', icon: Calendar, label: 'Follow-ups', roles: ['admin', 'employee'] },
  { href: '/crm/tasks', icon: CheckSquare, label: 'Tasks', roles: ['admin', 'employee'] },
  { href: '/crm/documents', icon: FolderOpen, label: 'Documents', roles: ['admin', 'employee'] },
  { href: '/crm/itineraries', icon: Briefcase, label: 'Itineraries', roles: ['admin', 'employee'] },
  { href: '/crm/hotels', icon: Building2, label: 'Hotels', roles: ['admin'] },
  { href: '/crm/suppliers', icon: HardDrive, label: 'Suppliers', roles: ['admin'] },
  { href: '/crm/drivers', icon: Truck, label: 'Drivers', roles: ['admin'] },
  { href: '/crm/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
  { href: '/crm/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
];

export default function CRMsidebar({ user }: CRMsidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user.role)
  );

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-56 bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 z-30">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center">
          <span className="text-white font-bold text-sm">ST</span>
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">Safar Tours</div>
          <div className="text-xs text-gray-500">CRM</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
        <Link
          href="/crm/api/auth/logout"
          className="flex items-center gap-2 px-3 py-2 mt-1 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          onClick={() => {
            fetch('/crm/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/crm/login');
          }}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Link>
      </div>
    </aside>
  );
}
