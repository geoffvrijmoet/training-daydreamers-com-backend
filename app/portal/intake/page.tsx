'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Loader2, RefreshCw } from 'lucide-react';

export default function IntakePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [uploadingStates, setUploadingStates] = useState({
    vaccination: false,
    dogPhoto: false
  });
  const [dragStates, setDragStates] = useState({
    vaccination: false,
    dogPhoto: false
  });
  const [formData, setFormData] = useState({
    name: '',
    dogName: '',
    email: '',
    phone: '',
    dogBirthdate: '',
    // Address fields (optional)
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    addressZipCode: '',
    vaccinationRecords: [] as { name: string; url: string; publicId: string; resourceType: string }[],
    dogPhoto: { url: '', publicId: '', resourceType: '' },
    waiverSigned: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteFile = async (type: 'vaccination' | 'dogPhoto', index?: number) => {
    if (type === 'vaccination' && index !== undefined) {
      const file = formData.vaccinationRecords[index];
      if (!file.publicId) return;

      try {
        const response = await fetch('/api/portal/delete-upload', {
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
        const response = await fetch('/api/portal/delete-upload', {
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
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'vaccination' | 'dogPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadFile(file, type);
  };

  const uploadFile = async (file: File, type: 'vaccination' | 'dogPhoto') => {
    setUploadingStates(prev => ({ ...prev, [type]: true }));

    try {
      // 1. Get signed params
      const signRes = await fetch('/api/portal/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const signData = await signRes.json();
      if (!signData.success) throw new Error(signData.error || 'Failed to get upload signature');

      const {
        cloudName,
        apiKey,
        timestamp,
        folder,
        publicId,
        signature,
        resourceType,
      } = signData;

      // 2. Build form data for Cloudinary
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', apiKey);
      fd.append('timestamp', timestamp.toString());
      fd.append('signature', signature);
      fd.append('folder', folder);
      fd.append('public_id', publicId);

      const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const cloudRes = await fetch(cloudinaryEndpoint, { method: 'POST', body: fd });
      const cloudData = await cloudRes.json();
      if (!cloudRes.ok) throw new Error(cloudData.error?.message || 'Cloudinary upload failed');

      const { secure_url: url, public_id: returnedId, resource_type: returnedType } = cloudData;

      if (type === 'vaccination') {
        setFormData(prev => ({
          ...prev,
          vaccinationRecords: [...prev.vaccinationRecords, { 
            name: file.name, 
            url, 
            publicId: returnedId, 
            resourceType: returnedType 
          }]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          dogPhoto: { url, publicId: returnedId, resourceType: returnedType }
        }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDragOver = (e: React.DragEvent, type: 'vaccination' | 'dogPhoto') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, type: 'vaccination' | 'dogPhoto') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = async (e: React.DragEvent, type: 'vaccination' | 'dogPhoto') => {
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
    }

    await uploadFile(file, type);
  };

  const handleReset = async () => {
    setIsResetting(true);
    
    try {
      // Delete all uploaded files from Cloudinary
      const deletePromises = [];
      
      // Delete vaccination records
      for (const record of formData.vaccinationRecords) {
        if (record.publicId) {
          deletePromises.push(
            fetch('/api/portal/delete-upload', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                publicId: record.publicId, 
                resourceType: record.resourceType 
              })
            })
          );
        }
      }
      
      // Delete dog photo
      if (formData.dogPhoto.publicId) {
        deletePromises.push(
          fetch('/api/portal/delete-upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              publicId: formData.dogPhoto.publicId, 
              resourceType: formData.dogPhoto.resourceType 
            })
          })
        );
      }
      
      await Promise.all(deletePromises);
      
      // Reset form data
      setFormData({
        name: '',
        dogName: '',
        email: '',
        phone: '',
        dogBirthdate: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        addressZipCode: '',
        vaccinationRecords: [],
        dogPhoto: { url: '', publicId: '', resourceType: '' },
        waiverSigned: false
      });
      
    } catch (error) {
      console.error('Error resetting form:', error);
      alert('Some files may not have been deleted. Please refresh the page and try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.waiverSigned) {
      alert('Please sign the waiver to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/clients/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          waiverSigned: {
            signed: true,
            signedAt: new Date()
          }
        })
      });

      if (!response.ok) throw new Error('Submission failed');

      const { clientId } = await response.json();
      router.push(`/portal/clients/${clientId}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Client Intake Form</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="dogName">Dog&apos;s Name</Label>
              <Input
                id="dogName"
                name="dogName"
                value={formData.dogName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dogBirthdate">Dog&apos;s Birthdate</Label>
              <Input
                id="dogBirthdate"
                name="dogBirthdate"
                type="date"
                value={formData.dogBirthdate}
                onChange={handleInputChange}
                required
                className="max-w-md"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-gray-700">Address Information</h3>
              <span className="text-sm text-gray-500">(Optional)</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  placeholder="Street address"
                />
              </div>
              <div>
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
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              <div>
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
              <div>
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
        </div>

        {/* Vaccination Records */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Vaccination Records</h2>
          
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
                <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
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
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
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
              <h3 className="text-sm font-medium">Uploaded Files:</h3>
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
          <h2 className="text-xl font-semibold">Dog Photo</h2>
          
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
                <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              <p className="text-sm text-gray-600">
                {uploadingStates.dogPhoto 
                  ? 'Uploading...' 
                  : dragStates.dogPhoto 
                  ? 'Drop image here' 
                  : 'Drag and drop a photo of your dog here'
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
                    <span className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors">
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
              <h3 className="text-sm font-medium">Uploaded Photo:</h3>
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

        {/* Waiver */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Liability Waiver</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-4">
              By signing this waiver, you acknowledge that you understand and agree to the following:
              <br /><br />
              1. Training sessions may involve physical activity and interaction with your dog.
              <br />
              2. While we take all necessary precautions, there is always a risk of injury to you, your dog, or others.
              <br />
              3. You are responsible for your dog&apos;s behavior and any damage or injury caused by your dog.
              <br />
              4. You will follow all instructions and safety guidelines provided by the trainer.
              <br />
              5. You understand that training results may vary and are not guaranteed.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="waiver"
                checked={formData.waiverSigned}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, waiverSigned: checked as boolean }))
                }
              />
              <Label htmlFor="waiver">
                I have read and agree to the terms of this waiver
              </Label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting || isResetting}
            className="flex items-center gap-2"
          >
            {isResetting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isResetting ? 'Resetting...' : 'Reset Form'}
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || isResetting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Intake Form'}
          </Button>
        </div>
      </form>
    </div>
  );
} 