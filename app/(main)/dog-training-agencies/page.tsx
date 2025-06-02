'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IDogTrainingAgency } from '@/lib/models/DogTrainingAgency';

interface AgencyWithId extends Omit<IDogTrainingAgency, '_id'> {
  _id: string;
}

export default function DogTrainingAgenciesPage() {
  const [agencies, setAgencies] = useState<AgencyWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const response = await fetch('/api/dog-training-agencies');
      if (!response.ok) throw new Error('Failed to fetch agencies');
      const data = await response.json();
      setAgencies(data);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      setError('Failed to load agencies');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this agency?')) return;

    try {
      const response = await fetch(`/api/dog-training-agencies/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to deactivate agency');
      
      // Remove the deactivated agency from the list
      setAgencies(agencies.filter(agency => agency._id !== id));
    } catch (error) {
      console.error('Error deactivating agency:', error);
      alert('Failed to deactivate agency');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-purple-700 mb-2">Dog Training Agencies</h1>
          <p className="text-gray-600">Manage your partner training agencies</p>
        </div>
        <Link
          href="/dog-training-agencies/new"
          className="bg-brand-green-700 hover:bg-brand-green-100 text-white hover:text-brand-green-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Add New Agency
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {agencies.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No agencies found</div>
          <Link
            href="/dog-training-agencies/new"
            className="text-brand-blue-700 hover:text-brand-blue-100 underline"
          >
            Add your first agency
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency) => (
            <div
              key={agency._id.toString()}
              className="bg-white border border-brand-blue-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-brand-purple-700 mb-2">
                  {agency.name}
                </h3>
                <div className="flex space-x-2">
                  <Link
                    href={`/dog-training-agencies/${agency._id.toString()}`}
                    className="text-brand-blue-700 hover:text-brand-blue-100 text-sm underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeactivate(agency._id.toString())}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Deactivate
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {agency.contactName && (
                  <div>
                    <span className="font-medium">Contact:</span> {agency.contactName}
                  </div>
                )}
                {agency.email && (
                  <div>
                    <span className="font-medium">Email:</span> {agency.email}
                  </div>
                )}
                {agency.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {agency.phone}
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-brand-blue-50">
                  <span className="text-brand-green-700 font-medium">
                    {agency.revenueSharePercentage}% Revenue Share
                  </span>
                  {agency.handlesSalesTax && (
                    <span className="text-xs bg-brand-amber-100 text-brand-amber-700 px-2 py-1 rounded">
                      Handles Tax
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 