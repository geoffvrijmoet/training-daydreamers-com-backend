import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

interface QRCodeDisplayProps {
  qrCodeUrl: string;
}

export function QRCodeDisplay({ qrCodeUrl }: QRCodeDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    
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
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-64 h-64 bg-[url('/images/transparency-grid.png')]">
        <Image
          src={qrCodeUrl}
          alt="Generated QR Code"
          fill
          className="object-contain"
          unoptimized
        />
      </div>
      <Button 
        onClick={handleDownload} 
        variant="outline" 
        className="gap-2"
        disabled={isDownloading}
      >
        <Download size={16} />
        {isDownloading ? "Downloading..." : "Download PNG"}
      </Button>
    </div>
  );
} 