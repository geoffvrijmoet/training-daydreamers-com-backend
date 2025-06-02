'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientAuthPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    dogName: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation: require dog name and at least one contact method
    if (!formData.dogName.trim()) {
      setError('Dog&apos;s name is required');
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      setError('Please provide either email or phone number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/portal/find-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find client');
      }

      if (data.success && data.clientId) {
        // Redirect to client calendar page
        router.push(`/portal/clients/${data.clientId}/calendar`);
      } else {
        setError('No matching client found. Please check your information and try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 font-fredoka">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 border border-brand-blue-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-purple-700 mb-2">
              Access Your Calendar
            </h1>
            <p className="text-gray-600">
              Enter your information to view and book training sessions
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-brand-purple-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-purple-700 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="dogName" className="block text-sm font-medium text-brand-purple-700 mb-2">
                Dog&apos;s Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="dogName"
                name="dogName"
                value={formData.dogName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-purple-700 focus:border-transparent"
                placeholder="Enter your dog's name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-purple-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-purple-700 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-brand-purple-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-purple-700 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="text-sm text-gray-600 bg-brand-blue-50 p-3 rounded-md border border-brand-blue-100">
              <p>Please provide at least one contact method (email or phone) along with your dog&apos;s name.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-brand-green-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              {isLoading ? 'Finding your profile...' : 'Access Calendar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
} 