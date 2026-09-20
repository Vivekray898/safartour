"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/crm/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.ok) {
        router.push('/crm');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">ST</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Safar Tours</h1>
              <p className="text-sm text-green-200">CRM</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Manage your travel business
            <br />
            from one place
          </h2>
          <p className="text-green-200 text-lg">
            Track leads, quotations, payments, and trips all in one CRM.
          </p>

          <div className="grid gap-4 pt-4">
            <div className="flex items-center gap-3 text-green-200">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-white">Quick access</div>
                <div className="text-sm">Dashboard, leads, customers, quotations</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-green-200">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-white">Secure & private</div>
                <div className="text-sm">Only your team can access</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-green-300">
          Safar Tours & Travels — Internal CRM System
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-green-700 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">ST</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Safar Tours CRM</h1>
            <p className="text-gray-500 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="admin@safartour.crm"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">Demo credentials:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Admin:</strong> admin@safartour.crm / admin123</p>
              <p><strong>Employee:</strong> rajesh@safartour.crm / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
