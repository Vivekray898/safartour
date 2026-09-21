"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Plus, Trash2, Building2, Upload, X, Percent, Landmark, FileText, Loader2 } from 'lucide-react';

interface CompanySettings {
  company_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  gst_enabled: number;
  gst_rate: number;
  gstin: string | null;
  gst_legal_name: string | null;
  gst_state: string | null;
  gst_state_code: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  upi_id: string | null;
  payment_terms: string | null;
  cancellation_policy: string | null;
  terms_conditions: string | null;
  pdf_footer_text: string | null;
  quotation_prefix: string;
}

type CompanyKey = keyof CompanySettings;

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

function Field({ label, name, value, onChange, type = 'text', placeholder, required }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={`cs-${name}`} className={labelCls}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={`cs-${name}`}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}

function TextArea({ label, name, value, onChange, rows = 3, placeholder }: {
  label: string; name: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={`cs-${name}`} className={labelCls}>{label}</label>
      <textarea
        id={`cs-${name}`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Array<{
    id: number; name: string; email: string; phone: string | null;
    role: string; is_active: number; created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [storageOk, setStorageOk] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [sectionMessage, setSectionMessage] = useState<{ section: string; ok: boolean; text: string } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: CompanyKey) => (v: string) =>
    setCompany(prev => (prev ? { ...prev, [key]: v } : prev));

  useEffect(() => {
    fetch('/crm/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setUsers(data.users || []);
          setCompany(data.company || null);
          setStorageOk(data.storageConfigured !== false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveCompanySection = async (section: string, keys: CompanyKey[]) => {
    if (!company) return;
    setSavingSection(section);
    setSectionMessage(null);
    try {
      const values: Partial<Record<CompanyKey, string | number>> = {};
      for (const key of keys) values[key] = company[key];
      const res = await fetch('/crm/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateCompany', values }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not save settings');
      if (data.company) setCompany(data.company);
      setSectionMessage({ section, ok: true, text: 'Saved' });
      router.refresh();
    } catch (e) {
      setSectionMessage({ section, ok: false, text: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSavingSection(null);
      setTimeout(() => setSectionMessage(null), 4000);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/crm/api/settings/logo', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Upload failed');
      setCompany(prev => (prev ? { ...prev, logo_url: data.logo_url } : prev));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogoRemove = async () => {
    if (!confirm('Remove the company logo? Quotation PDFs will use the text-only header.')) return;
    setUploadingLogo(true);
    try {
      const res = await fetch('/crm/api/settings/logo?action=remove', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Remove failed');
      setCompany(prev => (prev ? { ...prev, logo_url: null } : prev));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Remove failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/crm/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createUser',
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone') || null,
          password: formData.get('password'),
          role: formData.get('role'),
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
    } catch {
      alert('An error occurred');
    }
  };

  const handleToggleUser = async (userId: number, currentStatus: number) => {
    const res = await fetch('/crm/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateUser', userId, is_active: !currentStatus }),
    });
    const data = await res.json();
    if (data.ok) setUsers(prev => prev.map(u => (u.id === userId ? data.user as typeof prev[0] : u)));
    else alert(data.error || 'Failed to update user');
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    const res = await fetch('/crm/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteUser', userId }),
    });
    const data = await res.json();
    if (data.ok) setUsers(prev => prev.filter(u => u.id !== userId));
    else alert(data.error || 'Failed to delete user');
  };

  const sectionKeys: Record<string, CompanyKey[]> = {
    company: ['company_name', 'address', 'phone', 'whatsapp', 'email', 'website'],
    gst: ['gst_enabled', 'gst_rate', 'gstin', 'gst_legal_name', 'gst_state', 'gst_state_code'],
    banking: ['bank_name', 'bank_account_name', 'bank_account_number', 'bank_ifsc', 'upi_id'],
    pdf: ['payment_terms', 'cancellation_policy', 'terms_conditions', 'pdf_footer_text', 'quotation_prefix'],
  };

  // Lowercase render helper (not a component) so the save bar can close over
  // state without being recreated during render.
  const renderSaveBar = (section: string, label: string) => (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        onClick={() => saveCompanySection(section, sectionKeys[section])}
        disabled={savingSection !== null}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
      >
        {savingSection === section && <Loader2 className="w-4 h-4 animate-spin" />}
        {savingSection === section ? 'Saving...' : `Save ${label}`}
      </button>
      {sectionMessage?.section === section && (
        <span className={`text-sm ${sectionMessage.ok ? 'text-green-700' : 'text-red-600'}`} role="status">
          {sectionMessage.text}
        </span>
      )}
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading settings...</div>;
  }

  const gstOn = (company?.gst_enabled ?? 0) === 1;

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Company profile, PDF branding and CRM users</p>
      </div>

      {/* ---- Company profile + logo ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-gray-500" />
            Company Profile
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name" name="company_name" value={company?.company_name ?? ''} onChange={set('company_name')} required />
            <Field label="Website" name="website" value={company?.website ?? ''} onChange={set('website')} placeholder="https://..." />
            <Field label="Phone" name="phone" value={company?.phone ?? ''} onChange={set('phone')} type="tel" />
            <Field label="WhatsApp" name="whatsapp" value={company?.whatsapp ?? ''} onChange={set('whatsapp')} type="tel" />
            <Field label="Email" name="email" value={company?.email ?? ''} onChange={set('email')} type="email" />
            <div />
            <div className="sm:col-span-2">
              <TextArea label="Address" name="address" value={company?.address ?? ''} onChange={set('address')} rows={2} />
            </div>
          </div>
          {renderSaveBar('company', 'Company Profile')}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo</h2>
          {company?.logo_url ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center bg-gray-50">
                <img src={company.logo_url} alt="Company logo" className="max-h-24 max-w-full object-contain" />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo || !storageOk}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Replace Logo
                </button>
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  disabled={uploadingLogo}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Remove Logo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">PNG, JPG or WebP — max 2 MB</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo || !storageOk}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleLogoUpload(file);
            }}
          />
          {!storageOk && (
            <p className="mt-3 text-xs text-amber-600">
              Supabase Storage keys are not configured on the server — logo upload is unavailable.
            </p>
          )}
        </div>
      </div>

      {/* ---- GST ---- */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-gray-500" />
          GST / Tax
        </h2>
        <label className="flex items-center gap-2 mb-4 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={gstOn}
            onChange={e => setCompany(prev => (prev ? { ...prev, gst_enabled: e.target.checked ? 1 : 0 } : prev))}
            className="w-4 h-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
          />
          Charge GST on quotations (shown as &ldquo;GST @ N%&rdquo; on the PDF)
        </label>
        {gstOn && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default GST Rate (%)" name="gst_rate" value={String(company?.gst_rate ?? 5)} onChange={v => setCompany(prev => (prev ? { ...prev, gst_rate: Math.max(0, Math.min(28, parseInt(v) || 0)) } : prev))} type="number" />
            <Field label="GSTIN" name="gstin" value={company?.gstin ?? ''} onChange={set('gstin')} />
            <Field label="Legal Name" name="gst_legal_name" value={company?.gst_legal_name ?? ''} onChange={set('gst_legal_name')} />
            <Field label="State" name="gst_state" value={company?.gst_state ?? ''} onChange={set('gst_state')} />
            <Field label="State Code" name="gst_state_code" value={company?.gst_state_code ?? ''} onChange={set('gst_state_code')} />
          </div>
        )}
        {renderSaveBar('gst', 'GST Settings')}
      </div>

      {/* ---- Banking ---- */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Landmark className="w-5 h-5 text-gray-500" />
          Banking / Payment Details
          <span className="text-xs font-normal text-gray-400">(optional — appears on the quotation PDF)</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank Name" name="bank_name" value={company?.bank_name ?? ''} onChange={set('bank_name')} />
          <Field label="Account Name" name="bank_account_name" value={company?.bank_account_name ?? ''} onChange={set('bank_account_name')} />
          <Field label="Account Number" name="bank_account_number" value={company?.bank_account_number ?? ''} onChange={set('bank_account_number')} />
          <Field label="IFSC" name="bank_ifsc" value={company?.bank_ifsc ?? ''} onChange={set('bank_ifsc')} />
          <Field label="UPI ID" name="upi_id" value={company?.upi_id ?? ''} onChange={set('upi_id')} />
        </div>
        {renderSaveBar('banking', 'Banking Details')}
      </div>

      {/* ---- PDF footer / terms ---- */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-500" />
          Quotation PDF & Footer
        </h2>
        <div className="space-y-4">
          <TextArea label="Payment Terms" name="payment_terms" value={company?.payment_terms ?? ''} onChange={set('payment_terms')} placeholder="e.g. 50% advance to confirm the booking; balance before departure." />
          <TextArea label="Cancellation Policy" name="cancellation_policy" value={company?.cancellation_policy ?? ''} onChange={set('cancellation_policy')} />
          <TextArea label="Terms & Conditions" name="terms_conditions" value={company?.terms_conditions ?? ''} onChange={set('terms_conditions')} rows={4} />
          <TextArea label="Custom Footer Text" name="pdf_footer_text" value={company?.pdf_footer_text ?? ''} onChange={set('pdf_footer_text')} rows={2} />
          <Field label="Quotation Number Prefix" name="quotation_prefix" value={company?.quotation_prefix ?? 'QT'} onChange={v => setCompany(prev => (prev ? { ...prev, quotation_prefix: v.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6) } : prev))} />
          <p className="text-xs text-gray-500">New quotations will be numbered like {company?.quotation_prefix || 'QT'}-2026-0001.</p>
        </div>
        {renderSaveBar('pdf', 'PDF Settings')}
      </div>

      {/* ---- Users (preserved) ---- */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gray-500" />
          Users
        </h2>
        <form onSubmit={handleCreateUser} className="space-y-4 mb-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Name</label>
              <input type="text" name="name" required className={inputCls} placeholder="Full name" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" name="email" required className={inputCls} placeholder="email@example.com" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone</label>
              <input type="tel" name="phone" className={inputCls} placeholder="+91 98XXX XXXXX" />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select name="role" className={inputCls}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input type="password" name="password" required minLength={6} className={inputCls} placeholder="Minimum 6 characters" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </form>

        {users.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No users found</div>
        ) : (
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <div className="text-xs text-gray-500 truncate">
                      <span className="font-medium">{user.email}</span>
                      {user.phone && <span> | {user.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.role}
                  </span>
                  <button
                    onClick={() => handleToggleUser(user.id, user.is_active)}
                    aria-label={user.is_active ? 'Deactivate user' : 'Activate user'}
                    className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    <span className={`block w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  </button>
                  {user.id !== users[0]?.id && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      aria-label="Delete user"
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
    </div>
  );
}
