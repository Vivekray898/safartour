"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CRMTopBarProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export default function CRMTopBar({ user }: CRMTopBarProps) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{
    customers: Array<{ id: number; name: string; phone: string | null; email: string | null; type: string }>;
    trips: Array<{ id: number; reference: string; customer_name: string | null; destination: string | null; status: string; type: string }>;
    quotations: Array<{ id: number; reference: string; customer_name: string | null; status: string; type: string }>;
  } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults(null);
      return;
    }

    try {
      const res = await fetch(`/crm/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.ok) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      handleSearch(search);
    }, 300);
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search]);

  const handleSearchResultClick = (result: { id: number; type: string }) => {
    setSearch('');
    setSearchResults(null);
    setShowSearch(false);
    if (result.type === 'customer') {
      router.push(`/crm/customers/${result.id}`);
    } else if (result.type === 'trip') {
      router.push(`/crm/leads/${result.id}`);
    } else if (result.type === 'quotation') {
      router.push(`/crm/quotations/${result.id}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-500" />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers, trips, quotes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80 pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-700">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{customer.name}</div>
                          <div className="text-xs text-gray-500 truncate">{customer.phone || customer.email || customer.type}</div>
                        </div>
                        <span className="text-xs text-gray-400">{customer.type}</span>
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
                        <span className="text-xs text-gray-400">{trip.type}</span>
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
                        <span className="text-xs text-gray-400">{quotation.type}</span>
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

        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-lg hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-700">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-sm">
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500 capitalize">{user.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
