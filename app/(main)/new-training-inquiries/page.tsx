'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, CheckCircle, Clock, ChevronLeft, ChevronRight, Filter, Copy, Check } from 'lucide-react';

interface ContactFormSubmission {
  _id: string;
  name: string;
  dogName?: string;
  email: string;
  phone?: string;
  message: string;
  submittedAt: string;
  reviewed: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dogBirthdate?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ContactFormSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactFormSubmission[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reviewedFilter, setReviewedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        search,
        ...(reviewedFilter !== 'all' && { reviewed: reviewedFilter }),
      });

      const response = await fetch(`/api/contact-form-submissions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [pagination.page, search, reviewedFilter, sortBy, sortOrder]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (value: string) => {
    setReviewedFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const formatPhone = (phone: string) => {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getFullAddress = (submission: ContactFormSubmission) => {
    const parts = [submission.streetAddress, submission.city, submission.state].filter(Boolean);
    return parts.join(', ');
  };

  const getGoogleMapsUrl = (submission: ContactFormSubmission) => {
    const address = getFullAddress(submission);
    if (!address) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const handleCopy = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getUnreviewedCount = () => {
    return submissions.filter(sub => !sub.reviewed).length;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Training Inquiries</h1>
        <p className="text-gray-600">
          Manage and review incoming contact form submissions from potential clients.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search by name, dog name, email, or message..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={reviewedFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Submissions</SelectItem>
                <SelectItem value="false">Unreviewed</SelectItem>
                <SelectItem value="true">Reviewed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submittedAt-desc">Newest First</SelectItem>
                <SelectItem value="submittedAt-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {getUnreviewedCount() > 0 && (
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-2 rounded-lg">
            <Clock size={16} />
            <span className="font-medium">{getUnreviewedCount()} unreviewed submission{getUnreviewedCount() !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600">
              {search || reviewedFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'No contact form submissions have been received yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{submission.name}</h3>
                      {submission.reviewed ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle size={12} className="mr-1" />
                          Reviewed
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                          <Clock size={12} className="mr-1" />
                          Unreviewed
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email:</span>
                        <span>{submission.email}</span>
                        <button
                          onClick={() => handleCopy(submission.email, `email-${submission._id}`)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Copy email"
                        >
                          {copiedItem === `email-${submission._id}` ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {submission.phone && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Phone:</span>
                          <span>{formatPhone(submission.phone)}</span>
                          <button
                            onClick={() => handleCopy(submission.phone!, `phone-${submission._id}`)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Copy phone number"
                          >
                            {copiedItem === `phone-${submission._id}` ? (
                              <Check size={14} className="text-green-600" />
                            ) : (
                              <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                      )}
                      {submission.dogName && (
                        <div>
                          <span className="font-medium">Dog Name:</span> {submission.dogName}
                        </div>
                      )}
                      {getFullAddress(submission) && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Address:</span>
                          <span>
                            {getGoogleMapsUrl(submission) ? (
                              <a
                                href={getGoogleMapsUrl(submission)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {getFullAddress(submission)}
                              </a>
                            ) : (
                              getFullAddress(submission)
                            )}
                          </span>
                          <button
                            onClick={() => handleCopy(getFullAddress(submission), `address-${submission._id}`)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Copy address"
                          >
                            {copiedItem === `address-${submission._id}` ? (
                              <Check size={14} className="text-green-600" />
                            ) : (
                              <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-700">{truncateMessage(submission.message)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Submitted {formatDate(submission.submittedAt)}</span>
                      {submission.reviewed && submission.reviewedAt && (
                        <span>Reviewed {formatDate(submission.reviewedAt)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Link href={`/new-training-inquiries/${submission._id}`}>
                      <Button variant="outline" size="sm" className="text-indigo-700 border-indigo-300 hover:bg-indigo-100">
                        <Eye size={16} className="mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} submissions
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(pagination.pages)].map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = pageNum === pagination.page;
                const isNearCurrent = Math.abs(pageNum - pagination.page) <= 1;
                const isFirst = pageNum === 1;
                const isLast = pageNum === pagination.pages;
                
                if (isCurrent || isNearCurrent || isFirst || isLast) {
                  return (
                    <Button
                      key={pageNum}
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={isCurrent ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                } else if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                  return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
