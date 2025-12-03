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
  // Multiple signature support - one per owner (primary + co-owners)
  const [signatureCanvases, setSignatureCanvases] = useState<Map<number, HTMLCanvasElement>>(new Map());
  const [isDrawing, setIsDrawing] = useState<Map<number, boolean>>(new Map());
  const [hasSignature, setHasSignature] = useState<Map<number, boolean>>(new Map());
  const [signatureMethods, setSignatureMethods] = useState<Map<number, 'typed' | 'drawn'>>(new Map());
  const [typedSignatures, setTypedSignatures] = useState<Map<number, string>>(new Map());
  const [isWaiverOpen, setIsWaiverOpen] = useState(false);
  
  // Helper to get signature canvas ref for a specific owner index
  const getSignatureCanvasRef = (ownerIndex: number) => {
    return (el: HTMLCanvasElement | null) => {
      if (el) {
        setSignatureCanvases(prev => new Map(prev).set(ownerIndex, el));
      } else {
        setSignatureCanvases(prev => {
          const newMap = new Map(prev);
          newMap.delete(ownerIndex);
          return newMap;
        });
      }
    };
  };
  const [formData, setFormData] = useState({
    name: '',
    dogName: '',
    email: '',
    phone: '',
    dogBirthdate: '',
    // Personal Information
    pronouns: '',
    // Address fields (optional)
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    addressZipCode: '',
    // Additional Contacts
    additionalContacts: [] as {name:string;email:string;phone:string}[],
    // Emergency Contact
    emergencyContact: { name: '', phone: '', relationship: '' },
    // Additional Dogs
    additionalDogs: [] as {name:string;birthdate:string;breed:string;weight:number;reproductiveStatus:string}[],
    // Enhanced Dog Information
    dogInfo: {
      breed: '',
      weight: 0,
      spayedNeutered: false,
      reproductiveStatus: '',
      source: '',
      timeWithDog: '',
      diet: '',
      favoriteThing: '',
      behaviorConcerns: [] as string[],
      previousTraining: false,
      previousTrainingDetails: ''
    },
    // Household Information
    householdInfo: {
      otherPets: [] as {type:string;name:string;age:string}[],
      childrenInHousehold: false,
      childrenAges: '',
      allergies: { human: '', dog: '' }
    },
    // Medical Information
    medicalInfo: {
      veterinarian: { name: '', clinic: '', phone: '' },
      medicalIssues: '',
      currentMedications: [] as {name:string;dosage:string;prescribedFor:string}[],
      pastBehavioralMedications: [] as {name:string;prescribedFor:string}[]
    },
    // Behavioral Information
    behavioralInfo: {
      trainingGoals: '',
      biteHistory: { hasBitten: false, incidents: [] as {description:string;date:string;severity:string}[] },
      behavioralIssues: '',
      additionalNotes: ''
    },
    vaccinationRecords: [] as { name: string; url: string; s3Key?: string; publicId?: string; resourceType: string }[],
    dogPhoto: { url: '', s3Key: '', resourceType: '' },
    liabilityWaiver: { url: '', s3Key: '', resourceType: '' },
    waiverSigned: [] as Array<{
      name: string;
      email?: string;
      signed: boolean;
      signedAt: Date;
      signatureDataUrl?: string;
      typedSignatureName?: string;
    }>
  });

  // Quick autofill helpers for "N/A" or default values
  const fillNAByName = (name: string) => {
    setFormData(prev => ({ ...prev, [name]: 'N/A' } as typeof prev));
  };
  const fillNAByPath = (path: string[], value: unknown = 'N/A') => {
    handleNestedChange(path, value);
  };

  // Prepare canvases for drawn signatures when method changes
  useEffect(() => {
    signatureCanvases.forEach((canvas, ownerIndex) => {
      const method = signatureMethods.get(ownerIndex) || 'typed';
      if (method !== 'drawn') return;
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
    });
  }, [signatureMethods, signatureCanvases]);

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

  // Helper functions for nested data structures
  const handleNestedChange = (path: string[], value: unknown) => {
    setFormData(prev => {
      const newData = { ...prev } as Record<string, unknown>;
      let current: Record<string, unknown> = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] = { ...(current[path[i]] as Record<string, unknown>) };
      }
      current[path[path.length - 1]] = value;
      return newData as typeof prev;
    });
  };

  const addArrayItem = (path: string[], newItem: unknown) => {
    setFormData(prev => {
      const newData = { ...prev } as Record<string, unknown>;
      let current: Record<string, unknown> = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] = { ...(current[path[i]] as Record<string, unknown>) };
      }
      current[path[path.length - 1]] = [...(current[path[path.length - 1]] as unknown[]), newItem];
      return newData as typeof prev;
    });
  };

  const removeArrayItem = (path: string[], index: number) => {
    setFormData(prev => {
      const newData = { ...prev } as Record<string, unknown>;
      let current: Record<string, unknown> = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] = { ...(current[path[i]] as Record<string, unknown>) };
      }
      current[path[path.length - 1]] = (current[path[path.length - 1]] as unknown[]).filter((_: unknown, i: number) => i !== index);
      return newData as typeof prev;
    });
  };

  const updateArrayItem = (path: string[], index: number, field: string, value: unknown) => {
    setFormData(prev => {
      const newData = { ...prev } as Record<string, unknown>;
      let current: Record<string, unknown> = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] = { ...(current[path[i]] as Record<string, unknown>) };
      }
      const updated = [...(current[path[path.length - 1]] as unknown[])];
      updated[index] = { ...(updated[index] as Record<string, unknown>), [field]: value };
      current[path[path.length - 1]] = updated;
      return newData as typeof prev;
    });
  };

  const handleDeleteFile = async (type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver', index?: number) => {
    if (type === 'vaccination' && index !== undefined) {
      const file = formData.vaccinationRecords[index];
      const s3Key = (file as { s3Key?: string; publicId?: string }).s3Key || (file as { s3Key?: string; publicId?: string }).publicId;
      if (!s3Key) return;

      try {
        const response = await fetch('/api/portal/delete-upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key })
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
      const s3Key = (file as { s3Key?: string; publicId?: string }).s3Key || (file as { s3Key?: string; publicId?: string }).publicId;
      if (!s3Key) return;

      try {
        const response = await fetch('/api/portal/delete-upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key })
        });

        if (response.ok) {
          setFormData(prev => ({
            ...prev,
            dogPhoto: { url: '', s3Key: '', resourceType: '' }
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
      const s3Key = (file as { s3Key?: string; publicId?: string }).s3Key || (file as { s3Key?: string; publicId?: string }).publicId;
      if (!s3Key) return;
      try {
        const response = await fetch('/api/portal/delete-upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key })
        });
        if (response.ok) {
          setFormData(prev => ({
            ...prev,
            liabilityWaiver: { url: '', s3Key: '', resourceType: '' },
            waiverSigned: []
          }));
          // Reset all signature state
          setSignatureCanvases(new Map());
          setIsDrawing(new Map());
          setHasSignature(new Map());
          setSignatureMethods(new Map());
          setTypedSignatures(new Map());
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
      // 1. Get presigned URL from server
      const signRes = await fetch('/api/portal/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          fileName: file.name,
          contentType: file.type 
        }),
      });

      const signData = await signRes.json();
      if (!signData.success) throw new Error(signData.error || 'Failed to get upload signature');

      const { presignedUrl, s3Key, fileName: uploadedFileName } = signData;

      // 2. Upload file directly to S3 using presigned URL
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('S3 upload failed');
      }

      // 3. Get download URL for the uploaded file
      let url: string;
      try {
        const downloadUrlRes = await fetch('/api/portal/get-file-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key }),
        });

        if (!downloadUrlRes.ok) {
          const errorData = await downloadUrlRes.json();
          console.warn('Failed to get download URL, using presigned URL:', errorData);
          // Use the presigned upload URL as fallback (it's valid for GET too for a short time)
          url = presignedUrl;
        } else {
          const downloadData = await downloadUrlRes.json();
          url = downloadData.success ? downloadData.url : presignedUrl;
        }
      } catch (urlError) {
        console.warn('Error getting download URL, using presigned URL:', urlError);
        // Use the presigned upload URL as fallback
        url = presignedUrl;
      }

      if (type === 'vaccination') {
        setFormData(prev => ({
          ...prev,
          vaccinationRecords: [...prev.vaccinationRecords, { 
            name: file.name, 
            url, 
            s3Key, 
            resourceType: 'file' // Keep resourceType for backward compatibility
          }]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          dogPhoto: { url, s3Key, resourceType: 'file' }
        }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  // Signature draw handlers - support multiple owners
  const getCanvasPos = (e: PointerEvent | React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
  };

  const handleSigPointerDown = (ownerIndex: number) => (e: React.PointerEvent<HTMLCanvasElement>) => {
    const method = signatureMethods.get(ownerIndex) || 'typed';
    if (method !== 'drawn') return;
    const canvas = signatureCanvases.get(ownerIndex);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(prev => new Map(prev).set(ownerIndex, true));
  };

  const handleSigPointerMove = (ownerIndex: number) => (e: React.PointerEvent<HTMLCanvasElement>) => {
    const method = signatureMethods.get(ownerIndex) || 'typed';
    if (method !== 'drawn' || !isDrawing.get(ownerIndex)) return;
    const canvas = signatureCanvases.get(ownerIndex);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(prev => new Map(prev).set(ownerIndex, true));
  };

  const handleSigPointerUp = (ownerIndex: number) => () => {
    setIsDrawing(prev => {
      const newMap = new Map(prev);
      newMap.delete(ownerIndex);
      return newMap;
    });
  };

  const clearSignature = (ownerIndex: number) => {
    const method = signatureMethods.get(ownerIndex) || 'typed';
    if (method === 'drawn') {
      const canvas = signatureCanvases.get(ownerIndex);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      setHasSignature(prev => {
        const newMap = new Map(prev);
        newMap.delete(ownerIndex);
        return newMap;
      });
    } else {
      setTypedSignatures(prev => {
        const newMap = new Map(prev);
        newMap.delete(ownerIndex);
        return newMap;
      });
      setHasSignature(prev => {
        const newMap = new Map(prev);
        newMap.delete(ownerIndex);
        return newMap;
      });
    }
  };

  const attachSignedWaiver = async () => {
    if (!formData.name || !formData.dogName || !formData.email || !formData.phone) {
      alert('Please fill out your name, dog name, email, and phone before signing.');
      return;
    }

    // Collect all owners: primary owner (index 0) + co-owners
    const allOwners = [
      { name: formData.name, email: formData.email, phone: formData.phone, index: 0 }
    ];
    formData.additionalContacts.forEach((contact, idx) => {
      if (contact.name || contact.email || contact.phone) {
        allOwners.push({ 
          name: contact.name || '', 
          email: contact.email || '', 
          phone: contact.phone || '', 
          index: idx + 1 
        });
      }
    });

    // Validate all owners have signed
    const signatures: Array<{
      name: string;
      email?: string;
      phone?: string;
      signatureDataUrl?: string;
      typedSignatureName?: string;
    }> = [];

    for (const owner of allOwners) {
      if (!owner.name.trim()) {
        alert(`Please fill out the name for all owners before signing.`);
        return;
      }

      const method = signatureMethods.get(owner.index) || 'typed';
      const hasSig = hasSignature.get(owner.index) || false;
      const typedSig = typedSignatures.get(owner.index) || '';

      if (method === 'typed') {
        if (!typedSig.trim()) {
          alert(`Please provide a signature for ${owner.name || 'all owners'}.`);
          return;
        }
        signatures.push({
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          typedSignatureName: typedSig.trim(),
        });
      } else {
        const canvas = signatureCanvases.get(owner.index);
        if (!canvas || !hasSig) {
          alert(`Please provide a signature for ${owner.name || 'all owners'}.`);
          return;
        }
        signatures.push({
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          signatureDataUrl: canvas.toDataURL('image/png'),
        });
      }
    }

    try {
      setUploadingStates(prev => ({ ...prev, liabilityWaiver: true }));
      // 1. Generate PDF and get upload parameters
      const res = await fetch('/api/portal/generate-liability-waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dogName: formData.dogName,
          signatures, // Send array of signatures
          consent: true,
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create signed waiver');

      // 2. Upload PDF directly to S3 (same pattern as vaccination/dog photos)
      const {
        pdfBuffer,
        presignedUrl,
        s3Key,
      } = json;

      // Convert base64 to blob
      const byteCharacters = atob(pdfBuffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Upload to S3 using presigned URL
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!uploadRes.ok) {
        throw new Error('S3 upload failed');
      }

      // Get download URL for the uploaded file
      let url: string;
      try {
        const downloadUrlRes = await fetch('/api/portal/get-file-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key }),
        });

        if (!downloadUrlRes.ok) {
          const errorData = await downloadUrlRes.json();
          console.warn('Failed to get download URL for waiver, using presigned URL:', errorData);
          // Use the presigned upload URL as fallback (it's valid for GET too for a short time)
          url = presignedUrl;
        } else {
          const downloadData = await downloadUrlRes.json();
          url = downloadData.success ? downloadData.url : presignedUrl;
        }
      } catch (urlError) {
        console.warn('Error getting download URL for waiver, using presigned URL:', urlError);
        // Use the presigned upload URL as fallback
        url = presignedUrl;
      }

      // Liability waiver uploaded successfully - store signatures for submission
      const waiverSignatures = signatures.map(sig => ({
        name: sig.name,
        email: sig.email,
        signed: true,
        signedAt: new Date(),
        signatureDataUrl: sig.signatureDataUrl,
        typedSignatureName: sig.typedSignatureName,
      }));

      setFormData(prev => ({
        ...prev,
        liabilityWaiver: { url, s3Key, resourceType: 'file' },
        waiverSigned: waiverSignatures,
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
      // Delete all uploaded files from S3
      const deletePromises = [];
      
      // Delete vaccination records
      for (const record of formData.vaccinationRecords) {
        const s3Key = (record as { s3Key?: string; publicId?: string }).s3Key || (record as { s3Key?: string; publicId?: string }).publicId;
        if (s3Key) {
          deletePromises.push(
            fetch('/api/portal/delete-upload', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ s3Key })
            })
          );
        }
      }
      
      // Delete dog photo
      const dogPhotoS3Key = (formData.dogPhoto as { s3Key?: string; publicId?: string }).s3Key || (formData.dogPhoto as { s3Key?: string; publicId?: string }).publicId;
      if (dogPhotoS3Key) {
        deletePromises.push(
          fetch('/api/portal/delete-upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ s3Key: dogPhotoS3Key })
          })
        );
      }

      // Delete liability waiver
      const waiverS3Key = (formData.liabilityWaiver as { s3Key?: string; publicId?: string }).s3Key || (formData.liabilityWaiver as { s3Key?: string; publicId?: string }).publicId;
      if (waiverS3Key) {
        deletePromises.push(
          fetch('/api/portal/delete-upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ s3Key: waiverS3Key })
          })
        );
      }
      
      await Promise.all(deletePromises);
      
      // Reset signature state
      setSignatureCanvases(new Map());
      setIsDrawing(new Map());
      setHasSignature(new Map());
      setSignatureMethods(new Map());
      setTypedSignatures(new Map());
      
      // Reset form data
      setFormData({
        name: '',
        dogName: '',
        email: '',
        phone: '',
        dogBirthdate: '',
        pronouns: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        addressZipCode: '',
        additionalContacts: [],
        emergencyContact: { name: '', phone: '', relationship: '' },
        additionalDogs: [],
        dogInfo: {
          breed: '',
          weight: 0,
          spayedNeutered: false,
          reproductiveStatus: '',
          source: '',
          timeWithDog: '',
          diet: '',
          favoriteThing: '',
          behaviorConcerns: [],
          previousTraining: false,
          previousTrainingDetails: ''
        },
        householdInfo: {
          otherPets: [],
          childrenInHousehold: false,
          childrenAges: '',
          allergies: { human: '', dog: '' }
        },
        medicalInfo: {
          veterinarian: { name: '', clinic: '', phone: '' },
          medicalIssues: '',
          currentMedications: [],
          pastBehavioralMedications: []
        },
        behavioralInfo: {
          trainingGoals: '',
          biteHistory: { hasBitten: false, incidents: [] },
          behavioralIssues: '',
          additionalNotes: ''
        },
        vaccinationRecords: [],
        dogPhoto: { url: '', s3Key: '', resourceType: '' },
        liabilityWaiver: { url: '', s3Key: '', resourceType: '' },
        waiverSigned: []
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
    const waiverS3Key = (formData.liabilityWaiver as { s3Key?: string; publicId?: string }).s3Key || (formData.liabilityWaiver as { s3Key?: string; publicId?: string }).publicId;
    if (!formData.waiverSigned || !Array.isArray(formData.waiverSigned) || formData.waiverSigned.length === 0 || !waiverS3Key) {
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
          waiverSigned: formData.waiverSigned // Already in correct format from attachSignedWaiver
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

          {/* Row 3: Pronouns */}
          <div className="mt-4">
            <Label htmlFor="pronouns" className="flex items-center justify-between">
              <span>Pronouns</span>
              <button type="button" onClick={() => fillNAByName('pronouns')} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
            </Label>
            <Input
              id="pronouns"
              name="pronouns"
              value={formData.pronouns}
              onChange={handleInputChange}
              placeholder="e.g., she/her, they/them, he/him"
              required
            />
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

          {/* Emergency Contact */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-700">Emergency Contact</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="emergencyContact.name" className="flex items-center justify-between">
                  <span>Emergency Contact Name</span>
                  <button type="button" onClick={() => fillNAByPath(['emergencyContact','name'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
                <Input
                  id="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleNestedChange(['emergencyContact', 'name'], e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="emergencyContact.phone" className="flex items-center justify-between">
                  <span>Emergency Contact Phone</span>
                  <button type="button" onClick={() => fillNAByPath(['emergencyContact','phone'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
                <Input
                  id="emergencyContact.phone"
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleNestedChange(['emergencyContact', 'phone'], e.target.value)}
                  placeholder="Phone number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="emergencyContact.relationship" className="flex items-center justify-between">
                  <span>Relationship</span>
                  <button type="button" onClick={() => fillNAByPath(['emergencyContact','relationship'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
                <Input
                  id="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleNestedChange(['emergencyContact', 'relationship'], e.target.value)}
                  placeholder="e.g., Spouse, Parent, Friend"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-gray-700">Address Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addressLine1" className="flex items-center justify-between">
                  <span>Address Line 1</span>
                  <button type="button" onClick={() => fillNAByName('addressLine1')} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="addressLine2" className="flex items-center justify-between">
                  <span>Address Line 2</span>
                  <button type="button" onClick={() => fillNAByName('addressLine2')} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
                <Input
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, unit, etc."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="flex items-center justify-between">
                  <span>City</span>
                  <button type="button" onClick={() => fillNAByName('city')} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state" className="flex items-center justify-between">
                  <span>State</span>
                  <button type="button" onClick={() => fillNAByName('state')} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g., CA, NY, TX"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <Label htmlFor="addressZipCode" className="flex items-center justify-between">
                  <span>Zip Code</span>
                  <button type="button" onClick={() => fillNAByName('addressZipCode')} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
                <Input
                  id="addressZipCode"
                  name="addressZipCode"
                  value={formData.addressZipCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Dog Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Dog Information</h2>
          
          {/* Dog Breed and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dogInfo.breed" className="flex items-center justify-between">
                <span>Dog Breed</span>
                <button type="button" onClick={() => fillNAByPath(['dogInfo','breed'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
              </Label>
              <Input
                id="dogInfo.breed"
                value={formData.dogInfo.breed}
                onChange={(e) => handleNestedChange(['dogInfo', 'breed'], e.target.value)}
                placeholder="e.g., Golden Retriever, Mixed Breed"
                required
              />
            </div>
            <div>
              <Label htmlFor="dogInfo.weight" className="flex items-center justify-between">
                <span>Weight (lbs)</span>
                <button type="button" onClick={() => fillNAByPath(['dogInfo','weight'], 0)} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">0</button>
              </Label>
              <Input
                id="dogInfo.weight"
                type="number"
                value={formData.dogInfo.weight || ''}
                onChange={(e) => handleNestedChange(['dogInfo', 'weight'], parseInt(e.target.value) || 0)}
                placeholder="Weight in pounds"
                required
              />
            </div>
          </div>

          {/* Reproductive Status */}
          <div>
            <Label htmlFor="dogInfo.reproductiveStatus" className="flex items-center justify-between">
              <span>Spayed/Neutered</span>
              <button type="button" onClick={() => fillNAByPath(['dogInfo','reproductiveStatus'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
            </Label>
            <select
              id="dogInfo.reproductiveStatus"
              value={formData.dogInfo.reproductiveStatus}
              onChange={(e) => handleNestedChange(['dogInfo', 'reproductiveStatus'], e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select status</option>
              <option value="spayed">Spayed</option>
              <option value="neutered">Neutered</option>
              <option value="intact">Intact</option>
              <option value="N/A">N/A</option>
            </select>
          </div>

          {/* Dog Source and Time with Dog */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dogInfo.source" className="flex items-center justify-between">
                <span>Where did you get your dog?</span>
                <button type="button" onClick={() => fillNAByPath(['dogInfo','source'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
              </Label>
              <Input
                id="dogInfo.source"
                value={formData.dogInfo.source}
                onChange={(e) => handleNestedChange(['dogInfo', 'source'], e.target.value)}
                placeholder="e.g., Rescue, Breeder, Shelter"
                required
              />
            </div>
            <div>
              <Label htmlFor="dogInfo.timeWithDog" className="flex items-center justify-between">
                <span>How long have you had them?</span>
                <button type="button" onClick={() => fillNAByPath(['dogInfo','timeWithDog'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
              </Label>
              <Input
                id="dogInfo.timeWithDog"
                value={formData.dogInfo.timeWithDog}
                onChange={(e) => handleNestedChange(['dogInfo', 'timeWithDog'], e.target.value)}
                placeholder="e.g., 2 years, 6 months"
                required
              />
            </div>
          </div>

          {/* Diet and Favorite Thing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dogInfo.diet" className="flex items-center justify-between">
                <span>What does your dog eat?</span>
                <button type="button" onClick={() => fillNAByPath(['dogInfo','diet'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
              </Label>
              <Input
                id="dogInfo.diet"
                value={formData.dogInfo.diet}
                onChange={(e) => handleNestedChange(['dogInfo', 'diet'], e.target.value)}
                placeholder="Be specific with brands and formulas"
                required
              />
            </div>
            <div>
              <Label htmlFor="dogInfo.favoriteThing" className="flex items-center justify-between">
                <span>What is your dog&apos;s most favorite thing in the world?</span>
                <button type="button" onClick={() => fillNAByPath(['dogInfo','favoriteThing'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
              </Label>
              <Input
                id="dogInfo.favoriteThing"
                value={formData.dogInfo.favoriteThing}
                onChange={(e) => handleNestedChange(['dogInfo', 'favoriteThing'], e.target.value)}
                placeholder="e.g., Ball, Treats, Cuddles"
                required
              />
            </div>
          </div>

          {/* Previous Training */}
          <div>
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.dogInfo.previousTraining}
                onChange={(e) => handleNestedChange(['dogInfo', 'previousTraining'], e.target.checked)}
                className="rounded"
              />
              Has your dog had previous training?
            </Label>
            {formData.dogInfo.previousTraining && (
              <div className="mt-2">
                <Label htmlFor="dogInfo.previousTrainingDetails" className="flex items-center justify-between">
                  <span>Previous Training Details</span>
                  <button type="button" onClick={() => fillNAByPath(['dogInfo','previousTrainingDetails'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
                <textarea
                  id="dogInfo.previousTrainingDetails"
                  value={formData.dogInfo.previousTrainingDetails}
                  onChange={(e) => handleNestedChange(['dogInfo', 'previousTrainingDetails'], e.target.value)}
                  placeholder="Describe any previous training your dog has received"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* Household Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Household Information</h2>
          
          {/* Other Pets */}
          <div>
            <Label className="flex items-center justify-between">
              <span>Other Pets in Household</span>
              <button type="button" onClick={() => addArrayItem(['householdInfo','otherPets'], { type: 'N/A', name: 'N/A', age: 'N/A' })} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">Add N/A Pet</button>
            </Label>
            <div className="space-y-2">
              {formData.householdInfo.otherPets.map((pet, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                  <Input
                    placeholder="Pet type (e.g., Cat, Dog)"
                    value={pet.type}
                    onChange={(e) => updateArrayItem(['householdInfo', 'otherPets'], idx, 'type', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Pet name"
                    value={pet.name}
                    onChange={(e) => updateArrayItem(['householdInfo', 'otherPets'], idx, 'name', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Age"
                    value={pet.age}
                    onChange={(e) => updateArrayItem(['householdInfo', 'otherPets'], idx, 'age', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(['householdInfo', 'otherPets'], idx)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem(['householdInfo', 'otherPets'], { type: '', name: '', age: '' })}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-3 py-1 rounded"
              >
                + Add Pet
              </button>
            </div>
          </div>

          {/* Children in Household */}
          <div>
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.householdInfo.childrenInHousehold}
                onChange={(e) => handleNestedChange(['householdInfo', 'childrenInHousehold'], e.target.checked)}
                className="rounded"
              />
              Are there any children in the household?
            </Label>
            {formData.householdInfo.childrenInHousehold && (
              <div className="mt-2">
                <Label htmlFor="householdInfo.childrenAges" className="flex items-center justify-between">
                  <span>Children&apos;s Ages</span>
                  <button type="button" onClick={() => fillNAByPath(['householdInfo','childrenAges'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
                <Input
                  id="householdInfo.childrenAges"
                  value={formData.householdInfo.childrenAges}
                  onChange={(e) => handleNestedChange(['householdInfo', 'childrenAges'], e.target.value)}
                  placeholder="e.g., 5, 8, 12"
                  required={formData.householdInfo.childrenInHousehold}
                />
              </div>
            )}
          </div>

          {/* Allergies */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="householdInfo.allergies.human" className="flex items-center justify-between">
                <span>Human Allergies</span>
                <button type="button" onClick={() => fillNAByPath(['householdInfo','allergies','human'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
              </Label>
              <textarea
                id="householdInfo.allergies.human"
                value={formData.householdInfo.allergies.human}
                onChange={(e) => handleNestedChange(['householdInfo', 'allergies', 'human'], e.target.value)}
                placeholder="e.g., Cat allergies, Seasonal allergies"
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="householdInfo.allergies.dog" className="flex items-center justify-between">
                <span>Dog Allergies</span>
                <button type="button" onClick={() => fillNAByPath(['householdInfo','allergies','dog'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
              </Label>
              <textarea
                id="householdInfo.allergies.dog"
                value={formData.householdInfo.allergies.dog}
                onChange={(e) => handleNestedChange(['householdInfo', 'allergies', 'dog'], e.target.value)}
                placeholder="e.g., Chicken, Environmental"
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={2}
                required
              />
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Medical Information</h2>
          
          {/* Veterinarian */}
            <div className="grid grid-cols-3 gap-4">
            <div>
                <Label htmlFor="medicalInfo.veterinarian.name" className="flex items-center justify-between">
                  <span>Veterinarian Name</span>
                  <button type="button" onClick={() => fillNAByPath(['medicalInfo','veterinarian','name'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
              <Input
                id="medicalInfo.veterinarian.name"
                value={formData.medicalInfo.veterinarian.name}
                onChange={(e) => handleNestedChange(['medicalInfo', 'veterinarian', 'name'], e.target.value)}
                placeholder="Dr. Name"
                  required
              />
            </div>
            <div>
                <Label htmlFor="medicalInfo.veterinarian.clinic" className="flex items-center justify-between">
                  <span>Clinic Name</span>
                  <button type="button" onClick={() => fillNAByPath(['medicalInfo','veterinarian','clinic'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
              <Input
                id="medicalInfo.veterinarian.clinic"
                value={formData.medicalInfo.veterinarian.clinic}
                onChange={(e) => handleNestedChange(['medicalInfo', 'veterinarian', 'clinic'], e.target.value)}
                placeholder="Clinic Name"
                  required
              />
            </div>
            <div>
                <Label htmlFor="medicalInfo.veterinarian.phone" className="flex items-center justify-between">
                  <span>Phone Number</span>
                  <button type="button" onClick={() => fillNAByPath(['medicalInfo','veterinarian','phone'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
                </Label>
              <Input
                id="medicalInfo.veterinarian.phone"
                type="tel"
                value={formData.medicalInfo.veterinarian.phone}
                onChange={(e) => handleNestedChange(['medicalInfo', 'veterinarian', 'phone'], e.target.value)}
                placeholder="Phone number"
                  required
              />
            </div>
          </div>

          {/* Medical Issues */}
          <div>
            <Label htmlFor="medicalInfo.medicalIssues" className="flex items-center justify-between">
              <span>Known Medical Issues</span>
              <button type="button" onClick={() => fillNAByPath(['medicalInfo','medicalIssues'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
            </Label>
            <textarea
              id="medicalInfo.medicalIssues"
              value={formData.medicalInfo.medicalIssues}
              onChange={(e) => handleNestedChange(['medicalInfo', 'medicalIssues'], e.target.value)}
              placeholder="e.g., Hip dysplasia, Allergies, Arthritis"
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={2}
              required
            />
          </div>

          {/* Current Medications */}
          <div>
            <Label>Current Medications</Label>
            <div className="space-y-2">
              {formData.medicalInfo.currentMedications.map((med, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                  <Input
                    placeholder="Medication name"
                    value={med.name}
                    onChange={(e) => updateArrayItem(['medicalInfo', 'currentMedications'], idx, 'name', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) => updateArrayItem(['medicalInfo', 'currentMedications'], idx, 'dosage', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Prescribed for"
                    value={med.prescribedFor}
                    onChange={(e) => updateArrayItem(['medicalInfo', 'currentMedications'], idx, 'prescribedFor', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(['medicalInfo', 'currentMedications'], idx)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem(['medicalInfo', 'currentMedications'], { name: '', dosage: '', prescribedFor: '' })}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-3 py-1 rounded"
              >
                + Add Medication
              </button>
            </div>
          </div>

          {/* Past Behavioral Medications */}
          <div>
            <Label>Past Behavioral Medications</Label>
            <div className="space-y-2">
              {formData.medicalInfo.pastBehavioralMedications.map((med, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 items-end">
                  <Input
                    placeholder="Medication name"
                    value={med.name}
                    onChange={(e) => updateArrayItem(['medicalInfo', 'pastBehavioralMedications'], idx, 'name', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Prescribed for"
                    value={med.prescribedFor}
                    onChange={(e) => updateArrayItem(['medicalInfo', 'pastBehavioralMedications'], idx, 'prescribedFor', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(['medicalInfo', 'pastBehavioralMedications'], idx)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem(['medicalInfo', 'pastBehavioralMedications'], { name: '', prescribedFor: '' })}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-3 py-1 rounded"
              >
                + Add Past Medication
              </button>
            </div>
          </div>
        </div>

        {/* Behavioral Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Behavioral Information</h2>
          
          {/* Training Goals */}
          <div>
            <Label htmlFor="behavioralInfo.trainingGoals" className="flex items-center justify-between">
              <span>Primary reason for seeking training</span>
              <button type="button" onClick={() => fillNAByPath(['behavioralInfo','trainingGoals'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
            </Label>
            <textarea
              id="behavioralInfo.trainingGoals"
              value={formData.behavioralInfo.trainingGoals}
              onChange={(e) => handleNestedChange(['behavioralInfo', 'trainingGoals'], e.target.value)}
              placeholder="Describe what you'd like to work on with your dog"
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              required
            />
          </div>

          {/* Bite History */}
          <div>
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.behavioralInfo.biteHistory.hasBitten}
                onChange={(e) => handleNestedChange(['behavioralInfo', 'biteHistory', 'hasBitten'], e.target.checked)}
                className="rounded"
              />
              Has your dog ever bitten another dog or human?
            </Label>
            {formData.behavioralInfo.biteHistory.hasBitten && (
              <div className="mt-2 space-y-2">
                <Label>Bite Incidents</Label>
                {formData.behavioralInfo.biteHistory.incidents.map((incident, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                    <Input
                      placeholder="Description"
                      value={incident.description}
                      onChange={(e) => updateArrayItem(['behavioralInfo', 'biteHistory', 'incidents'], idx, 'description', e.target.value)}
                      required={formData.behavioralInfo.biteHistory.hasBitten}
                    />
                    <Input
                      type="date"
                      value={incident.date}
                      onChange={(e) => updateArrayItem(['behavioralInfo', 'biteHistory', 'incidents'], idx, 'date', e.target.value)}
                      required={formData.behavioralInfo.biteHistory.hasBitten}
                    />
                    <Input
                      placeholder="Severity"
                      value={incident.severity}
                      onChange={(e) => updateArrayItem(['behavioralInfo', 'biteHistory', 'incidents'], idx, 'severity', e.target.value)}
                      required={formData.behavioralInfo.biteHistory.hasBitten}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(['behavioralInfo', 'biteHistory', 'incidents'], idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem(['behavioralInfo', 'biteHistory', 'incidents'], { description: '', date: '', severity: '' })}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-3 py-1 rounded"
                >
                  + Add Incident
                </button>
              </div>
            )}
          </div>

          {/* Behavioral Issues */}
          <div>
            <Label htmlFor="behavioralInfo.behavioralIssues" className="flex items-center justify-between">
              <span>Behavioral Issues</span>
              <button type="button" onClick={() => fillNAByPath(['behavioralInfo','behavioralIssues'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
            </Label>
            <textarea
              id="behavioralInfo.behavioralIssues"
              value={formData.behavioralInfo.behavioralIssues}
              onChange={(e) => handleNestedChange(['behavioralInfo', 'behavioralIssues'], e.target.value)}
              placeholder="e.g., Leash reactivity, Separation anxiety, Barking"
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={2}
              required
            />
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="behavioralInfo.additionalNotes" className="flex items-center justify-between">
              <span>Anything else you&apos;d like me to know?</span>
              <button type="button" onClick={() => fillNAByPath(['behavioralInfo','additionalNotes'])} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">N/A</button>
            </Label>
            <textarea
              id="behavioralInfo.additionalNotes"
              value={formData.behavioralInfo.additionalNotes}
              onChange={(e) => handleNestedChange(['behavioralInfo', 'additionalNotes'], e.target.value)}
              placeholder="Any additional information that might be helpful for training"
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={4}
              required
            />
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
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Liability Waiver and Services Agreement</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 text-sm text-gray-700 min-h-0">
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

              <div className="mt-4 pt-4 border-t space-y-6">
                <Label className="text-sm font-semibold">Signatures Required</Label>
                <p className="text-xs text-gray-600">All owners must sign the waiver. Please provide a signature for each owner listed below.</p>
                
                {/* Primary Owner Signature */}
                <div className="space-y-2 border-b pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm font-medium flex-shrink-0">Primary Owner: {formData.name || 'Your Name'}</Label>
                    <div className="flex gap-2 items-center">
                      <button 
                        type="button" 
                        onClick={() => { 
                          setSignatureMethods(prev => new Map(prev).set(0, 'typed')); 
                          setHasSignature(prev => new Map(prev).set(0, Boolean(typedSignatures.get(0)?.trim()))); 
                        }} 
                        className={`px-2 py-1 text-xs rounded border ${(signatureMethods.get(0) || 'typed')==='typed' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                      >
                        Type
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { 
                          setSignatureMethods(prev => new Map(prev).set(0, 'drawn')); 
                          setHasSignature(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(0);
                            return newMap;
                          }); 
                        }} 
                        className={`px-2 py-1 text-xs rounded border ${(signatureMethods.get(0) || 'typed')==='drawn' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                      >
                        Draw
                      </button>
                      <Button type="button" variant="outline" size="sm" onClick={() => clearSignature(0)} className="text-blue-700 border-blue-300 hover:bg-blue-100 text-xs px-2 py-1 h-auto">Clear</Button>
                    </div>
                  </div>
                  {(signatureMethods.get(0) || 'typed') === 'typed' ? (
                    <div className="space-y-1">
                      <Input
                        placeholder="Type your full legal name"
                        value={typedSignatures.get(0) || ''}
                        onChange={(e) => { 
                          setTypedSignatures(prev => new Map(prev).set(0, e.target.value)); 
                          setHasSignature(prev => new Map(prev).set(0, Boolean(e.target.value.trim()))); 
                        }}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">By typing your name, you agree this constitutes your electronic signature (ESIGN/UETA).</p>
                    </div>
                  ) : (
                    <div className="border rounded-md bg-white">
                      <canvas
                        ref={getSignatureCanvasRef(0)}
                        className="w-full h-24 touch-none"
                        onPointerDown={handleSigPointerDown(0)}
                        onPointerMove={handleSigPointerMove(0)}
                        onPointerUp={handleSigPointerUp(0)}
                        onPointerLeave={handleSigPointerUp(0)}
                      />
                    </div>
                  )}
                </div>

                {/* Co-Owner Signatures */}
                {formData.additionalContacts.map((contact, idx) => {
                  if (!contact.name && !contact.email && !contact.phone) return null;
                  const ownerIndex = idx + 1;
                  return (
                    <div key={idx} className="space-y-2 border-b pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm font-medium flex-shrink-0">Co-Owner: {contact.name || `Co-Owner ${idx + 1}`}</Label>
                        <div className="flex gap-2 items-center">
                          <button 
                            type="button" 
                            onClick={() => { 
                              setSignatureMethods(prev => new Map(prev).set(ownerIndex, 'typed')); 
                              setHasSignature(prev => new Map(prev).set(ownerIndex, Boolean(typedSignatures.get(ownerIndex)?.trim()))); 
                            }} 
                            className={`px-2 py-1 text-xs rounded border ${(signatureMethods.get(ownerIndex) || 'typed')==='typed' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                          >
                            Type
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { 
                              setSignatureMethods(prev => new Map(prev).set(ownerIndex, 'drawn')); 
                              setHasSignature(prev => {
                                const newMap = new Map(prev);
                                newMap.delete(ownerIndex);
                                return newMap;
                              }); 
                            }} 
                            className={`px-2 py-1 text-xs rounded border ${(signatureMethods.get(ownerIndex) || 'typed')==='drawn' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                          >
                            Draw
                          </button>
                          <Button type="button" variant="outline" size="sm" onClick={() => clearSignature(ownerIndex)} className="text-blue-700 border-blue-300 hover:bg-blue-100 text-xs px-2 py-1 h-auto">Clear</Button>
                        </div>
                      </div>
                      {(signatureMethods.get(ownerIndex) || 'typed') === 'typed' ? (
                        <div className="space-y-1">
                          <Input
                            placeholder="Type your full legal name"
                            value={typedSignatures.get(ownerIndex) || ''}
                            onChange={(e) => { 
                              setTypedSignatures(prev => new Map(prev).set(ownerIndex, e.target.value)); 
                              setHasSignature(prev => new Map(prev).set(ownerIndex, Boolean(e.target.value.trim()))); 
                            }}
                            className="text-sm"
                          />
                          <p className="text-xs text-gray-500">By typing your name, you agree this constitutes your electronic signature (ESIGN/UETA).</p>
                        </div>
                      ) : (
                        <div className="border rounded-md bg-white">
                          <canvas
                            ref={getSignatureCanvasRef(ownerIndex)}
                            className="w-full h-24 touch-none"
                            onPointerDown={handleSigPointerDown(ownerIndex)}
                            onPointerMove={handleSigPointerMove(ownerIndex)}
                            onPointerUp={handleSigPointerUp(ownerIndex)}
                            onPointerLeave={handleSigPointerUp(ownerIndex)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Submit Button - check if all owners have signed */}
                <div className="flex gap-2 justify-end pt-2">
                  <Button 
                    type="button" 
                    onClick={async () => { 
                      await attachSignedWaiver(); 
                      if (!uploadingStates.liabilityWaiver) setIsWaiverOpen(false); 
                    }} 
                    disabled={uploadingStates.liabilityWaiver || !Array.from(hasSignature.values()).every(v => v)} 
                    className="bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800"
                  >
                    {uploadingStates.liabilityWaiver ? 'Attaching…' : 'All Owners Agree & Sign'}
                  </Button>
                </div>
              </div>

              <DialogFooter className="mt-2 flex-shrink-0 border-t pt-2">
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