import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-purple-700 mb-2">Admin Client Intake</h1>
        <p className="text-gray-600">
          Create a new client record with comprehensive information including agency details, 
          file uploads, and complete dog training intake data.
        </p>
      </div>
      <ClientForm />
    </div>
  );
} 