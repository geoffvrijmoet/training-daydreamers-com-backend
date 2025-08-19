'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, CheckCircle, Clock, UserPlus, Trash2, Save, Edit, Mail, Phone, MapPin, Calendar, Dog, Copy, Check } from 'lucide-react';

interface ContactFormSubmission {
  _id: string;
  name: string;
  dogName?: string;
  dogBirthdate?: string;
  email: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  message: string;
  submittedAt: string;
  reviewed: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export default function ContactFormSubmissionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [submission, setSubmission] = useState<ContactFormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmission();
  }, [params.id]);

  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contact-form-submissions/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSubmission(data);
        setNotes(data.notes || '');
      } else {
        console.error('Failed to fetch submission');
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/contact-form-submissions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewed: true }),
      });
      
      if (response.ok) {
        await fetchSubmission();
      }
    } catch (error) {
      console.error('Error marking as reviewed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/contact-form-submissions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      
      if (response.ok) {
        setEditingNotes(false);
        await fetchSubmission();
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/contact-form-submissions/${params.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/contact-form-submissions');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (phone: string) => {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getAddressString = () => {
    const parts = [submission?.streetAddress, submission?.city, submission?.state, submission?.zipCode].filter(Boolean);
    return parts.join(', ');
  };

  const getFullAddress = () => {
    const parts = [submission?.streetAddress, submission?.city, submission?.state].filter(Boolean);
    return parts.join(', ');
  };

  const getGoogleMapsUrl = () => {
    const address = getFullAddress();
    if (!address) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const formatBirthdate = (birthdate: string) => {
    const date = new Date(birthdate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (today.getDate() < birth.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months = 11;
      }
    }
    
    const yearText = years === 1 ? 'year' : 'years';
    const monthText = months === 1 ? 'month' : 'months';
    
    if (years === 0) {
      return `${months} ${monthText} old`;
    } else if (months === 0) {
      return `${years} ${yearText} old`;
    } else {
      return `${years} ${yearText} ${months} ${monthText} old`;
    }
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Submission not found</h3>
            <p className="text-gray-600 mb-4">The contact form submission you’re looking for doesn’t exist.</p>
            <Link href="/new-training-inquiries">
              <Button>Back to Submissions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/new-training-inquiries">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} className="mr-1" />
              Back to Submissions
            </Button>
          </Link>
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
        <h1 className="text-3xl font-bold text-gray-900">{submission.name}</h1>
        <p className="text-gray-600">Contact form submission from {formatDate(submission.submittedAt)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus size={20} />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div className="text-gray-900 flex items-center gap-2">
                      {submission.email}
                      <button
                        onClick={() => handleCopy(submission.email, 'email')}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy email"
                      >
                        {copiedItem === 'email' ? (
                          <Check size={14} className="text-green-600" />
                        ) : (
                          <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {submission.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-500">Phone</div>
                      <div className="text-gray-900 flex items-center gap-2">
                        {formatPhone(submission.phone)}
                        <button
                          onClick={() => handleCopy(submission.phone!, 'phone')}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Copy phone number"
                        >
                          {copiedItem === 'phone' ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {getAddressString() && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <MapPin size={16} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-500">Address</div>
                      <div className="text-gray-900 flex items-center gap-2">
                        {getGoogleMapsUrl() ? (
                          <a
                            href={getGoogleMapsUrl()!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {getFullAddress()}
                          </a>
                        ) : (
                          getFullAddress()
                        )}
                        <button
                          onClick={() => handleCopy(getFullAddress(), 'address')}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Copy address"
                        >
                          {copiedItem === 'address' ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dog Information */}
          {(submission.dogName || submission.dogBirthdate) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dog size={20} />
                  Dog Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submission.dogName && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Dog Name</div>
                      <div className="text-gray-900">{submission.dogName}</div>
                    </div>
                  )}
                  
                  {submission.dogBirthdate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Age</div>
                        <div className="text-gray-900">
                          {calculateAge(submission.dogBirthdate)}
                          <div className="text-sm text-gray-500 mt-1">
                            ({formatBirthdate(submission.dogBirthdate)})
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message */}
          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-900 whitespace-pre-wrap">{submission.message}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Notes
                {!editingNotes && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingNotes(true)}
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-4">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this submission..."
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNotes} disabled={saving}>
                      <Save size={16} className="mr-1" />
                      {saving ? 'Saving...' : 'Save Notes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingNotes(false);
                        setNotes(submission.notes || '');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-900">
                  {submission.notes ? (
                    <p className="whitespace-pre-wrap">{submission.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">No notes added yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!submission.reviewed && (
                <Button
                  onClick={handleMarkReviewed}
                  disabled={saving}
                  className="w-full bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800"
                >
                  <CheckCircle size={16} className="mr-1" />
                  Mark as Reviewed
                </Button>
              )}
              
              <Link href={`/clients/new?fromSubmission=${submission._id}`}>
                <Button variant="outline" className="w-full text-blue-700 border-blue-300 hover:bg-blue-100">
                  <UserPlus size={16} className="mr-1" />
                  Convert to Client
                </Button>
              </Link>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-red-700 border-red-300 hover:bg-red-100">
                    <Trash2 size={16} className="mr-1" />
                    Delete Submission
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this contact form submission? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Submission Details */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500">Submitted</div>
                <div className="text-gray-900">{formatDate(submission.submittedAt)}</div>
              </div>
              
              {submission.reviewed && submission.reviewedAt && (
                <div>
                  <div className="text-gray-500">Reviewed</div>
                  <div className="text-gray-900">{formatDate(submission.reviewedAt)}</div>
                </div>
              )}
              
              {submission.reviewedBy && (
                <div>
                  <div className="text-gray-500">Reviewed By</div>
                  <div className="text-gray-900">{submission.reviewedBy}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
