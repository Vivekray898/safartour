"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Plus, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Array<{
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    is_active: number;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/crm/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setUsers(data.users || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    try {
      const res = await fetch('/crm/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createUser',
          name,
          email,
          phone: phone || null,
          password,
          role,
          is_active: true,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setUsers(prev => [data.user as typeof prev[0], ...prev]);
        e.currentTarget.reset();
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('An error occurred');
    }
  };

  const handleToggleUser = async (userId: number, currentStatus: number) => {
    try {
      const res = await fetch('/crm/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateUser',
          userId,
          is_active: !currentStatus,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? data.user as typeof prev[0] : u));
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error toggling user:', error);
      alert('An error occurred');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/crm/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteUser',
          userId,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage CRM settings and users</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Users
            </h2>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+91 98XXX XXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Minimum 6 characters"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </form>

          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No users found</div>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">{user.email}</span>
                        {user.phone && <span> | {user.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.role}
                    </span>
                    <button
                      onClick={() => handleToggleUser(user.id, user.is_active)}
                      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                        user.is_active ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    </button>
                    {user.id !== users[0]?.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">CRM Settings</h2>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">General</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Currency</span>
                  <span className="font-medium text-gray-900">INR (₹)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Date Format</span>
                  <span className="font-medium text-gray-900">DD/MM/YYYY</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Timezone</span>
                  <span className="font-medium text-gray-900">Asia/Kolkata (IST)</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Security</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Session Timeout</span>
                  <span className="font-medium text-gray-900">30 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Maximum File Size</span>
                  <span className="font-medium text-gray-900">10 MB</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Notifications</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Require Lost Reason</span>
                  <span className="font-medium text-gray-900">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Require Cancellation Reason</span>
                  <span className="font-medium text-gray-900">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
