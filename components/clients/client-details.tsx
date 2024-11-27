"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Client {
  _id: string;
  name: string;
  dogName: string;
  email: string;
  phone: string;
  notes: string;
  folders: {
    mainFolderLink: string;
    sharedFolderLink: string;
    privateFolderLink: string;
  };
  createdAt: string;
}

export function ClientDetails({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch client');
        }

        setClient(data.client);
      } catch (error) {
        console.error('Error fetching client:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchClient();
  }, [clientId]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!client) return <div>Client not found</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{client.dogName}</h1>
          <p className="text-xl text-gray-600 mt-1">{client.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/clients/${clientId}/edit`}>
            <Button>Edit Client</Button>
          </Link>
          <Link href="/clients">
            <Button variant="outline">Back to Clients</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p>{client.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <p>{client.phone}</p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Google Drive Folders</h2>
          <div className="space-y-2">
            <div>
              <a 
                href={client.folders.mainFolderLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block"
              >
                Main Folder
              </a>
            </div>
            <div>
              <a 
                href={client.folders.sharedFolderLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block"
              >
                Client Folder (Shared)
              </a>
            </div>
            <div>
              <a 
                href={client.folders.privateFolderLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block"
              >
                Private Folder
              </a>
            </div>
          </div>
        </section>

        {client.notes && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Notes</h2>
            <p className="whitespace-pre-wrap">{client.notes}</p>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Client Since</h2>
          <p>{new Date(client.createdAt).toLocaleDateString()}</p>
        </section>
      </div>
    </div>
  );
} 