import { EditClientForm } from "@/components/clients/edit-client-form";

export default function EditClientPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Client</h1>
      <EditClientForm clientId={params.id} />
    </div>
  );
} 