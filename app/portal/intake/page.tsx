'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Textarea } from '@/components/ui/textarea';
// import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Loader2, RefreshCw } from 'lucide-react';

export default function IntakePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<'typed' | 'drawn'>('typed');
  const [typedSignature, setTypedSignature] = useState('');
  const [isWaiverOpen, setIsWaiverOpen] = useState(false);
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
    // Additional Contacts
    additionalContacts: [] as {name:string;email:string;phone:string}[],
    vaccinationRecords: [] as { name: string; url: string; publicId: string; resourceType: string }[],
    dogPhoto: { url: '', publicId: '', resourceType: '' },
    liabilityWaiver: { url: '', publicId: '', resourceType: '' },
    waiverSigned: false
  });

  // Prepare canvas for drawn signature only when needed
  useEffect(() => {
    if (signatureMethod !== 'drawn') return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111827';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
  }, [signatureMethod]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdditionalContactChange=(index:number, field:keyof {name:string;email:string;phone:string}, value:string)=>{
    setFormData(prev=>{
      const updated=[...prev.additionalContacts];
      updated[index]={...updated[index],[field]:value};
      return {...prev, additionalContacts:updated};
    });
  };

  const addAdditionalContact=()=>{
    setFormData(prev=>({...prev, additionalContacts:[...prev.additionalContacts,{name:'',email:'',phone:''}]}));
  };

  const removeAdditionalContact=(idx:number)=>{
    setFormData(prev=>({...prev, additionalContacts:prev.additionalContacts.filter((_,i)=>i!==idx)}));
  };

  const handleDeleteFile = async (type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver', index?: number) => {
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
    } else if (type === 'liabilityWaiver') {
      const file = formData.liabilityWaiver;
      if (!file.publicId) return;
      try {
        const response = await fetch('/api/portal/delete-upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            publicId: file.publicId, 
            resourceType: file.resourceType || 'raw'
          })
        });
        if (response.ok) {
          setFormData(prev => ({
            ...prev,
            liabilityWaiver: { url: '', publicId: '', resourceType: '' },
            waiverSigned: false
          }));
          setHasSignature(false);
        } else {
          alert('Failed to delete waiver. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting waiver:', error);
        alert('Failed to delete waiver. Please try again.');
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

  // Signature draw handlers
  const getCanvasPos = (e: PointerEvent | React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
  };

  const handleSigPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (signatureMethod !== 'drawn') return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleSigPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (signatureMethod !== 'drawn' || !isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const handleSigPointerUp = () => {
    if (signatureMethod !== 'drawn') return;
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (signatureMethod === 'drawn') {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      setHasSignature(false);
    } else {
      setTypedSignature('');
      setHasSignature(false);
    }
  };

  const attachSignedWaiver = async () => {
    if (!formData.name || !formData.dogName || !formData.email || !formData.phone) {
      alert('Please fill out your name, dog name, email, and phone before signing.');
      return;
    }
    if (signatureMethod === 'typed') {
      if (!typedSignature.trim()) {
        alert('Please type your full legal name as your signature.');
        return;
      }
    } else {
      const canvas = signatureCanvasRef.current;
      if (!canvas || !hasSignature) {
        alert('Please provide a signature first.');
        return;
      }
    }
    try {
      setUploadingStates(prev => ({ ...prev, liabilityWaiver: true }));
      // 1. Generate PDF and get upload parameters
      const res = await fetch('/api/portal/generate-liability-waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          dogName: formData.dogName,
          signatureDataUrl: signatureMethod === 'drawn' ? signatureCanvasRef.current?.toDataURL('image/png') : undefined,
          typedSignatureName: signatureMethod === 'typed' ? typedSignature.trim() : undefined,
          consent: true,
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create signed waiver');

      // 2. Upload PDF directly to Cloudinary (same pattern as vaccination/dog photos)
      const {
        pdfBuffer,
        cloudName,
        apiKey,
        timestamp,
        folder,
        publicId,
        signature,
        resourceType,
      } = json;

      // Convert base64 to blob
      const byteCharacters = atob(pdfBuffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Build form data for Cloudinary
      const fd = new FormData();
      fd.append('file', blob, 'waiver.pdf');
      fd.append('api_key', apiKey);
      fd.append('timestamp', timestamp.toString());
      fd.append('signature', signature);
      fd.append('folder', folder);
      fd.append('public_id', publicId);
      fd.append('access_mode', 'public');

      const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
      const cloudRes = await fetch(cloudinaryEndpoint, { method: 'POST', body: fd });
      const cloudData = await cloudRes.json();
      if (!cloudRes.ok) throw new Error(cloudData.error?.message || 'Cloudinary upload failed');

      const { secure_url: url, public_id: returnedId, resource_type: returnedType } = cloudData;

      console.log('Liability waiver upload response:', {
        url,
        publicId: returnedId,
        resourceType: returnedType,
        expectedPublicId: `${folder}/${publicId}`,
        actualPublicId: returnedId
      });


      setFormData(prev => ({
        ...prev,
        liabilityWaiver: { url, publicId: returnedId, resourceType: returnedType },
        waiverSigned: true,
      }));
    } catch (err) {
      console.error('Error attaching waiver:', err);
      alert('Failed to attach waiver. Please try again.');
    } finally {
      setUploadingStates(prev => ({ ...prev, liabilityWaiver: false }));
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

      // Delete liability waiver
      if (formData.liabilityWaiver.publicId) {
        deletePromises.push(
          fetch('/api/portal/delete-upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              publicId: formData.liabilityWaiver.publicId, 
              resourceType: formData.liabilityWaiver.resourceType || 'raw' 
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
        additionalContacts: [],
        vaccinationRecords: [],
        dogPhoto: { url: '', publicId: '', resourceType: '' },
        liabilityWaiver: { url: '', publicId: '', resourceType: '' },
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
    if (!formData.waiverSigned || !formData.liabilityWaiver.publicId) {
      alert('Please e-sign and attach the waiver to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/clients/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          additionalContacts: formData.additionalContacts.filter(c=>c.name||c.email||c.phone),
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
          
          {/* Row 1: Dog Name & Birthdate */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Row 2: Client Name + Email + Phone */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="button" onClick={addAdditionalContact} className="bg-green-100 hover:bg-green-200 text-green-700 font-bold px-2 py-1 rounded">+</button>
            </div>
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

          {/* Additional Contacts inline */}
          {formData.additionalContacts.length>0 && (
            <>
              <h4 className="text-md font-medium mt-4">Co-Owner(s)</h4>
              {formData.additionalContacts.map((c,idx)=>(
                <div key={idx} className="grid grid-cols-4 gap-4 mt-2 items-end">
                  <Input placeholder="Co-owner name" value={c.name} onChange={e=>handleAdditionalContactChange(idx,'name',e.target.value)} />
                  <Input placeholder="Co-owner email" value={c.email} type="email" onChange={e=>handleAdditionalContactChange(idx,'email',e.target.value)} />
                  <Input placeholder="Co-owner phone" value={c.phone} type="tel" onChange={e=>handleAdditionalContactChange(idx,'phone',e.target.value)} />
                  <button type="button" onClick={()=>removeAdditionalContact(idx)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </>
          )}

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.dogPhoto.url} alt="Dog" className="max-w-xs rounded-lg shadow-md" />
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
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            {!formData.liabilityWaiver.url ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">You must review and sign the liability waiver before submitting.</p>
                <Button type="button" onClick={() => setIsWaiverOpen(true)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800">Review & Sign Waiver</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white border rounded p-2">
                <a href={formData.liabilityWaiver.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800 underline text-sm">View Signed Waiver (PDF)</a>
                <button type="button" onClick={() => handleDeleteFile('liabilityWaiver')} className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded" title="Remove waiver">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <Dialog open={isWaiverOpen} onOpenChange={setIsWaiverOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Liability Waiver and Services Agreement</DialogTitle>
              </DialogHeader>
              <div className="h-[60vh] overflow-y-auto pr-2 space-y-3 text-sm text-gray-700">
                <p className="font-semibold">Liability for Potential Harm Caused By or To Dog</p>
                <p>If Dog causes property damage, or bites or injures any dog, animal or person (including but not limited to Trainer and Trainer’s agents), during or after the term of this Agreement, then Client agrees to pay all resulting losses and damages suffered or incurred, and to defend and indemnify Daydreamers Pet Supply LLC and Daydreamers Pet Supply LLC’s owners, and/or agents from any resulting claims, demands, lawsuits, losses, costs or expenses, including attorney fees.</p>
                <p>If Dog is injured in an accident or fight, gets sick during or after participating in a Daydreamers Pet Supply service or with a Daydreamers trainer, or is harmed in any other manner during or after the term of the Agreement, Client assumes the risk and agrees that Trainer should not be held responsible for any resulting injuries, illness, losses, damages, costs or expenses, even if that harm is caused in part by the negligence or carelessness of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents, unless it is caused by the gross negligence or the intentional misconduct of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents.</p>

                <p className="font-semibold">Liability for Potential Harm Caused to Client or Client’s property</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>I understand that Daydreamers Pet Supply LLC’s Training Services are not a place of recreation or amusement. Its sole purpose is the training and education of pets and pet owners.</li>
                  <li>I knowingly and voluntarily assume all of the risks inherent in engaging in contact with pets and owners, including those that may not be specifically enumerated herein.</li>
                  <li>The risk of injury from the activities involved is significant, including the potential for permanent disfigurement, and while particular rules, equipment, and personal discipline reduce this risk, the risk of serious injury does exist.</li>
                  <li>I knowingly and freely assume all such risks, both known and unknown, and assume full responsibility for my participation.</li>
                  <li>I willingly agree to comply with the stated instructions and policies and customary terms and conditions for participation.</li>
                  <li>I agree that I will not attend any Daydreamers Pet Supply LLC Training Services events or enter the premises of a Daydreamers Service if I believe I, or anyone in my household or with whom I have regular contact, has contracted or is suspected to have contracted COVID-19 and have not yet been cleared as non-contagious by a medical provider, or been exposed to a suspected or confirmed case of COVID-19 within the last 14 days.</li>
                  <li>If I observe any unusual significant hazard during my presence or participation, I will remove myself from participation and bring such to the attention of the nearest trainer or supervisor immediately.</li>
                  <li>I, for myself and on behalf of my heirs, assigns, personal representatives and next of kin, hereby release, indemnify and hold Daydreamers Pet Supply LLC, and their officers, officials, agents, clients and/or employees harmless with respect to any and all injury, illness, disability, death, or loss or damage to person or property, even if that injury, illness or other loss is caused in part by the negligence or carelessness of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents, unless it is caused by the gross negligence or the intentional misconduct of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents. This liability waiver and release extends to Daydreamers Pet Supply LLC together with all owners and employees.</li>
                </ul>

                <p className="font-semibold">Participation in the Dreamers Club</p>
                <p>I am aware that there are inherent risks and hazards involved in activities with and around off-leash dogs. If I attend the Dreamers Club (or other off-leash play/ meet and greets), I am voluntarily participating in these activities with knowledge of potential dangers. I am aware that any pet, regardless of training, handling, or environmental circumstance, is capable of biting, and that Daydreamers Pet Supply LLC also can not guarantee that I will not become infected with COVID-19 or other diseases, and I expressly acknowledge and assume all risks of injury, illness, or other loss, even if that injury, illness or other loss is caused in part by the negligence or carelessness of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents, unless it is caused by the gross negligence or the intentional misconduct of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents.</p>

                <p className="font-semibold">Medical Emergencies</p>
                <p>In the case of a medical emergency where Client is not present and/or cannot be reached, Trainer shall have the right to bring Dog to a veterinarian for treatment and to use our judgment (and rely on the judgment of said veterinarian) to authorize medical procedures in the Dog&apos;s best interest. Client agrees they will pay any medical bills or other costs associated with veterinary care which are provided during the time during which they could not be reached.</p>

                <p className="font-semibold">Trainer’s Option to Terminate Agreement in Case of Problems with Dog or Client</p>
                <p>At Trainer’s sole election, Trainer’s duties hereunder shall terminate if (a) in Trainer’s sole judgment Dog is dangerous or vicious to Trainer or any other person or animal, or interferes with the training of other dogs, or (b) Client breaches any term or condition of this Agreement, consistently fails to follow Trainer instructions, or refuses to comply with the stated instructions and policies and customary terms and conditions for participation. Upon termination in accordance with the foregoing, Trainer’s duties shall terminate but all other provisions of this Agreement shall continue in full force and effect.</p>

                <p className="font-semibold">Training Outcomes Not Guaranteed</p>
                <p>The parties confirm that, except for that which is specifically written in this Agreement, no promises, representations or oral understandings have been made with regard to Dog or anything else. Without limiting the generality of the foregoing, Client acknowledges that Trainer has not represented, promised, guaranteed or warranted that Dog will never bite, that Dog will not be dangerous or vicious in the future, that Dog will not exhibit other behavioral problems, or that the results of the training will last for any particular amount of time.</p>
                <p>Trainer will make every reasonable effort to help Client achieve training and behavior modification goals but makes no guarantee of Dog’s performance or behavior as a result of providing professional animal behavior consultation. Client understands that they and members of the household must follow Trainer’s instructions without modification, work with dog daily as recommended, and constantly reinforce training being given to Dog.</p>

                <p className="font-semibold">Payment, Cancellations and Refunds</p>
                <p>I agree to pay the agreed upon cost of training services within 24 hours of the session, unless otherwise agreed in writing. Cancellations may be made without penalty up to 24 hours prior to the session start time. Sessions canceled within 24 hours of the scheduled session will be paid in full, and Trainer reserves the right to convert late cancellations to Virtual sessions at the cost of the originally scheduled session. Under no circumstances are refunds given on services that have already been used. Packages and classes are non-refundable from the time of purchase, except in the cases of the re-homing or death of a dog, in which case evidence may be requested in the form of a notarized letter from a shelter or vet; in such cases, a refund may be requested in the form of account credit.</p>

                <p className="font-semibold">Entire Agreement, Severability, Written Modification Required</p>
                <p>This Agreement supersedes all prior discussions, representations, warranties and agreements of the parties, and expresses the entire agreement between Client and Trainer regarding the matters described above. This Agreement may be amended only by a written instrument signed by both Client and Trainer. If any term of this Agreement is to any extent illegal, otherwise invalid, or incapable of being enforced, such term shall be excluded to the extent of such invalidity or unenforceability; all other terms hereof shall remain in full force and effect; and, to the extent permitted and possible, the invalid or unenforceable term shall be deemed replaced by a term that is valid and enforceable and that comes closest to expressing the intention of such invalid or unenforceable term.</p>
              </div>

              <div className="mt-4 pt-4 border-t space-y-3">
                <Label className="text-sm">Signature</Label>
                <div className="flex gap-2 items-center text-sm">
                  <button type="button" onClick={() => { setSignatureMethod('typed'); setHasSignature(Boolean(typedSignature.trim())); }} className={`px-3 py-1 rounded border ${signatureMethod==='typed' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-blue-700 border-blue-300 hover:bg-blue-50'}`}>Type</button>
                  <button type="button" onClick={() => { setSignatureMethod('drawn'); setHasSignature(false); }} className={`px-3 py-1 rounded border ${signatureMethod==='drawn' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-blue-700 border-blue-300 hover:bg-blue-50'}`}>Draw</button>
                </div>
                {signatureMethod === 'typed' ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Type your full legal name"
                      value={typedSignature}
                      onChange={(e) => { setTypedSignature(e.target.value); setHasSignature(Boolean(e.target.value.trim())); }}
                    />
                    <p className="text-xs text-gray-600">By typing your name, you agree this constitutes your electronic signature (ESIGN/UETA).</p>
                  </div>
                ) : (
                  <div className="border rounded-md bg-white">
                    <canvas
                      ref={signatureCanvasRef}
                      className="w-full h-32 touch-none"
                      onPointerDown={handleSigPointerDown}
                      onPointerMove={handleSigPointerMove}
                      onPointerUp={handleSigPointerUp}
                      onPointerLeave={handleSigPointerUp}
                    />
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={clearSignature} className="text-blue-700 border-blue-300 hover:bg-blue-100">Clear</Button>
                  <Button type="button" onClick={async () => { await attachSignedWaiver(); if (!uploadingStates.liabilityWaiver) setIsWaiverOpen(false); }} disabled={uploadingStates.liabilityWaiver || !hasSignature} className="bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800">
                    {uploadingStates.liabilityWaiver ? 'Attaching…' : 'I Agree & Sign'}
                  </Button>
                </div>
              </div>

              <DialogFooter className="mt-2">
                <p className="text-xs text-gray-500">You will receive a copy of the signed waiver as a PDF link in your client record.</p>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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