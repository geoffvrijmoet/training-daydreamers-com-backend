"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Link from "next/link";

interface Client {
  _id: string;
  name: string;
  dogName: string;
  email: string;
  phone: string;
}

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch clients');
        }

        setClients(data.clients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    async function performCleanup() {
      try {
        // Run cleanup in the background, don't block the UI
        const response = await fetch('/api/upload/cleanup', {
          method: 'POST',
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.details && result.details.totalFound > 0) {
            console.log('File cleanup completed:', result.message);
          }
        }
      } catch (error) {
        // Fail silently for cleanup - don't interrupt user experience
        console.warn('Background cleanup failed:', error);
      }
    }

    fetchClients();
    
    // Run cleanup in background after a short delay
    setTimeout(performCleanup, 2000);
  }, []);

  const handleDeleteClient = async (clientId: string, clientName: string, dogName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName} and ${dogName}? This action cannot be undone and will also delete all associated files.`)) {
      return;
    }

    setDeletingClientId(clientId);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete client');
      }

      // Remove client from local state
      setClients(prev => prev.filter(client => client._id !== clientId));
      
      alert(`${clientName} and ${dogName} have been successfully deleted.`);
    } catch (error) {
      console.error('Error deleting client:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete client');
    } finally {
      setDeletingClientId(null);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Dog Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client._id}>
              <TableCell>
                <Link
                  href={`/clients/${client._id}`}
                  className="text-blue-600 hover:underline"
                >
                  {client.name}
                </Link>
              </TableCell>
              <TableCell>{client.dogName}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClient(client._id, client.name, client.dogName)}
                  disabled={deletingClientId === client._id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deletingClientId === client._id ? (
                    "Deleting..."
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 