'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, FileText, Upload } from 'lucide-react';

interface UploadState {
  isUploading: boolean;
  isGenerating: boolean;
  error: string | null;
  success: boolean;
  uploadedUrl: string | null;
}

interface SignatureData {
  name: string;
  email: string;
  phone: string;
  dogName: string;
  signatureDataUrl: string | null;
  typedSignatureName: string;
  consent: boolean;
}

interface SignatureState {
  method: 'typed' | 'drawn';
  hasSignature: boolean;
  typedSignature: string;
}

export default function TestPdfUploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isGenerating: false,
    error: null,
    success: false,
    uploadedUrl: null,
  });

  const [signatureData, setSignatureData] = useState<SignatureData>({
    name: '',
    email: '',
    phone: '',
    dogName: '',
    signatureDataUrl: null,
    typedSignatureName: '',
    consent: false,
  });

  const [signatureCanvas, setSignatureCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureState, setSignatureState] = useState<SignatureState>({
    method: 'typed',
    hasSignature: false,
    typedSignature: '',
  });

  const handleInputChange = (field: keyof SignatureData, value: string | boolean) => {
    setSignatureData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSignatureMethodChange = (method: 'typed' | 'drawn') => {
    setSignatureState(prev => ({
      ...prev,
      method,
      hasSignature: method === 'typed' ? Boolean(signatureState.typedSignature.trim()) : false,
    }));
  };

  const handleTypedSignatureChange = (value: string) => {
    setSignatureState(prev => ({
      ...prev,
      typedSignature: value,
      hasSignature: Boolean(value.trim()),
    }));
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (signatureCanvas) {
      const ctx = signatureCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
      }
    }
    setSignatureState(prev => ({
      ...prev,
      hasSignature: false,
      typedSignature: '',
    }));
    setSignatureData(prev => ({ ...prev, signatureDataUrl: null, typedSignatureName: '' }));
  };

  const generateAndUploadWaiver = async () => {
    if (!signatureData.name || !signatureData.dogName || !signatureData.email) {
      setUploadState(prev => ({ ...prev, error: 'Please fill in name, dog name, and email' }));
      return;
    }

    if (signatureState.method === 'typed') {
      if (!signatureState.typedSignature.trim()) {
        setUploadState(prev => ({ ...prev, error: 'Please type your full legal name as your signature' }));
        return;
      }
    } else {
      if (!signatureState.hasSignature) {
        setUploadState(prev => ({ ...prev, error: 'Please provide a signature first' }));
        return;
      }
    }

    setUploadState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Generate PDF
      const generateResponse = await fetch('/api/portal/generate-liability-waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signatureData.name,
          email: signatureData.email,
          phone: signatureData.phone,
          dogName: signatureData.dogName,
          signatureDataUrl: signatureState.method === 'drawn' ? signatureCanvas?.toDataURL('image/png') : undefined,
          typedSignatureName: signatureState.method === 'typed' ? signatureState.typedSignature.trim() : undefined,
          consent: signatureData.consent,
        }),
      });

      const generateData = await generateResponse.json();
      
      if (!generateData.success) {
        throw new Error(generateData.error || 'Failed to generate PDF');
      }

      console.log('PDF Generation Response:', generateData);

      setUploadState(prev => ({ ...prev, isGenerating: false, isUploading: true }));

      // Convert base64 to blob and upload to Cloudinary
      const { pdfBuffer, cloudName, apiKey, timestamp, folder, publicId, signature, resourceType } = generateData;
      
      const byteCharacters = atob(pdfBuffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Build form data for Cloudinary
      const formData = new FormData();
      formData.append('file', blob, 'waiver.pdf');
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('public_id', publicId);
      formData.append('access_mode', 'public');

      console.log('Uploading to Cloudinary with params:', {
        folder,
        publicId,
        resourceType,
        cloudName,
      });

      const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
      const cloudRes = await fetch(cloudinaryEndpoint, { 
        method: 'POST', 
        body: formData 
      });
      
      const cloudData = await cloudRes.json();
      
      console.log('Cloudinary Response:', cloudData);
      
      if (!cloudRes.ok) {
        throw new Error(cloudData.error?.message || 'Cloudinary upload failed');
      }

      const { secure_url: url, public_id: returnedId, resource_type: returnedType } = cloudData;
      
      // Test the URL generation endpoint
      const urlResponse = await fetch(`/api/portal/liability-waiver-url?publicId=${encodeURIComponent(returnedId)}&resourceType=${encodeURIComponent(returnedType)}`);
      const urlData = await urlResponse.json();
      
      console.log('URL Generation Response:', urlData);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        success: true,
        uploadedUrl: urlData.success ? urlData.url : url,
        error: null,
      }));

    } catch (err) {
      console.error('Error generating/uploading waiver:', err);
      setUploadState(prev => ({
        ...prev,
        isGenerating: false,
        isUploading: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false,
      }));
    }
  };

  const resetTest = () => {
    setUploadState({
      isUploading: false,
      isGenerating: false,
      error: null,
      success: false,
      uploadedUrl: null,
    });
    setSignatureData({
      name: '',
      email: '',
      phone: '',
      dogName: '',
      signatureDataUrl: null,
      typedSignatureName: '',
      consent: false,
    });
    setSignatureState({
      method: 'typed',
      hasSignature: false,
      typedSignature: '',
    });
    clearSignature();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-purple-700 mb-2">PDF Upload Test</h1>
        <p className="text-gray-600">Quick test of liability waiver PDF generation and Cloudinary upload - just fill in the fields and sign</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Liability Waiver Test
            </CardTitle>
            <CardDescription>
              Fill in the required fields and sign to test PDF generation and upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={signatureData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                  disabled={uploadState.isGenerating || uploadState.isUploading}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={signatureData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  disabled={uploadState.isGenerating || uploadState.isUploading}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={signatureData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  disabled={uploadState.isGenerating || uploadState.isUploading}
                />
              </div>
              <div>
                <Label htmlFor="dogName">Dog Name *</Label>
                <Input
                  id="dogName"
                  value={signatureData.dogName}
                  onChange={(e) => handleInputChange('dogName', e.target.value)}
                  placeholder="Your dog's name"
                  disabled={uploadState.isGenerating || uploadState.isUploading}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm">Signature Method</Label>
              <div className="flex gap-2 items-center text-sm">
                <button 
                  type="button" 
                  onClick={() => handleSignatureMethodChange('typed')} 
                  className={`px-3 py-1 rounded border ${
                    signatureState.method === 'typed' 
                      ? 'bg-blue-100 text-blue-700 border-blue-300' 
                      : 'text-blue-700 border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  Type
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSignatureMethodChange('drawn')} 
                  className={`px-3 py-1 rounded border ${
                    signatureState.method === 'drawn' 
                      ? 'bg-blue-100 text-blue-700 border-blue-300' 
                      : 'text-blue-700 border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  Draw
                </button>
              </div>

              {signatureState.method === 'typed' ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Type your full legal name"
                    value={signatureState.typedSignature}
                    onChange={(e) => handleTypedSignatureChange(e.target.value)}
                    disabled={uploadState.isGenerating || uploadState.isUploading}
                  />
                  <p className="text-xs text-gray-600">
                    By typing your name, you agree this constitutes your electronic signature (ESIGN/UETA).
                  </p>
                </div>
              ) : (
                <div className="border rounded-md bg-white">
                  <canvas
                    ref={(canvas) => {
                      if (canvas) {
                        setSignatureCanvas(canvas);
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.strokeStyle = '#000';
                          ctx.lineWidth = 2;
                          ctx.lineCap = 'round';
                        }
                      }
                    }}
                    width={400}
                    height={200}
                    className="w-full h-32 touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={clearSignature}
                  disabled={uploadState.isGenerating || uploadState.isUploading}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Clear
                </Button>
              </div>

              {signatureState.hasSignature && (
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {signatureState.method === 'typed' ? 'Signature ready' : 'Signature captured'}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={signatureData.consent}
                  onChange={(e) => handleInputChange('consent', e.target.checked)}
                  className="rounded"
                  disabled={uploadState.isGenerating || uploadState.isUploading}
                />
                <Label htmlFor="consent">I consent to the terms and conditions</Label>
              </div>

              {/* Upload Button */}
              <div className="pt-4">
                <Button
                  onClick={generateAndUploadWaiver}
                  disabled={uploadState.isGenerating || uploadState.isUploading || !signatureState.hasSignature || !signatureData.consent}
                  className="w-full bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800"
                >
                  {uploadState.isGenerating && (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  )}
                  {uploadState.isUploading && (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading to Cloudinary...
                    </>
                  )}
                  {!uploadState.isGenerating && !uploadState.isUploading && (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate & Upload Waiver
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Test Results
          </CardTitle>
          <CardDescription>
            Results from the PDF generation and Cloudinary upload
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {uploadState.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{uploadState.error}</AlertDescription>
            </Alert>
          )}

          {uploadState.success && uploadState.uploadedUrl && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>PDF generated and uploaded successfully!</p>
                  <a
                    href={uploadState.uploadedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View uploaded PDF
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetTest}>
              Reset Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>
            Current state and configuration details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Upload State:</strong> {JSON.stringify(uploadState, null, 2)}
            </div>
            <div>
              <strong>Signature Data:</strong> {JSON.stringify({
                ...signatureData,
                signatureDataUrl: signatureData.signatureDataUrl ? 'Captured' : 'Not captured'
              }, null, 2)}
            </div>
            <div>
              <strong>Signature State:</strong> {JSON.stringify(signatureState, null, 2)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
