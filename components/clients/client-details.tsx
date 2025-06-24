"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPlus, FileText, Plus, Trash2, Edit3, Upload, Image, Loader2, Copy, Check } from "lucide-react";

// Simple Badge component
const Badge = ({ children, variant = "default", className = "" }: { 
  children: React.ReactNode; 
  variant?: "default" | "outline" | "secondary" | "destructive"; 
  className?: string 
}) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    outline: "border border-gray-300 text-gray-700",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-red-500 text-white"
  };
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface Client {
  _id: string;
  name: string;
  dogName: string;
  email: string;
  phone: string;
  notes?: string;
  adminNotes?: string;
  dogBirthdate?: string;
  // Address fields
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  addressZipCode?: string;
  // Agency information
  intakeSource?: 'direct' | 'agency';
  agencyName?: string;
  agencyRevenueShare?: number;
  agencyHandlesTax?: boolean;
  sessionRate?: number;
  packageInfo?: {
    totalSessions?: number;
    sessionsUsed?: number;
    packagePrice?: number;
  };
  // Emergency contact
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  // Dog information
  dogInfo?: {
    breed?: string;
    weight?: number;
    spayedNeutered?: boolean;
    behaviorConcerns?: string[];
    behaviorConcernOther?: string;
    previousTraining?: boolean;
    previousTrainingDetails?: string;
  };
  // File uploads
  vaccinationRecords?: Array<{
    name: string;
    url: string;
    publicId?: string;
    resourceType?: string;
  }>;
  dogPhoto?: {
    url?: string;
    publicId?: string;
    resourceType?: string;
  };
  liabilityWaiver?: {
    url?: string;
    name?: string;
    publicId?: string;
    resourceType?: string;
  };
  intakeCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  _id: string;
  clientId: string;
  calendarTimeslot: {
    startTime: string;
    endTime: string;
    notes?: string;
  };
  status: 'pending_payment' | 'scheduled' | 'completed' | 'cancelled_by_client' | 'cancelled_by_admin' | 'rescheduled';
  quotedPrice: number;
  sessionNotes?: string;
  isFirstSession: boolean;
  packageInstanceId?: string;
  hasReportCard?: boolean; // We'll determine this from report cards collection
  createdAt: string;
}

export function ClientDetails({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Client>>({});
  
  // File upload states
  const [uploadingStates, setUploadingStates] = useState({
    vaccination: false,
    dogPhoto: false,
    liabilityWaiver: false
  });
  const [dragStates, setDragStates] = useState({
    vaccination: false,
    dogPhoto: false,
    liabilityWaiver: false
  });
  
  // copy indicator
  const [copiedKey, setCopiedKey] = useState<string>("");

  const CopyButton = ({ value, idKey }: { value: string; idKey: string }) => {
    const copied = copiedKey === idKey;
    const handle = async () => {
      try { await navigator.clipboard.writeText(value); setCopiedKey(idKey);} catch {}
    };
    return (
      <button onClick={handle} className="flex items-center gap-0.5 ml-1 text-zinc-400 hover:text-blue-600">
        {copied ? <><Check className="w-3 h-3 text-green-600"/><span className="text-green-700 text-xs">Copied!</span></> : <Copy className="w-3 h-3"/>}
      </button>
    );
  };

  const plainDigits = (raw:string)=> raw.replace(/\D/g, "");
  const formatPhone = (raw:string)=>{const d=plainDigits(raw);return d.length===10?`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`:raw};

  // Behavior concern options (matching client-form.tsx)
  const behaviorConcernOptions = [
    'Reactivity',
    'Leash Reactivity', 
    'Separation Anxiety',
    'Resource Guarding',
    'Anxiety/Fear',
    'Other (Please Specify)'
  ];

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch client');
        }

        setClient(data.client);
      } catch (error) {
        console.error('Error fetching client:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchSessions() {
      try {
        const response = await fetch(`/api/clients/${clientId}/sessions`);
        const data = await response.json();

        if (data.success) {
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    }

    fetchClient();
    fetchSessions();
  }, [clientId]);

  const handleBookSession = () => {
    router.push(`/calendar?clientId=${clientId}`);
  };

  const handleDeleteClient = async () => {
    if (!client) return;

    if (!confirm(`Are you sure you want to delete ${client.name} and ${client.dogName}? This action cannot be undone and will also delete all associated files and sessions.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete client');
      }

      alert(`${client.name} and ${client.dogName} have been successfully deleted.`);
      router.push('/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditToggle = () => {
    if (!client) return;
    
    if (isEditing) {
      // Cancel editing - reset edit data
      setEditData({});
      setIsEditing(false);
    } else {
      // Start editing - populate edit data with current client data
      setEditData({
        name: client.name,
        dogName: client.dogName,
        email: client.email,
        phone: client.phone,
        notes: client.notes || '',
        adminNotes: client.adminNotes || '',
        dogBirthdate: client.dogBirthdate,
        addressLine1: client.addressLine1 || '',
        addressLine2: client.addressLine2 || '',
        city: client.city || '',
        state: client.state || '',
        addressZipCode: client.addressZipCode || '',
        sessionRate: client.sessionRate,
        packageInfo: client.packageInfo ? { ...client.packageInfo } : {
          totalSessions: undefined,
          sessionsUsed: undefined,
          packagePrice: undefined
        },
        emergencyContact: client.emergencyContact ? { ...client.emergencyContact } : {
          name: '',
          phone: '',
          relationship: ''
        },
        dogInfo: client.dogInfo ? { ...client.dogInfo } : {
          breed: '',
          weight: undefined,
          spayedNeutered: false,
          behaviorConcerns: [],
          behaviorConcernOther: '',
          previousTraining: false,
          previousTrainingDetails: ''
        },
        intakeSource: client.intakeSource || 'direct',
        agencyName: client.agencyName || '',
        agencyRevenueShare: client.agencyRevenueShare,
        agencyHandlesTax: client.agencyHandlesTax || false,
        // Initialize file data
        vaccinationRecords: client.vaccinationRecords || [],
        dogPhoto: client.dogPhoto || { url: '', publicId: '', resourceType: '' },
        liabilityWaiver: client.liabilityWaiver || { name: '', url: '', publicId: '', resourceType: '' },
      });
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!client || !editData) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update client');
      }

      // Update local client state with saved data
      setClient(data.client);
      setEditData({});
      setIsEditing(false);

      alert('Client information updated successfully!');
    } catch (error) {
      console.error('Error updating client:', error);
      alert(error instanceof Error ? error.message : 'Failed to update client');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    // Handle dog birthdate with proper timezone conversion
    if (field === 'dogBirthdate' && typeof value === 'string' && value) {
      const convertedDate = new Date(value + 'T00:00:00-05:00').toISOString();
      setEditData(prev => ({
        ...prev,
        [field]: convertedDate
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNestedInputChange = (parentField: string, childField: string, value: string | number | boolean | string[]) => {
    setEditData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof Client] as Record<string, string | number | boolean | string[]> || {}),
        [childField]: value
      }
    }));
  };

  // File upload functions
  const uploadFile = async (file: File, type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver') => {
    setUploadingStates(prev => ({ ...prev, [type]: true }));

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('type', type);
    uploadData.append('clientId', clientId); // Use actual client ID

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url, publicId, resourceType } = await response.json();

      if (type === 'vaccination') {
        const currentRecords = editData.vaccinationRecords || (client?.vaccinationRecords || []);
        setEditData(prev => ({
          ...prev,
          vaccinationRecords: [...currentRecords, { 
            name: file.name, 
            url, 
            publicId, 
            resourceType 
          }]
        }));
      } else if (type === 'dogPhoto') {
        setEditData(prev => ({
          ...prev,
          dogPhoto: { url, publicId, resourceType }
        }));
      } else if (type === 'liabilityWaiver') {
        setEditData(prev => ({
          ...prev,
          liabilityWaiver: { name: file.name, url, publicId, resourceType }
        }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDeleteFile = async (type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver', index?: number) => {
    if (!client) return;

    if (type === 'vaccination' && index !== undefined) {
      const records = editData.vaccinationRecords || client.vaccinationRecords || [];
      const file = records[index];
      if (!file?.publicId) return;

      try {
        const response = await fetch('/api/upload/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            publicId: file.publicId, 
            resourceType: file.resourceType 
          })
        });

        if (response.ok) {
          setEditData(prev => ({
            ...prev,
            vaccinationRecords: records.filter((_, i) => i !== index)
          }));
        } else {
          alert('Failed to delete file. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file. Please try again.');
      }
    } else if (type === 'dogPhoto') {
      const file = editData.dogPhoto || client.dogPhoto;
      if (!file?.publicId) return;

      try {
        const response = await fetch('/api/upload/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            publicId: file.publicId, 
            resourceType: file.resourceType 
          })
        });

        if (response.ok) {
          setEditData(prev => ({
            ...prev,
            dogPhoto: { url: '', publicId: '', resourceType: '' }
          }));
        } else {
          alert('Failed to delete file. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file. Please try again.');
      }
    } else if (type === 'liabilityWaiver') {
      const file = editData.liabilityWaiver || client.liabilityWaiver;
      if (!file?.publicId) return;

      try {
        const response = await fetch('/api/upload/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            publicId: file.publicId, 
            resourceType: file.resourceType 
          })
        });

        if (response.ok) {
          setEditData(prev => ({
            ...prev,
            liabilityWaiver: { name: '', url: '', publicId: '', resourceType: '' }
          }));
        } else {
          alert('Failed to delete file. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file. Please try again.');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver') => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, type);
    // Clear the input so the same file can be uploaded again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent, type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = async (e: React.DragEvent, type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (type === 'vaccination') {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, JPG, JPEG, or PNG file for vaccination records.');
        return;
      }
    } else if (type === 'dogPhoto') {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file for the dog photo.');
        return;
      }
    } else if (type === 'liabilityWaiver') {
      if (!file.type.startsWith('application/pdf')) {
        alert('Please upload a PDF file for the liability waiver.');
        return;
      }
    }

    await uploadFile(file, type);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSessionStatusBadge = (status: string) => {
    const statusConfig = {
      'pending_payment': { label: 'Pending Payment', variant: 'destructive' as const },
      'scheduled': { label: 'Scheduled', variant: 'default' as const },
      'completed': { label: 'Completed', variant: 'secondary' as const },
      'cancelled_by_client': { label: 'Cancelled by Client', variant: 'outline' as const },
      'cancelled_by_admin': { label: 'Cancelled', variant: 'outline' as const },
      'rescheduled': { label: 'Rescheduled', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isUpcomingSession = (session: Session) => {
    const sessionDate = new Date(session.calendarTimeslot.startTime);
    const now = new Date();
    return sessionDate > now;
  };

  const upcomingSessions = sessions.filter(isUpcomingSession);
  const completedSessions = sessions.filter(session => !isUpcomingSession(session));

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!client) return <div className="p-6">Client not found</div>;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Dog Name</label>
                <Input
                  value={editData.dogName || ''}
                  onChange={(e) => handleInputChange('dogName', e.target.value)}
                  className="text-2xl font-bold text-brand-purple-700 border-brand-purple-200"
                  placeholder="Dog's name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Owner Name</label>
                <Input
                  value={editData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-lg text-gray-600"
                  placeholder="Owner's name"
                />
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-brand-purple-700">{client.dogName}</h1>
              <p className="text-xl text-gray-600 mt-1">Owner: {client.name}</p>
              {client.intakeSource === 'agency' && client.agencyName && (
                <p className="text-sm text-gray-500 mt-1">Through: {client.agencyName}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <Button onClick={handleBookSession} className="bg-brand-green-700 hover:bg-brand-green-100 text-white hover:text-brand-green-700">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Book Session/Package
            </Button>
          )}
          
          {isEditing ? (
            <>
              <Button 
                onClick={handleSaveChanges} 
                disabled={isSaving}
                className="bg-green-100 hover:bg-green-300 text-green-700 hover:text-green-800"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleEditToggle}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleEditToggle}>
              Edit Client
            </Button>
          )}
          
          {!isEditing && (
            <Button 
              variant="outline" 
              onClick={handleDeleteClient}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              {isDeleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Client
                </>
              )}
            </Button>
          )}
          
          <Link href="/clients">
            <Button variant="outline">Back to Clients</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-purple-700">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm flex items-center gap-1">
                    {client.email}
                    <CopyButton value={client.email} idKey="email" />
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm flex items-center gap-1">
                    {formatPhone(client.phone)}
                    <CopyButton value={plainDigits(client.phone)} idKey="phone" />
                  </p>
                )}
              </div>
            </div>
            
            {(client.addressLine1 || client.city || client.state || client.addressZipCode || isEditing) && (
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <Input
                      value={editData.addressLine1 || ''}
                      onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                      placeholder="Address Line 1"
                      className="text-sm"
                    />
                    <Input
                      value={editData.addressLine2 || ''}
                      onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                      placeholder="Address Line 2"
                      className="text-sm"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={editData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                        className="text-sm"
                      />
                      <Input
                        value={editData.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="State"
                        className="text-sm"
                      />
                      <Input
                        value={editData.addressZipCode || ''}
                        onChange={(e) => handleInputChange('addressZipCode', e.target.value)}
                        placeholder="Zip Code"
                        className="text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    {client.addressLine1 && <div>{client.addressLine1}</div>}
                    {client.addressLine2 && <div>{client.addressLine2}</div>}
                    {(client.city || client.state || client.addressZipCode) && (
                      <div>
                        {client.city}{client.city && (client.state || client.addressZipCode) && ', '}
                        {client.state}{client.state && client.addressZipCode && ' '}
                        {client.addressZipCode}
                      </div>
                    )}
                    {(!client.addressLine1 && !client.city && !client.state && !client.addressZipCode) && (
                      <p className="text-gray-400 italic">No address provided</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {(client.emergencyContact?.name || isEditing) && (
              <div>
                <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <Input
                      value={editData.emergencyContact?.name || ''}
                      onChange={(e) => handleNestedInputChange('emergencyContact', 'name', e.target.value)}
                      placeholder="Emergency contact name"
                      className="text-sm"
                    />
                    <Input
                      type="tel"
                      value={editData.emergencyContact?.phone || ''}
                      onChange={(e) => handleNestedInputChange('emergencyContact', 'phone', e.target.value)}
                      placeholder="Emergency contact phone"
                      className="text-sm"
                    />
                    <Input
                      value={editData.emergencyContact?.relationship || ''}
                      onChange={(e) => handleNestedInputChange('emergencyContact', 'relationship', e.target.value)}
                      placeholder="Relationship (e.g., Spouse, Friend)"
                      className="text-sm"
                    />
                  </div>
                ) : (
                  <div className="text-sm">
                    {client.emergencyContact?.name ? (
                      <>
                        <div>{client.emergencyContact.name}</div>
                        {client.emergencyContact.phone && <div>{client.emergencyContact.phone}</div>}
                        {client.emergencyContact.relationship && <div className="text-gray-500">({client.emergencyContact.relationship})</div>}
                      </>
                    ) : (
                      <p className="text-gray-400 italic">No emergency contact provided</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dog Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-purple-700">Dog Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Birthdate</label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editData.dogBirthdate ? new Date(editData.dogBirthdate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('dogBirthdate', e.target.value)}
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm">
                    {client.dogBirthdate ? formatDate(client.dogBirthdate) : <span className="text-gray-400 italic">Not specified</span>}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Breed</label>
                {isEditing ? (
                  <Input
                    value={editData.dogInfo?.breed || ''}
                    onChange={(e) => handleNestedInputChange('dogInfo', 'breed', e.target.value)}
                    placeholder="e.g., Golden Retriever"
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm">
                    {client.dogInfo?.breed || <span className="text-gray-400 italic">Not specified</span>}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Weight</label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editData.dogInfo?.weight?.toString() || ''}
                    onChange={(e) => handleNestedInputChange('dogInfo', 'weight', parseFloat(e.target.value) || 0)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="lbs"
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm">
                    {client.dogInfo?.weight ? `${client.dogInfo.weight} lbs` : <span className="text-gray-400 italic">Not specified</span>}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Spayed/Neutered</label>
                {isEditing ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <Checkbox
                      id="edit-spayed-neutered"
                      checked={editData.dogInfo?.spayedNeutered || false}
                      onCheckedChange={(checked) => handleNestedInputChange('dogInfo', 'spayedNeutered', checked as boolean)}
                    />
                    <label htmlFor="edit-spayed-neutered" className="text-sm cursor-pointer">Yes, spayed/neutered</label>
                  </div>
                ) : (
                  <p className="text-sm">
                    {client.dogInfo?.spayedNeutered !== undefined 
                      ? (client.dogInfo.spayedNeutered ? 'Yes' : 'No')
                      : <span className="text-gray-400 italic">Not specified</span>
                    }
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Behavior Concerns</label>
              {isEditing ? (
                <div className="space-y-2 mt-1">
                  <div className="grid grid-cols-2 gap-2">
                    {behaviorConcernOptions.map((concern) => (
                      <div key={concern} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-behavior-${concern}`}
                          checked={editData.dogInfo?.behaviorConcerns?.includes(concern) || false}
                          onCheckedChange={(checked) => {
                            const currentConcerns = editData.dogInfo?.behaviorConcerns || [];
                            const updatedConcerns = checked 
                              ? [...currentConcerns, concern]
                              : currentConcerns.filter(c => c !== concern);
                            handleNestedInputChange('dogInfo', 'behaviorConcerns', updatedConcerns);
                          }}
                        />
                        <label htmlFor={`edit-behavior-${concern}`} className="text-sm cursor-pointer">{concern}</label>
                      </div>
                    ))}
                  </div>
                  {editData.dogInfo?.behaviorConcerns?.includes('Other (Please Specify)') && (
                    <Input
                      value={editData.dogInfo?.behaviorConcernOther || ''}
                      onChange={(e) => handleNestedInputChange('dogInfo', 'behaviorConcernOther', e.target.value)}
                      placeholder="Please specify other behavior concern"
                      className="text-sm ml-6"
                    />
                  )}
                </div>
              ) : (
                client.dogInfo?.behaviorConcerns && client.dogInfo.behaviorConcerns.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {client.dogInfo.behaviorConcerns.map((concern, index) => (
                      <Badge key={index} variant="outline" className="text-xs">{concern}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mt-1">No behavior concerns specified</p>
                )
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Previous Training</label>
              {isEditing ? (
                <div className="space-y-2 mt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-previous-training"
                      checked={editData.dogInfo?.previousTraining || false}
                      onCheckedChange={(checked) => handleNestedInputChange('dogInfo', 'previousTraining', checked as boolean)}
                    />
                    <label htmlFor="edit-previous-training" className="text-sm cursor-pointer">Previous training experience</label>
                  </div>
                  {editData.dogInfo?.previousTraining && (
                    <Textarea
                      value={editData.dogInfo?.previousTrainingDetails || ''}
                      onChange={(e) => handleNestedInputChange('dogInfo', 'previousTrainingDetails', e.target.value)}
                      placeholder="Describe previous training experience, methods used, results, etc."
                      className="text-sm ml-6 min-h-[60px]"
                    />
                  )}
                </div>
              ) : (
                client.dogInfo?.previousTraining ? (
                  <div className="text-sm mt-1">
                    <p>Yes</p>
                    {client.dogInfo.previousTrainingDetails && (
                      <p className="text-gray-600 mt-1">{client.dogInfo.previousTrainingDetails}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mt-1">No previous training</p>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        {(client.sessionRate || client.packageInfo || client.intakeSource === 'agency' || isEditing) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-purple-700">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Session Rate</label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editData.sessionRate?.toString() || ''}
                    onChange={(e) => handleInputChange('sessionRate', parseFloat(e.target.value) || 0)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm">
                    {client.sessionRate ? `$${client.sessionRate.toFixed(2)}` : <span className="text-gray-400 italic">Not specified</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Package Information</label>
                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <Input
                      type="number"
                      min="0"
                      value={editData.packageInfo?.totalSessions?.toString() || ''}
                      onChange={(e) => handleNestedInputChange('packageInfo', 'totalSessions', parseInt(e.target.value) || 0)}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="Total Sessions (e.g., 3)"
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={editData.packageInfo?.sessionsUsed?.toString() || ''}
                      onChange={(e) => handleNestedInputChange('packageInfo', 'sessionsUsed', parseInt(e.target.value) || 0)}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="Sessions Used"
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editData.packageInfo?.packagePrice?.toString() || ''}
                      onChange={(e) => handleNestedInputChange('packageInfo', 'packagePrice', parseFloat(e.target.value) || 0)}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="Package Price (e.g., 450.00)"
                      className="text-sm"
                    />
                  </div>
                ) : (
                  client.packageInfo ? (
                    <div className="text-sm">
                      {client.packageInfo.totalSessions && (
                        <div>Total Sessions: {client.packageInfo.totalSessions}</div>
                      )}
                      {client.packageInfo.sessionsUsed !== undefined && (
                        <div>Sessions Used: {client.packageInfo.sessionsUsed}</div>
                      )}
                      {client.packageInfo.packagePrice && (
                        <div>Package Price: ${client.packageInfo.packagePrice.toFixed(2)}</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No package information</p>
                  )
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Client Source</label>
                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={editData.intakeSource === 'direct'}
                          onChange={() => handleInputChange('intakeSource', 'direct')}
                        />
                        <span className="text-sm">Direct Client</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={editData.intakeSource === 'agency'}
                          onChange={() => handleInputChange('intakeSource', 'agency')}
                        />
                        <span className="text-sm">Through Training Agency</span>
                      </label>
                    </div>
                    {editData.intakeSource === 'agency' && (
                      <div className="space-y-2 ml-6">
                        <Input
                          value={editData.agencyName || ''}
                          onChange={(e) => handleInputChange('agencyName', e.target.value)}
                          placeholder="Agency Name"
                          className="text-sm"
                        />
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500">Revenue Share Percentage (%)</label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={editData.agencyRevenueShare?.toString() || ''}
                            onChange={(e) => handleInputChange('agencyRevenueShare', parseFloat(e.target.value) || 0)}
                            onWheel={(e) => e.currentTarget.blur()}
                            placeholder="0-100"
                            className="text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editData.agencyHandlesTax || false}
                            onCheckedChange={(checked) => handleInputChange('agencyHandlesTax', checked as boolean)}
                          />
                          <span className="text-sm">Agency handles sales tax collection</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  client.intakeSource === 'agency' ? (
                    <div className="text-sm">
                      <div>Agency: {client.agencyName}</div>
                      {client.agencyRevenueShare && (
                        <div>Revenue Share: {client.agencyRevenueShare}%</div>
                      )}
                      <div>Tax Handling: {client.agencyHandlesTax ? 'Agency Handles' : 'Madeline Handles'}</div>
                    </div>
                  ) : (
                    <p className="text-sm">Direct Client</p>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Files */}
        {(client.vaccinationRecords?.length || client.dogPhoto?.url || client.liabilityWaiver?.url || isEditing) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-purple-700">Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vaccination Records */}
              <div>
                <label className="text-sm font-medium text-gray-500">Vaccination Records</label>
                {isEditing ? (
                  <div className="space-y-3 mt-2">
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        dragStates.vaccination 
                          ? 'border-blue-400 bg-blue-50' 
                          : uploadingStates.vaccination
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={(e) => handleDragOver(e, 'vaccination')}
                      onDragLeave={(e) => handleDragLeave(e, 'vaccination')}
                      onDrop={(e) => handleDrop(e, 'vaccination')}
                    >
                      <div className="space-y-2">
                        {uploadingStates.vaccination ? (
                          <Loader2 className="w-6 h-6 mx-auto text-green-500 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 mx-auto text-gray-400" />
                        )}
                        <p className="text-xs text-gray-600">
                          {uploadingStates.vaccination 
                            ? 'Uploading...' 
                            : dragStates.vaccination 
                            ? 'Drop file here' 
                            : 'Drag and drop vaccination records here'
                          }
                        </p>
                        {!uploadingStates.vaccination && (
                          <>
                            <p className="text-xs text-gray-500">or</p>
                            <label htmlFor="edit-vaccination" className="cursor-pointer">
                              <Input
                                id="edit-vaccination"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload(e, 'vaccination')}
                                className="hidden"
                              />
                              <span className="bg-brand-blue-700 text-white px-3 py-1 rounded-md hover:bg-brand-blue-100 hover:text-brand-blue-700 transition-colors text-xs">
                                Choose Files
                              </span>
                            </label>
                            <p className="text-xs text-gray-500">PDF, JPG, JPEG, or PNG</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Display existing files */}
                    {(editData.vaccinationRecords || client.vaccinationRecords)?.map((record, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <a href={record.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm flex-1">
                          {record.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile('vaccination', index)}
                          className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  client.vaccinationRecords && client.vaccinationRecords.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {client.vaccinationRecords.map((record, index) => (
                        <a
                          key={index}
                          href={record.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm block"
                        >
                          {record.name}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-1">No vaccination records uploaded</p>
                  )
                )}
              </div>

              {/* Dog Photo */}
              <div>
                <label className="text-sm font-medium text-gray-500">Dog Photo</label>
                {isEditing ? (
                  <div className="space-y-3 mt-2">
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        dragStates.dogPhoto 
                          ? 'border-green-400 bg-green-50' 
                          : uploadingStates.dogPhoto
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={(e) => handleDragOver(e, 'dogPhoto')}
                      onDragLeave={(e) => handleDragLeave(e, 'dogPhoto')}
                      onDrop={(e) => handleDrop(e, 'dogPhoto')}
                    >
                      <div className="space-y-2">
                        {uploadingStates.dogPhoto ? (
                          <Loader2 className="w-6 h-6 mx-auto text-blue-500 animate-spin" />
                        ) : (
                          <Image className="w-6 h-6 mx-auto text-gray-400" />
                        )}
                        <p className="text-xs text-gray-600">
                          {uploadingStates.dogPhoto 
                            ? 'Uploading...' 
                            : dragStates.dogPhoto 
                            ? 'Drop image here' 
                            : 'Drag and drop a photo here'
                          }
                        </p>
                        {!uploadingStates.dogPhoto && (
                          <>
                            <p className="text-xs text-gray-500">or</p>
                            <label htmlFor="edit-dog-photo" className="cursor-pointer">
                              <Input
                                id="edit-dog-photo"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'dogPhoto')}
                                className="hidden"
                              />
                              <span className="bg-brand-green-700 text-white px-3 py-1 rounded-md hover:bg-brand-green-100 hover:text-brand-green-700 transition-colors text-xs">
                                Choose Photo
                              </span>
                            </label>
                            <p className="text-xs text-gray-500">Any image format</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Display existing photo */}
                    {(editData.dogPhoto?.url || client.dogPhoto?.url) && (
                      <div className="relative inline-block">
                        <img
                          src={editData.dogPhoto?.url || client.dogPhoto?.url}
                          alt={`Photo of ${client.dogName}`}
                          className="max-w-32 rounded-lg shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteFile('dogPhoto')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  client.dogPhoto?.url ? (
                    <div className="mt-1">
                      <img
                        src={client.dogPhoto.url}
                        alt={`Photo of ${client.dogName}`}
                        className="max-w-32 rounded-lg shadow-sm"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-1">No dog photo uploaded</p>
                  )
                )}
              </div>

              {/* Liability Waiver */}
              <div>
                <label className="text-sm font-medium text-gray-500">Liability Waiver</label>
                {isEditing ? (
                  <div className="space-y-3 mt-2">
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        dragStates.liabilityWaiver 
                          ? 'border-purple-400 bg-purple-50' 
                          : uploadingStates.liabilityWaiver
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={(e) => handleDragOver(e, 'liabilityWaiver')}
                      onDragLeave={(e) => handleDragLeave(e, 'liabilityWaiver')}
                      onDrop={(e) => handleDrop(e, 'liabilityWaiver')}
                    >
                      <div className="space-y-2">
                        {uploadingStates.liabilityWaiver ? (
                          <Loader2 className="w-6 h-6 mx-auto text-green-500 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 mx-auto text-gray-400" />
                        )}
                        <p className="text-xs text-gray-600">
                          {uploadingStates.liabilityWaiver 
                            ? 'Uploading...' 
                            : dragStates.liabilityWaiver 
                            ? 'Drop file here' 
                            : 'Drag and drop liability waiver here'
                          }
                        </p>
                        {!uploadingStates.liabilityWaiver && (
                          <>
                            <p className="text-xs text-gray-500">or</p>
                            <label htmlFor="edit-liability-waiver" className="cursor-pointer">
                              <Input
                                id="edit-liability-waiver"
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileUpload(e, 'liabilityWaiver')}
                                className="hidden"
                              />
                              <span className="bg-brand-purple-700 text-white px-3 py-1 rounded-md hover:bg-brand-purple-100 hover:text-brand-purple-700 transition-colors text-xs">
                                Choose PDF
                              </span>
                            </label>
                            <p className="text-xs text-gray-500">PDF files only</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Display existing waiver */}
                    {(editData.liabilityWaiver?.url || client.liabilityWaiver?.url) && (
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <a href={editData.liabilityWaiver?.url || client.liabilityWaiver?.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm flex-1">
                          {editData.liabilityWaiver?.name || client.liabilityWaiver?.name || 'Liability Waiver'}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile('liabilityWaiver')}
                          className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  client.liabilityWaiver?.url ? (
                    <div className="mt-1">
                      <a
                        href={client.liabilityWaiver.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {client.liabilityWaiver.name || 'Liability Waiver'}
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-1">No liability waiver uploaded</p>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sessions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-purple-700">Training Sessions</h2>
          <div className="text-sm text-gray-500">
            Total Sessions: {sessions.length}
          </div>
        </div>

        {isLoadingSessions ? (
          <div className="text-center py-8">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4">No sessions scheduled yet</p>
              <Button onClick={handleBookSession} className="bg-brand-green-700 hover:bg-brand-green-100 text-white hover:text-brand-green-700">
                <CalendarPlus className="w-4 h-4 mr-2" />
                Schedule First Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-brand-green-700">Upcoming Sessions ({upcomingSessions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No upcoming sessions</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div key={session._id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-medium">
                            {formatDateTime(session.calendarTimeslot.startTime)}
                          </div>
                          {getSessionStatusBadge(session.status)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Duration: {formatDateTime(session.calendarTimeslot.startTime)} - {formatDateTime(session.calendarTimeslot.endTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Price: ${session.quotedPrice.toFixed(2)}
                        </div>
                        {session.isFirstSession && (
                          <Badge variant="outline" className="text-xs">First Session</Badge>
                        )}
                        {session.calendarTimeslot.notes && (
                          <p className="text-sm text-gray-600">{session.calendarTimeslot.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-brand-blue-700">Completed Sessions ({completedSessions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {completedSessions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No completed sessions</p>
                ) : (
                  <div className="space-y-3">
                    {completedSessions.map((session) => (
                      <div key={session._id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-medium">
                            {formatDateTime(session.calendarTimeslot.startTime)}
                          </div>
                          {getSessionStatusBadge(session.status)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Price: ${session.quotedPrice.toFixed(2)}
                        </div>
                        {session.isFirstSession && (
                          <Badge variant="outline" className="text-xs">First Session</Badge>
                        )}
                        
                        {/* Report Card Actions */}
                        <div className="flex gap-2 mt-2">
                          {session.hasReportCard ? (
                            <Link href={`/report-cards/${session._id}`}>
                              <Button size="sm" variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                View Report Card
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/report-cards/new?sessionId=${session._id}`}>
                              <Button size="sm" className="bg-brand-pink-700 hover:bg-brand-pink-100 text-white hover:text-brand-pink-700 text-xs">
                                <Plus className="w-3 h-3 mr-1" />
                                Create Report Card
                              </Button>
                            </Link>
                          )}
                        </div>

                        {session.sessionNotes && (
                          <p className="text-sm text-gray-600 italic">{session.sessionNotes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Notes */}
      {(client.notes || client.adminNotes || isEditing) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-purple-700">Client Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Notes visible to client..."
                  className="text-sm min-h-[100px]"
                />
              ) : (
                client.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No client notes</p>
                )
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-brand-purple-700">Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editData.adminNotes || ''}
                  onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                  placeholder="Internal admin notes (not visible to client)..."
                  className="text-sm min-h-[100px]"
                />
              ) : (
                client.adminNotes ? (
                  <p className="text-sm whitespace-pre-wrap">{client.adminNotes}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No admin notes</p>
                )
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Client Since */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">
            Client since: {formatDate(client.createdAt)}
            {client.intakeCompleted && (
              <span className="ml-2">
                <Badge variant="secondary" className="text-xs">Intake Completed</Badge>
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 