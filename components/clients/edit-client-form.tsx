"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Client {
  _id: string;
  name: string;
  dogName: string;
  email: string;
  phone: string;
  notes: string;
}

export function EditClientForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      dogName: formData.get("dogName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      notes: formData.get("notes"),
    };

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update client');
      }

      router.push(`/clients/${clientId}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating client:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!client) return <div>Client not found</div>;

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Client Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={client.name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dogName">Dog Name</Label>
        <Input
          id="dogName"
          name="dogName"
          required
          defaultValue={client.dogName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={client.email}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          defaultValue={client.phone}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          className="h-32"
          defaultValue={client.notes}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/clients/${clientId}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
} 