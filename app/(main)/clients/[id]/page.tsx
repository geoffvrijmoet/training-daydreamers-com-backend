import { ClientDetails } from "@/components/clients/client-details";
import dynamic from "next/dynamic";

const ClientDetailsMobile = dynamic(() => import("@/components/clients/client-details-mobile").then(m=>m.ClientDetailsMobile), { ssr: false });

export default function ClientPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      {/* Desktop / tablet view */}
      <div className="hidden sm:block">
        <ClientDetails clientId={params.id} />
      </div>
      {/* Mobile view */}
      <div className="sm:hidden">
        <ClientDetailsMobile clientId={params.id} />
      </div>
    </div>
  );
} 