"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRCodeData {
  id: string;
  name: string;
  type: string;
  url: string;
  description: string;
  createdAt: Date;
  qrCodeUrl: string;
}

export function SavedQRCodes() {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      const response = await fetch("/api/qr-codes");
      const data = await response.json();
      if (data.success) {
        setQrCodes(data.qrCodes);
      }
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (qrCodeUrl: string) => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qr-code.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Saved QR Codes</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {qrCodes.map((qrCode) => (
          <div
            key={qrCode.id}
            className="border rounded-lg p-4 bg-white space-y-4"
          >
            <div className="relative w-full aspect-square">
              <Image
                src={qrCode.qrCodeUrl}
                alt={qrCode.name}
                fill
                className="object-contain"
              />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{qrCode.name}</h3>
              <p className="text-sm text-gray-500">
                Created {format(new Date(qrCode.createdAt), "PPP")}
              </p>
              {qrCode.description && (
                <p className="text-sm text-gray-600">{qrCode.description}</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleDownload(qrCode.qrCodeUrl)}
                >
                  <Download size={16} />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  asChild
                >
                  <a href={qrCode.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} />
                    Visit URL
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 