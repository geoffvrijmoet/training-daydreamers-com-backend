import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientList } from "@/components/clients/client-list";

export default function ClientsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link href="/clients/new">
          <Button>Add New Client</Button>
        </Link>
      </div>
      <ClientList />
    </div>
  );
} 