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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const handleDownload = async (qrCodeUrl: string, id: string) => {
    if (downloadingId) return;
    setDownloadingId(id);

    try {
      const response = await fetch(`/api/download-qr?url=${encodeURIComponent(qrCodeUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch QR code');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${Date.now()}.png`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadingId(null);
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
                unoptimized
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
                  onClick={() => handleDownload(qrCode.qrCodeUrl, qrCode.id)}
                  disabled={downloadingId === qrCode.id}
                >
                  <Download size={16} />
                  {downloadingId === qrCode.id ? "Downloading..." : "Download"}
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