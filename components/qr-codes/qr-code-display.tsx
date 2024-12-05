import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QRCodeDisplayProps {
  qrCodeUrl: string;
}

export function QRCodeDisplay({ qrCodeUrl }: QRCodeDisplayProps) {
  const handleDownload = async () => {
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

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50">
      <div className="relative w-64 h-64">
        <Image
          src={qrCodeUrl}
          alt="Generated QR Code"
          fill
          className="object-contain"
        />
      </div>
      <Button onClick={handleDownload} variant="outline" className="gap-2">
        <Download size={16} />
        Download QR Code
      </Button>
    </div>
  );
} 