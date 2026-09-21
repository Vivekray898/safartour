"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Users, FileText, Calendar, CreditCard, CheckSquare,
  FolderOpen, PenTool, Building2, Truck, Briefcase, Settings, LogOut,
  BarChart3, HardDrive, Search, Bell, Menu, X,
} from 'lucide-react';

interface CRMUser {
  id: number;
  name: string;
  email: string;
  role: string;
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

function NavLinks({
  user,
  pathname,
  onNavigate,
  layout,
}: {
  user: CRMUser;
  pathname: string;
  onNavigate?: () => void;
  layout: 'drawer' | 'rail';
}) {
  const items = navItems.filter(item => item.roles.includes(user.role));
  return (
    <nav
      className={
        layout === 'rail'
          ? 'flex-1 px-2 py-4 space-y-1 overflow-y-auto'
          : 'flex-1 px-3 py-4 space-y-1 overflow-y-auto'
      }
    >
      {items.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
              layout === 'rail'
                ? 'justify-center p-2.5'
                : 'gap-3 px-3 py-2.5'
            } ${
              isActive
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
            {layout === 'drawer' && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  user,
  layout,
  onLogout,
}: {
  user: CRMUser;
  layout: 'drawer' | 'rail';
  onLogout: () => void;
}) {
  return (
    <div className={`py-4 border-t border-gray-200 ${layout === 'rail' ? 'px-2' : 'px-3'}`}>
      {layout === 'drawer' && (
        <div className="flex items-center gap-3 px-3 py-2 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onLogout}
        title="Sign out"
        className={`flex items-center gap-2 px-3 py-2 mt-1 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
          layout === 'rail' ? 'justify-center' : 'w-full'
        }`}
      >
        <LogOut className="w-4 h-4 shrink-0" />
        {layout === 'drawer' && 'Sign out'}
      </button>
    </div>
  );
}

function Brand({ layout }: { layout: 'drawer' | 'rail' }) {
  return (
    <div className={`flex items-center gap-3 py-4 border-b border-gray-200 ${
      layout === 'rail' ? 'justify-center px-2' : 'px-5'
    }`}>
      <div className="w-8 h-8 shrink-0 rounded-lg bg-green-700 flex items-center justify-center">
        <span className="text-white font-bold text-sm">ST</span>
      </div>
      {layout === 'drawer' && (
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 text-sm">Safar Tours</div>
          <div className="text-xs text-gray-500">CRM</div>
        </div>
      )}
    </div>
  );
}

export default function CRMShell({
  user,
  children,
}: {
  user: CRMUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    customers: Array<{ id: number; name: string; phone: string | null; email: string | null; type: string }>;
    trips: Array<{ id: number; reference: string; customer_name: string | null; destination: string | null; status: string; type: string }>;
    quotations: Array<{ id: number; reference: string; customer_name: string | null; status: string; type: string }>;
  } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Close the drawer whenever the route changes (mobile nav → content visible).
  // Adjusting state during render (React's derived-state pattern) instead of
  // an effect: no cascading render, and it also covers back/forward nav.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setDrawerOpen(false);
  }

  // Escape closes the drawer and returns focus to the menu button.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Lock background scroll + simple focus trap while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const drawer = drawerRef.current;
    const focusables = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    focusables?.[0]?.focus();
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !drawer || focusables!.length === 0) return;
      const first = focusables![0];
      const last = focusables![focusables!.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onTab);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onTab);
    };
  }, [drawerOpen]);

  const runSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await fetch(`/crm/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.ok) setSearchResults(data.results);
    } catch (error) {
      console.error('Search error:', error);
    }
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => runSearch(search), 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, runSearch]);

  // Full client navigation after the session cookie is cleared; refresh()
  // drops the cached RSC payload so nothing authenticated lingers.
  const handleLogout = useCallback(() => {
    fetch('/crm/api/auth/logout', { method: 'POST' })
      .catch(() => {})
      .finally(() => {
        router.push('/crm/login');
        router.refresh();
      });
  }, [router]);

  const handleSearchResultClick = (result: { id: number; type: string }) => {
    setSearch('');
    setSearchResults(null);
    setShowSearch(false);
    if (result.type === 'customer') router.push(`/crm/customers/${result.id}`);
    else if (result.type === 'trip') router.push(`/crm/leads/${result.id}`);
    else if (result.type === 'quotation') router.push(`/crm/quotations/${result.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip link for keyboard users */}
      <a
        href="#crm-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:m-2 focus:rounded-lg focus:border"
      >
        Skip to content
      </a>

      {/* Desktop icon rail */}
      <aside className="hidden md:flex md:flex-col md:w-16 lg:w-56 bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 z-30">
        <Brand layout="rail" />
        <NavLinks user={user} pathname={pathname} layout="rail" />
        <SidebarFooter user={user} layout="rail" onLogout={handleLogout} />
      </aside>

      {/* Mobile slide-over drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="CRM navigation">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setDrawerOpen(false); menuButtonRef.current?.focus(); }}
            aria-hidden
          />
          <div
            ref={drawerRef}
            className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between pr-2">
              <div className="flex-1 min-w-0"><Brand layout="drawer" /></div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <NavLinks user={user} pathname={pathname} layout="drawer" onNavigate={() => setDrawerOpen(false)} />
            <SidebarFooter user={user} layout="drawer" onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Content column — padding always matches the rail width */}
      <div className="md:pl-16 lg:pl-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5 text-gray-500" />
              </button>
              <div className="relative min-w-0 flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search customers, trips, quotes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                />

                {showSearch && searchResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-auto z-50">
                    {searchResults.customers.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</div>
                        {searchResults.customers.map(customer => (
                          <button
                            key={customer.id}
                            onClick={() => handleSearchResultClick(customer)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
                          >
                            <div className="w-7 h-7 shrink-0 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-700">
                              {customer.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{customer.name}</div>
                              <div className="text-xs text-gray-500 truncate">{customer.phone || customer.email || customer.type}</div>
                            </div>
                            <span className="text-xs text-gray-400 hidden sm:inline">{customer.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.trips.length > 0 && (
                      <div className="py-1 border-t border-gray-100">
                        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Trips</div>
                        {searchResults.trips.map(trip => (
                          <button
                            key={trip.id}
                            onClick={() => handleSearchResultClick(trip)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">{trip.reference}</div>
                              <div className="text-xs text-gray-500 truncate">{trip.customer_name || trip.destination || 'No customer'}</div>
                            </div>
                            <span className="text-xs text-gray-400 hidden sm:inline">{trip.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.quotations.length > 0 && (
                      <div className="py-1 border-t border-gray-100">
                        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Quotations</div>
                        {searchResults.quotations.map(quotation => (
                          <button
                            key={quotation.id}
                            onClick={() => handleSearchResultClick(quotation)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">{quotation.reference}</div>
                              <div className="text-xs text-gray-500 truncate">{quotation.customer_name || 'No customer'}</div>
                            </div>
                            <span className="text-xs text-gray-400 hidden sm:inline">{quotation.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.customers.length === 0 && searchResults.trips.length === 0 && searchResults.quotations.length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">No results found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button type="button" aria-label="Notifications" className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-700 shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-sm leading-tight">
                  <div className="font-medium text-gray-900 max-w-[10rem] truncate">{user.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main id="crm-main" className="flex-1 p-4 sm:p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
