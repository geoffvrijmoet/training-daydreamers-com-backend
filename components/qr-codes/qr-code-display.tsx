import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface QRCodeDisplayProps {
  qrCodeUrl: string;
}

export function QRCodeDisplay({ qrCodeUrl }: QRCodeDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      // Fetch the image as a blob
      const response = await fetch(qrCodeUrl);
      if (!response.ok) throw new Error('Failed to fetch QR code');
      
      const blob = await response.blob();
      
      // Create a filename with timestamp
      const filename = `qr-code-${Date.now()}.png`;
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Success",
        description: "QR code downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Error",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
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
          unoptimized // Add this to prevent Next.js image optimization
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