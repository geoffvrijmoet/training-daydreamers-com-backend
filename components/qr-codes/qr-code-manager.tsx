"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QRCodeDisplay } from "./qr-code-display";
import { SavedQRCodes } from "./saved-qr-codes";
import Image from "next/image";

interface QRCodeData {
  id: string;
  name: string;
  type: string;
  url: string;
  description: string;
  createdAt: Date;
  qrCodeUrl: string;
  style?: QRCodeStyle;
}

interface QRCodeStyle {
  darkColor: string;
  lightColor: string;
  cornerSquareStyle: 'square' | 'dot' | 'extra-rounded';
  dotsStyle: 'square' | 'dots' | 'rounded' | 'classy';
}

const QR_CODE_PRESETS = [
  { 
    id: 'landing_page', 
    name: 'Training Website', 
    url: 'https://training.daydreamersnyc.com?' + new URLSearchParams({
      utm_source: 'qr_code',
      utm_medium: 'print',
      utm_campaign: 'offline_marketing',
      utm_content: 'training_landing_page'
    }).toString(),
    description: 'Main landing page for Daydreamers Dog Training'
  },
  { 
    id: 'instagram', 
    name: 'Instagram Profile', 
    url: 'https://instagram.com/daydreamersbk?' + new URLSearchParams({
      utm_source: 'qr_code',
      utm_medium: 'print',
      utm_campaign: 'offline_marketing',
      utm_content: 'instagram_profile'
    }).toString(),
    description: 'Daydreamers Instagram profile'
  },
];

const STYLE_PRESETS = [
  {
    id: 'classic',
    name: 'Classic',
    style: {
      darkColor: '#000000',
      lightColor: '#ffffff',
      cornerSquareStyle: 'square',
      dotsStyle: 'square'
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    style: {
      darkColor: '#2563eb',
      lightColor: '#ffffff',
      cornerSquareStyle: 'dot',
      dotsStyle: 'dots'
    }
  },
  {
    id: 'playful',
    name: 'Playful',
    style: {
      darkColor: '#ec4899',
      lightColor: '#ffffff',
      cornerSquareStyle: 'extra-rounded',
      dotsStyle: 'rounded'
    }
  },
  {
    id: 'brand',
    name: 'Brand Colors',
    style: {
      darkColor: '#f97316',
      lightColor: '#ffffff',
      cornerSquareStyle: 'square',
      dotsStyle: 'classy'
    }
  },
] as const;

// Add a function to help with URL generation
const generateTrackingUrl = (baseUrl: string, content: string) => {
  const params = new URLSearchParams({
    utm_source: 'qr_code',
    utm_medium: 'print',
    utm_campaign: 'offline_marketing',
    utm_content: content,
    utm_term: new Date().toISOString().split('T')[0] // Adds the generation date as a term
  });

  return `${baseUrl}?${params.toString()}`;
};

// Custom QR Code component with enhanced styling
function StyledQRCode({ value, style }: { value: string; style: QRCodeStyle }) {
  return (
    <div className="relative">
      <QRCodeSVG
        value={value}
        size={256}
        level="H"
        bgColor={style.lightColor}
        fgColor={style.darkColor}
        includeMargin={true}
        className={`
          transition-all duration-300
          ${style.cornerSquareStyle === 'dot' ? 'qr-rounded-corners' : ''}
          ${style.cornerSquareStyle === 'extra-rounded' ? 'qr-extra-rounded-corners' : ''}
          ${style.dotsStyle === 'dots' ? 'qr-dots' : ''}
          ${style.dotsStyle === 'rounded' ? 'qr-rounded' : ''}
          ${style.dotsStyle === 'classy' ? 'qr-classy' : ''}
        `}
      />
    </div>
  );
}

export function QRCodeManager() {
  const [name, setName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [description, setDescription] = useState("");
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLE_PRESETS[0].id);
  const [customStyle, setCustomStyle] = useState<QRCodeStyle>({
    darkColor: '#000000',
    lightColor: '#ffffff',
    cornerSquareStyle: 'square',
    dotsStyle: 'square'
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = QR_CODE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setName(preset.name);
      setDescription(preset.description);
    }
  };

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    const preset = STYLE_PRESETS.find(p => p.id === styleId);
    if (preset) {
      setCustomStyle(preset.style);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPreset) return;

    const preset = QR_CODE_PRESETS.find(p => p.id === selectedPreset);
    if (!preset) return;

    // Generate a unique tracking URL for this specific QR code
    const uniqueId = `${preset.id}_${Date.now()}`;
    const trackingUrl = generateTrackingUrl(
      preset.url.split('?')[0], // Get base URL without existing params
      `${preset.id}_${name.toLowerCase().replace(/\s+/g, '_')}_${uniqueId}`
    );

    setIsGenerating(true);
    try {
      const response = await fetch("/api/qr-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type: preset.id,
          url: trackingUrl,
          description,
          style: customStyle,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedQRCode(data.qrCodeUrl);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSelectedPresetUrl = () => {
    const preset = QR_CODE_PRESETS.find(p => p.id === selectedPreset);
    return preset?.url || '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="p-6 border rounded-lg bg-white space-y-6">
          <div className="space-y-2">
            <Label htmlFor="preset">Select Destination</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose where this QR code should lead to" />
              </SelectTrigger>
              <SelectContent>
                {QR_CODE_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">QR Code Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Instagram Profile QR"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about where and how this QR code will be used..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Style</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {STYLE_PRESETS.map((stylePreset) => (
                <button
                  key={stylePreset.id}
                  onClick={() => handleStyleChange(stylePreset.id)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedStyle === stylePreset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium mb-2">{stylePreset.name}</div>
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: stylePreset.style.darkColor }}
                  />
                </button>
              ))}
            </div>
          </div>

          {showAdvancedOptions && (
            <div className="space-y-4 border-t pt-4">
              <Label>Advanced Customization</Label>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Corner Style</Label>
                  <Select
                    value={customStyle.cornerSquareStyle}
                    onValueChange={(value: QRCodeStyle['cornerSquareStyle']) =>
                      setCustomStyle(prev => ({ ...prev, cornerSquareStyle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose corner style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="dot">Rounded</SelectItem>
                      <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Dots Style</Label>
                  <Select
                    value={customStyle.dotsStyle}
                    onValueChange={(value: QRCodeStyle['dotsStyle']) =>
                      setCustomStyle(prev => ({ ...prev, dotsStyle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose dots style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="dots">Dots</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                      <SelectItem value="classy">Classy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Colors</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="darkColor" className="text-sm">
                        QR Code Color
                      </Label>
                      <Input
                        type="color"
                        id="darkColor"
                        value={customStyle.darkColor}
                        onChange={(e) =>
                          setCustomStyle((prev) => ({
                            ...prev,
                            darkColor: e.target.value,
                          }))
                        }
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lightColor" className="text-sm">
                        Background Color
                      </Label>
                      <Input
                        type="color"
                        id="lightColor"
                        value={customStyle.lightColor}
                        onChange={(e) =>
                          setCustomStyle((prev) => ({
                            ...prev,
                            lightColor: e.target.value,
                          }))
                        }
                        className="h-10 w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedPreset || !name}
          >
            {isGenerating ? "Generating..." : "Generate QR Code"}
          </Button>
        </div>

        {/* Preview Section */}
        <div className="p-6 border rounded-lg bg-white">
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Preview</h3>
            {selectedPreset ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-lg shadow-sm border" style={{ backgroundColor: customStyle.lightColor }}>
                  <StyledQRCode
                    value={getSelectedPresetUrl()}
                    style={customStyle}
                  />
                </div>
                <div className="text-sm text-gray-500 text-center">
                  This is a preview. The final QR code may look slightly different.
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <div className="text-gray-500 text-center">
                  Select a destination to see the QR code preview
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated QR Code */}
      {generatedQRCode && (
        <div className="p-6 border rounded-lg bg-white">
          <h3 className="font-medium text-lg mb-4">Generated QR Code</h3>
          <QRCodeDisplay qrCodeUrl={generatedQRCode} />
        </div>
      )}

      {/* Saved QR Codes */}
      <SavedQRCodes />
    </div>
  );
}