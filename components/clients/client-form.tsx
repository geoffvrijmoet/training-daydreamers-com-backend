"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, Upload, Image } from "lucide-react";

interface Agency {
  _id: string;
  name: string;
  revenueSharePercentage: number;
  handlesSalesTax: boolean;
}

export function ClientForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
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
  const [packageViewMode, setPackageViewMode] = useState<'total' | 'per-session'>('total');
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    dogName: '',
    email: '',
    phone: '',
    dogBirthdate: '',
    notes: '',
    adminNotes: '',
    
    // Address Information
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    addressZipCode: '',
    
    // Agency Information
    intakeSource: 'direct' as 'direct' | 'agency',
    selectedAgencyId: '',
    agencyName: '',
    agencyRevenueShare: '',
    agencyHandlesTax: false,
    
    // Pricing Information
    sessionRate: '',
    totalSessions: '',
    packagePrice: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    
    // Additional Contacts
    additionalContacts: [] as { name: string; email: string; phone: string }[],
    
    // Dog Information
    dogBreed: '',
    dogWeight: '',
    dogSpayedNeutered: false,
    behaviorConcerns: [] as string[],
    behaviorConcernOther: '',
    previousTraining: false,
    previousTrainingDetails: '',
    
    // Files
    vaccinationRecords: [] as { name: string; url: string; publicId: string; resourceType: string }[],
    dogPhoto: { url: '', publicId: '', resourceType: '' },
    liabilityWaiver: { name: '', url: '', publicId: '', resourceType: '' },
    
    // Intake Status
    intakeCompleted: true
  });

  // Fetch agencies on component mount
  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const response = await fetch('/api/dog-training-agencies');
      if (response.ok) {
        const data = await response.json();
        setAgencies(data);
      }
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  // Calculate sales tax (8.875%)
  const calculateSalesTax = (amount: number) => {
    return (amount * 0.08875);
  };

  // Calculate revenue share amount
  const calculateRevenueShare = (amount: number, percentage: number) => {
    return (amount * percentage / 100);
  };

  // Calculate per-session rate from package
  const calculatePerSessionRate = () => {
    const price = parseFloat(formData.packagePrice);
    const sessions = parseInt(formData.totalSessions);
    if (price && sessions && sessions > 0) {
      return (price / sessions);
    }
    return 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Handle intake source changes
    if (name === 'intakeSource') {
      if (value === 'direct') {
        // Clear agency information when switching to direct client
        setFormData(prev => ({
          ...prev,
          selectedAgencyId: '',
          agencyName: '',
          agencyRevenueShare: '',
          agencyHandlesTax: false
        }));
      }
    }
    
    // Handle agency selection
    if (name === 'selectedAgencyId' && value) {
      const selectedAgency = agencies.find(agency => agency._id === value);
      if (selectedAgency) {
        setFormData(prev => ({
          ...prev,
          agencyName: selectedAgency.name,
          agencyRevenueShare: selectedAgency.revenueSharePercentage.toString(),
          agencyHandlesTax: selectedAgency.handlesSalesTax
        }));
      }
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleBehaviorConcernChange = (concern: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      behaviorConcerns: checked 
        ? [...prev.behaviorConcerns, concern]
        : prev.behaviorConcerns.filter(c => c !== concern)
    }));
  };

  const handleDeleteFile = async (type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver', index?: number) => {
    if (type === 'vaccination' && index !== undefined) {
      const file = formData.vaccinationRecords[index];
      if (!file.publicId) return;

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
          setFormData(prev => ({
            ...prev,
            vaccinationRecords: prev.vaccinationRecords.filter((_, i) => i !== index)
          }));
        } else {
          alert('Failed to delete file. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file. Please try again.');
      }
    } else if (type === 'dogPhoto') {
      const file = formData.dogPhoto;
      if (!file.publicId) return;

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
          setFormData(prev => ({
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
      const file = formData.liabilityWaiver;
      if (!file.publicId) return;

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
          setFormData(prev => ({
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

  const uploadFile = async (file: File, type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver') => {
    setUploadingStates(prev => ({ ...prev, [type]: true }));

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('type', type);
    uploadData.append('clientId', 'admin-temp'); // Admin uploads get special prefix

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url, publicId, resourceType } = await response.json();

      if (type === 'vaccination') {
        setFormData(prev => ({
          ...prev,
          vaccinationRecords: [...prev.vaccinationRecords, { 
            name: file.name, 
            url, 
            publicId, 
            resourceType 
          }]
        }));
      } else if (type === 'dogPhoto') {
        setFormData(prev => ({
          ...prev,
          dogPhoto: { url, publicId, resourceType }
        }));
      } else if (type === 'liabilityWaiver') {
        setFormData(prev => ({
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver') => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, type);
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

  const handleAdditionalContactChange = (index:number, field:keyof {name:string;email:string;phone:string}, value:string) => {
    setFormData(prev=>{
      const updated=[...prev.additionalContacts];
      updated[index]={...updated[index], [field]:value};
      return {...prev, additionalContacts:updated};
    });
  };

  const addAdditionalContact = () => {
    setFormData(prev=>({...prev, additionalContacts:[...prev.additionalContacts, {name:'', email:'', phone:''}]}));
  };

  const handleRemoveAdditionalContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter((_, i) => i !== index)
    }));
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Prepare behavior concerns including "other"
    const behaviorConcerns = [...formData.behaviorConcerns];
    if (formData.behaviorConcerns.includes('Other (Please Specify)') && formData.behaviorConcernOther.trim()) {
      behaviorConcerns.push(`Other: ${formData.behaviorConcernOther.trim()}`);
      // Remove the generic "other" entry
      const otherIndex = behaviorConcerns.indexOf('Other (Please Specify)');
      if (otherIndex > -1) {
        behaviorConcerns.splice(otherIndex, 1);
      }
    }

    // Prepare data for submission
    const data = {
      // Basic Information
      name: formData.name,
      dogName: formData.dogName,
      email: formData.email,
      phone: formData.phone,
      dogBirthdate: formData.dogBirthdate ? new Date(formData.dogBirthdate + 'T00:00:00-05:00') : undefined,
      notes: formData.notes,
      adminNotes: formData.adminNotes,
      
      // Address Information
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      state: formData.state,
      addressZipCode: formData.addressZipCode,
      
      // Agency Information
      intakeSource: formData.intakeSource,
      agencyName: formData.intakeSource === 'agency' ? formData.agencyName : undefined,
      agencyRevenueShare: formData.intakeSource === 'agency' && formData.agencyRevenueShare 
        ? parseFloat(formData.agencyRevenueShare) : undefined,
      agencyHandlesTax: formData.intakeSource === 'agency' ? formData.agencyHandlesTax : undefined,
      
      // Pricing Information
      sessionRate: formData.sessionRate ? parseFloat(formData.sessionRate) : undefined,
      packageInfo: {
        totalSessions: formData.totalSessions ? parseInt(formData.totalSessions) : undefined,
        sessionsUsed: 0,
        packagePrice: formData.packagePrice ? parseFloat(formData.packagePrice) : undefined,
      },
      
      // Emergency Contact
      emergencyContact: {
        name: formData.emergencyContactName || undefined,
        phone: formData.emergencyContactPhone || undefined,
        relationship: formData.emergencyContactRelationship || undefined,
      },
      
      // Additional Contacts
      additionalContacts: formData.additionalContacts.filter(c=>c.name||c.email||c.phone),
      
      // Dog Information
      dogInfo: {
        breed: formData.dogBreed || undefined,
        weight: formData.dogWeight ? parseFloat(formData.dogWeight) : undefined,
        spayedNeutered: formData.dogSpayedNeutered,
        behaviorConcerns: behaviorConcerns,
        previousTraining: formData.previousTraining,
        previousTrainingDetails: formData.previousTrainingDetails || undefined,
      },
      
      // Files
      vaccinationRecords: formData.vaccinationRecords,
      dogPhoto: formData.dogPhoto.url ? formData.dogPhoto : undefined,
      liabilityWaiver: formData.liabilityWaiver.url ? formData.liabilityWaiver : undefined,
      
      // Intake Status
      intakeCompleted: formData.intakeCompleted,
    };

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create client');
      }

      router.push('/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  const behaviorConcernOptions = [
    'Reactivity',
    'Leash Reactivity', 
    'Separation Anxiety',
    'Resource Guarding',
    'Anxiety/Fear',
    'Other (Please Specify)'
  ];

  // Calculate various amounts for display
  const sessionRateAmount = parseFloat(formData.sessionRate) || 0;
  const packagePriceAmount = parseFloat(formData.packagePrice) || 0;
  const revenueSharePercentage = parseFloat(formData.agencyRevenueShare) || 0;
  
  const sessionSalesTax = calculateSalesTax(sessionRateAmount);
  const packageSalesTax = calculateSalesTax(packagePriceAmount);
  
  const sessionRevenueShare = calculateRevenueShare(sessionRateAmount, revenueSharePercentage);
  const packageRevenueShare = calculateRevenueShare(packagePriceAmount, revenueSharePercentage);
  
  const perSessionRate = calculatePerSessionRate();

  // Calculate Madeline's portions
  const sessionMadelinePortion = sessionRateAmount - sessionSalesTax - sessionRevenueShare;
  const packageMadelinePortion = packagePriceAmount - packageSalesTax - packageRevenueShare;
  
  // Calculate tax planning (33% for income tax)
  const sessionTaxSavings = sessionMadelinePortion * 0.33;
  const sessionTakeHome = sessionMadelinePortion - sessionTaxSavings;
  const packageTaxSavings = packageMadelinePortion * 0.33;
  const packageTakeHome = packageMadelinePortion - packageTaxSavings;

  // Calculate per-session package amounts
  const totalSessions = parseInt(formData.totalSessions) || 1;
  const packageSalesTaxPerSession = packageSalesTax / totalSessions;
  const packageRevenueSharePerSession = packageRevenueShare / totalSessions;
  const packageMadelinePortionPerSession = packageMadelinePortion / totalSessions;
  const packageTaxSavingsPerSession = packageTaxSavings / totalSessions;
  const packageTakeHomePerSession = packageTakeHome / totalSessions;

  // Get selected agency name for display
  const selectedAgency = agencies.find(agency => agency._id === formData.selectedAgencyId);
  const agencyName = selectedAgency?.name || 'Agency';

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-brand-purple-700">Basic Information</h2>
        
        {/* Row 1: Dog Name & Birthdate */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dogName">Dog&apos;s Name *</Label>
            <Input
              id="dogName"
              name="dogName"
              value={formData.dogName}
              onChange={handleInputChange}
              required
              placeholder="Enter dog name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dogBirthdate">Dog&apos;s Birthdate</Label>
            <Input
              id="dogBirthdate"
              name="dogBirthdate"
              type="date"
              value={formData.dogBirthdate}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Row 2: Client Name + Email + Phone */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="space-y-2 flex items-end gap-2 col-span-1">
            <div className="flex-1">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter client name"
              />
            </div>
            <button type="button" onClick={addAdditionalContact} className="bg-brand-green-100 hover:bg-brand-green-200 text-brand-green-700 font-bold px-2 py-1 rounded self-end">
              +
            </button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter email address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder="Enter phone number"
            />
          </div>
        </div>

        {/* Additional Contacts (rendered inline) */}
        {formData.additionalContacts.length > 0 && (
          <>
            <h4 className="text-md font-medium mt-4 text-brand-purple-700">Co-Owner(s)</h4>
            {formData.additionalContacts.map((contact, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-4 mt-2 items-end">
                <Input placeholder="Co-owner name" value={contact.name} onChange={e=>handleAdditionalContactChange(idx,'name',e.target.value)} />
                <Input placeholder="Co-owner email" type="email" value={contact.email} onChange={e=>handleAdditionalContactChange(idx,'email',e.target.value)} />
                <Input placeholder="Co-owner phone" type="tel" value={contact.phone} onChange={e=>handleAdditionalContactChange(idx,'phone',e.target.value)} />
                <button type="button" onClick={()=>handleRemoveAdditionalContact(idx)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Address Information */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-brand-purple-700">Address Information</h3>
          <span className="text-sm text-gray-500">(Optional)</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input
              id="addressLine1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleInputChange}
              placeholder="Street address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleInputChange}
              placeholder="Apartment, suite, unit, etc."
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="e.g., CA, NY, TX"
              maxLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressZipCode">Zip Code</Label>
            <Input
              id="addressZipCode"
              name="addressZipCode"
              value={formData.addressZipCode}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Agency & Business Information */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-brand-purple-700">Agency & Business Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="intakeSource">Client Source</Label>
          <Select value={formData.intakeSource} onValueChange={(value) => handleSelectChange('intakeSource', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select client source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direct Client</SelectItem>
              <SelectItem value="agency">Through Training Agency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.intakeSource === 'agency' && (
          <div className="space-y-4 p-4 bg-brand-blue-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="selectedAgencyId">Training Agency</Label>
              <Select value={formData.selectedAgencyId} onValueChange={(value) => handleSelectChange('selectedAgencyId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select training agency" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency._id} value={agency._id}>
                      {agency.name} ({agency.revenueSharePercentage}% revenue share)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.selectedAgencyId && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Revenue Share</Label>
                  <div className="text-sm text-gray-600">
                    <div>{formData.agencyRevenueShare}% of session rate</div>
                    <div className="text-brand-green-700 font-medium">
                      Sales Tax Handling: {formData.agencyHandlesTax ? 'Agency Handles' : 'You Handle'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionRate">Session Rate ($)</Label>
            <Input
              id="sessionRate"
              name="sessionRate"
              type="number"
              min="0"
              step="0.01"
              value={formData.sessionRate}
              onChange={handleInputChange}
              placeholder="e.g., 125.00"
              className="w-40"
            />
            {sessionRateAmount > 0 && (
              <div className="space-y-2 mt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="bg-red-50 border border-red-200 p-2 rounded">
                    <div className="font-medium text-red-800">Deductions</div>
                    <div className="text-red-700">Sales Tax: ${sessionSalesTax.toFixed(2)}</div>
                    {formData.intakeSource === 'agency' && revenueSharePercentage > 0 && (
                      <div className="text-red-700">{agencyName}&apos;s Take: ${sessionRevenueShare.toFixed(2)}</div>
                    )}
                  </div>
                  
                  <div className="bg-brand-green-50 border border-brand-green-200 p-2 rounded">
                    <div className="font-medium text-brand-green-800">Madeline&apos;s Portion</div>
                    <div className="text-brand-green-700 font-bold">${sessionMadelinePortion.toFixed(2)}</div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                    <div className="font-medium text-blue-800">Tax Planning</div>
                    <div className="text-blue-700">Save (33%): ${sessionTaxSavings.toFixed(2)}</div>
                    <div className="text-blue-700 font-bold">Take-home: ${sessionTakeHome.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Package Information (Optional)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalSessions">Total Sessions</Label>
              <Input
                id="totalSessions"
                name="totalSessions"
                type="number"
                min="0"
                value={formData.totalSessions}
                onChange={handleInputChange}
                placeholder="e.g., 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packagePrice">Package Price ($)</Label>
              <Input
                id="packagePrice"
                name="packagePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.packagePrice}
                onChange={handleInputChange}
                placeholder="e.g., 375.00"
              />
            </div>
          </div>
          
          {packagePriceAmount > 0 && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              {perSessionRate > 0 && (
                <div className="text-sm text-brand-blue-700 font-medium bg-brand-blue-50 p-2 rounded">
                  Per-Session Rate: ${perSessionRate.toFixed(2)}
                </div>
              )}
              
              {/* Toggle for Total vs Per-Session View */}
              <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="total"
                    checked={packageViewMode === 'total'}
                    onChange={(e) => setPackageViewMode(e.target.value as 'total' | 'per-session')}
                    className="text-brand-blue-700"
                  />
                  <span className="text-sm">Total Package</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="per-session"
                    checked={packageViewMode === 'per-session'}
                    onChange={(e) => setPackageViewMode(e.target.value as 'total' | 'per-session')}
                    className="text-brand-blue-700"
                  />
                  <span className="text-sm">Per Session</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-red-50 border border-red-200 p-2 rounded">
                  <div className="font-medium text-red-800">
                    Deductions {packageViewMode === 'per-session' && '(Per Session)'}
                  </div>
                  <div className="text-red-700">
                    Sales Tax: ${packageViewMode === 'total' ? packageSalesTax.toFixed(2) : packageSalesTaxPerSession.toFixed(2)}
                  </div>
                  {formData.intakeSource === 'agency' && revenueSharePercentage > 0 && (
                    <div className="text-red-700">
                      {agencyName}&apos;s Take: ${packageViewMode === 'total' ? packageRevenueShare.toFixed(2) : packageRevenueSharePerSession.toFixed(2)}
                    </div>
                  )}
                </div>
                
                <div className="bg-brand-green-50 border border-brand-green-200 p-2 rounded">
                  <div className="font-medium text-brand-green-800">
                    Madeline&apos;s Portion {packageViewMode === 'per-session' && '(Per Session)'}
                  </div>
                  <div className="text-brand-green-700 font-bold">
                    ${packageViewMode === 'total' ? packageMadelinePortion.toFixed(2) : packageMadelinePortionPerSession.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                  <div className="font-medium text-blue-800">
                    Tax Planning {packageViewMode === 'per-session' && '(Per Session)'}
                  </div>
                  <div className="text-blue-700">
                    Save (33%): ${packageViewMode === 'total' ? packageTaxSavings.toFixed(2) : packageTaxSavingsPerSession.toFixed(2)}
                  </div>
                  <div className="text-blue-700 font-bold">
                    Take-home: ${packageViewMode === 'total' ? packageTakeHome.toFixed(2) : packageTakeHomePerSession.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-brand-purple-700">Emergency Contact</h3>
          <span className="text-sm text-gray-500">(Optional)</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Name</Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleInputChange}
              placeholder="Emergency contact name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Phone</Label>
            <Input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={handleInputChange}
              placeholder="Emergency contact phone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelationship">Relationship</Label>
            <Input
              id="emergencyContactRelationship"
              name="emergencyContactRelationship"
              value={formData.emergencyContactRelationship}
              onChange={handleInputChange}
              placeholder="e.g., Spouse, Friend, etc."
            />
          </div>
        </div>
      </div>

      {/* Dog Information */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-brand-purple-700">Dog Information</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dogBreed">Breed</Label>
            <Input
              id="dogBreed"
              name="dogBreed"
              value={formData.dogBreed}
              onChange={handleInputChange}
              placeholder="e.g., Golden Retriever"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dogWeight">Weight (lbs)</Label>
            <Input
              id="dogWeight"
              name="dogWeight"
              type="number"
              min="0"
              step="0.1"
              value={formData.dogWeight}
              onChange={handleInputChange}
              placeholder="e.g., 65.5"
            />
          </div>
          <div className="space-y-2 flex items-end">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dogSpayedNeutered"
                checked={formData.dogSpayedNeutered}
                onCheckedChange={(checked) => handleCheckboxChange('dogSpayedNeutered', checked as boolean)}
              />
              <Label htmlFor="dogSpayedNeutered">Spayed/Neutered</Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Behavior Concerns (Check all that apply)</Label>
          <div className="grid grid-cols-2 gap-2">
            {behaviorConcernOptions.map((concern) => (
              <div key={concern} className="flex items-center space-x-2">
                <Checkbox
                  id={`behavior-${concern}`}
                  checked={formData.behaviorConcerns.includes(concern)}
                  onCheckedChange={(checked) => handleBehaviorConcernChange(concern, checked as boolean)}
                />
                <Label htmlFor={`behavior-${concern}`}>{concern}</Label>
              </div>
            ))}
          </div>
          
          {formData.behaviorConcerns.includes('Other (Please Specify)') && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="behaviorConcernOther">Please specify other behavior concern:</Label>
              <Input
                id="behaviorConcernOther"
                name="behaviorConcernOther"
                value={formData.behaviorConcernOther}
                onChange={handleInputChange}
                placeholder="Describe the specific behavior concern"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="previousTraining"
              checked={formData.previousTraining}
              onCheckedChange={(checked) => handleCheckboxChange('previousTraining', checked as boolean)}
            />
            <Label htmlFor="previousTraining">Previous training experience</Label>
          </div>
        </div>

        {formData.previousTraining && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="previousTrainingDetails">Previous Training Details</Label>
            <Textarea
              id="previousTrainingDetails"
              name="previousTrainingDetails"
              value={formData.previousTrainingDetails}
              onChange={handleInputChange}
              placeholder="Describe previous training experience, methods used, results, etc."
              className="h-24"
            />
          </div>
        )}
      </div>

      {/* File Uploads */}
      <div className="space-y-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-brand-purple-700">File Uploads</h3>
        
        {/* Vaccination Records */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Vaccination Records</h4>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                <Loader2 className="w-8 h-8 mx-auto text-green-500 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
              )}
              <p className="text-sm text-gray-600">
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
                  <Label htmlFor="vaccination" className="cursor-pointer inline-block">
                    <Input
                      id="vaccination"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'vaccination')}
                      className="hidden"
                    />
                    <span className="bg-brand-blue-700 text-white px-4 py-2 rounded-md hover:bg-brand-blue-100 hover:text-brand-blue-700 transition-colors">
                      Choose Files
                    </span>
                  </Label>
                  <p className="text-xs text-gray-500">PDF, JPG, JPEG, or PNG files</p>
                </>
              )}
            </div>
          </div>
          
          {formData.vaccinationRecords.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Uploaded Files:</h5>
              <ul className="space-y-2">
                {formData.vaccinationRecords.map((record, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
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
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Dog Photo */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Dog Photo</h4>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin" />
              ) : (
                <Image className="w-8 h-8 mx-auto text-gray-400" />
              )}
              <p className="text-sm text-gray-600">
                {uploadingStates.dogPhoto 
                  ? 'Uploading...' 
                  : dragStates.dogPhoto 
                  ? 'Drop image here' 
                  : 'Drag and drop a photo of the dog here'
                }
              </p>
              {!uploadingStates.dogPhoto && (
                <>
                  <p className="text-xs text-gray-500">or</p>
                  <Label htmlFor="dogPhoto" className="cursor-pointer inline-block">
                    <Input
                      id="dogPhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'dogPhoto')}
                      className="hidden"
                    />
                    <span className="bg-brand-green-700 text-white px-4 py-2 rounded-md hover:bg-brand-green-100 hover:text-brand-green-700 transition-colors">
                      Choose Photo
                    </span>
                  </Label>
                  <p className="text-xs text-gray-500">Any image format</p>
                </>
              )}
            </div>
          </div>
          
          {formData.dogPhoto.url && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Uploaded Photo:</h5>
              <div className="relative inline-block">
                <img
                  src={formData.dogPhoto.url}
                  alt="Dog"
                  className="max-w-xs rounded-lg shadow-md"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteFile('dogPhoto')}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                  title="Delete photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Liability Waiver */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Liability Waiver</h4>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragStates.liabilityWaiver 
                ? 'border-blue-400 bg-blue-50' 
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
                <Loader2 className="w-8 h-8 mx-auto text-green-500 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
              )}
              <p className="text-sm text-gray-600">
                {uploadingStates.liabilityWaiver 
                  ? 'Uploading...' 
                  : dragStates.liabilityWaiver 
                  ? 'Drop file here' 
                  : 'Drag and drop the liability waiver here'
                }
              </p>
              {!uploadingStates.liabilityWaiver && (
                <>
                  <p className="text-xs text-gray-500">or</p>
                  <Label htmlFor="liabilityWaiver" className="cursor-pointer inline-block">
                    <Input
                      id="liabilityWaiver"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, 'liabilityWaiver')}
                      className="hidden"
                    />
                    <span className="bg-brand-purple-700 text-white px-4 py-2 rounded-md hover:bg-brand-purple-100 hover:text-brand-purple-700 transition-colors">
                      Choose PDF
                    </span>
                  </Label>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </>
              )}
            </div>
          </div>
          
          {formData.liabilityWaiver.url && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Uploaded Waiver:</h5>
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <a href={formData.liabilityWaiver.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm flex-1">
                  {formData.liabilityWaiver.name}
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
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-brand-purple-700">Notes</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Client-Visible Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Notes that the client can see..."
              className="h-24"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes (Internal Only)</Label>
            <Textarea
              id="adminNotes"
              name="adminNotes"
              value={formData.adminNotes}
              onChange={handleInputChange}
              placeholder="Internal notes for admin use only..."
              className="h-24"
            />
          </div>
        </div>
      </div>

      {/* Intake Status */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-brand-purple-700">Intake Status</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="intakeCompleted"
            checked={formData.intakeCompleted}
            onCheckedChange={(checked) => handleCheckboxChange('intakeCompleted', checked as boolean)}
          />
          <Label htmlFor="intakeCompleted">Mark intake as completed</Label>
        </div>
      </div>

      {/* Submit and Cancel Buttons */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={() => router.push('/clients')}
            disabled={isLoading}
            variant="outline"
            className="flex-1 py-3 text-lg font-medium border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 hover:text-brand-green-700 py-3 text-lg font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Client...
              </>
            ) : (
              'Create Client'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
} 