"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Prsc, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { CRM_DESTINATIONS, CRM_LEAD_SOURCES } from '@/config/crm';
import { generateTripReference } from '@/config/crm';

export default function QuickLeadPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tripRef, setTripRef] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    destination: '',
    source: 'website',
    email: '',
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (stepNum: number) => {
    setLoading(true);
    setError('');

    try {
      if (stepNum === 1) {
        const res = await fetch('/crm/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            whatsapp: formData.phone,
            email: formData.email || null,
          }),
        });

        const data = await res.json();

        if (data.ok) {
          setFormData(prev => ({ ...prev, customerId: data.customer.id }));
          setStep(2);
        } else if (data.duplicate) {
          setFormData(prev => ({ ...prev, existingCustomerId: data.duplicate_phone || data.duplicate_email }));
          setStep(2);
        } else {
          setError(data.message || 'Failed to create customer');
        }
      } else if (stepNum === 2) {
        const customerId = formData.existingCustomerId || formData.customerId;

        if (!customerId) {
          setError('Please provide customer details');
          return;
        }

        const res = await fetch('/crm/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: customerId,
            destination: formData.destination,
            lead_source: formData.source,
            customer_facing_notes: formData.notes,
          }),
        });

        const data = await res.json();

        if (data.ok) {
          setTripRef(data.trip.reference);
          setSuccess(true);
        } else {
          setError(data.error || 'Failed to create lead');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Created</h1>
        <p className="text-gray-500 mb-6">Quick lead has been created successfully.</p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-700 font-medium">Reference Number</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{tripRef}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/crm/leads/${tripRef}`)}
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Lead
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/crm/leads')}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quick Lead</h1>
        <p className="text-gray-500 mt-1">Create a lead with minimum information. Fill in the details later if needed.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {s}
            </div>
          ))}
          <div className="flex-1 h-0.5 bg-gray-200 mx-2 rounded">
            <div className={`h-full bg-green-700 rounded ${(step === 1 ? 'w-0%' : 'w-full')}`} />
          </div>
          <span className="text-sm text-gray-500">
            {step === 1 ? 'Customer Details' : 'Trip Details'}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter customer name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="customer@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              onClick={() => handleSubmit(1)}
              disabled={loading || !formData.name || !formData.phone}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Prsc className="w-4 h-4" />}
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {formData.existingCustomerId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="text-blue-700 font-medium mb-1">Existing customer found</p>
                <p className="text-blue-600">
                  A customer with this phone/email already exists. Creating a new trip for this customer.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Destination <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.destination}
                onChange={(e) => handleChange('destination', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                required
              >
                <option value="">Select destination</option>
                {CRM_DESTINATIONS.map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Lead Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                {CRM_LEAD_SOURCES.map(source => (
                  <option key={source.value} value={source.value}>{source.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any initial notes about this enquiry..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => handleSubmit(2)}
                disabled={loading || !formData.destination}
                className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Create Lead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
