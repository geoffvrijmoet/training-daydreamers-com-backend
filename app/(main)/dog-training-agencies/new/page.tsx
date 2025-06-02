'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AgencyFormData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
  };
  website: string;
  revenueSharePercentage: number;
  handlesSalesTax: boolean;
  notes: string;
}

export default function NewAgencyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AgencyFormData>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: ''
    },
    website: '',
    revenueSharePercentage: 0,
    handlesSalesTax: false,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/dog-training-agencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create agency');
      }

      router.push('/dog-training-agencies');
    } catch (error) {
      console.error('Error creating agency:', error);
      setError(error instanceof Error ? error.message : 'Failed to create agency');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: string | number | boolean) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Link
            href="/dog-training-agencies"
            className="text-brand-blue-700 hover:text-brand-blue-100 mr-4"
          >
            ← Back to Agencies
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-brand-purple-700">Add New Agency</h1>
            <p className="text-gray-600">Create a new partner training agency</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-brand-blue-100 rounded-lg shadow-sm p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-brand-purple-700 mb-4">Basic Information</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agency Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                  placeholder="Enter agency name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => updateFormData('contactName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                    placeholder="Primary contact person"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                    placeholder="contact@agency.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                    placeholder="https://agency.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-brand-purple-700 mb-4">Address Information</h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={formData.address.addressLine1}
                    onChange={(e) => updateFormData('address.addressLine1', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.address.addressLine2}
                    onChange={(e) => updateFormData('address.addressLine2', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                    placeholder="Suite, unit, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => updateFormData('address.city', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => updateFormData('address.state', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                    placeholder="NY"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) => updateFormData('address.zipCode', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-brand-purple-700 mb-4">Business Details</h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revenue Share Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.revenueSharePercentage}
                    onChange={(e) => updateFormData('revenueSharePercentage', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center pt-8">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.handlesSalesTax}
                      onChange={(e) => updateFormData('handlesSalesTax', e.target.checked)}
                      className="w-4 h-4 text-brand-blue-700 border-gray-300 rounded focus:ring-brand-blue-100"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Agency handles sales tax collection
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:border-brand-blue-700"
                  placeholder="Additional notes about this agency..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-brand-blue-100">
            <Link
              href="/dog-training-agencies"
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-green-700 hover:bg-brand-green-100 text-white hover:text-brand-green-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Agency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 