import { QRCodeManager } from "@/components/qr-codes/qr-code-manager";

export default function QRCodesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">QR Code Generator</h1>
      <QRCodeManager />
    </div>
  );
} 