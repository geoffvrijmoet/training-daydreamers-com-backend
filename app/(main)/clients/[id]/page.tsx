import { ClientDetails } from "@/components/clients/client-details";

export default function ClientPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <ClientDetails clientId={params.id} />
    </div>
  );
} 