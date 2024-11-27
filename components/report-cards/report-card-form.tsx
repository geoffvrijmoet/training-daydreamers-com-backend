"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  _id: string;
  name: string;
  dogName: string;
  folders: {
    mainFolderId: string;
  };
}

const KEY_CONCEPTS = [
  "Loose Leash Walking",
  "Recall",
  "Place Command",
  "Sit/Stay",
  "Down/Stay",
  "Leave It",
  "Drop It",
  "Heel",
  "Focus/Watch Me",
  "Door Manners",
];

const PRODUCT_RECOMMENDATIONS = [
  "Freedom Harness",
  "Gentle Leader",
  "Long Line",
  "Treat Pouch",
  "Clicker",
  "Kong",
  "Snuffle Mat",
  "Licki Mat",
];

export function ReportCardForm() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedKeyConcepts, setSelectedKeyConcepts] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    async function fetchClients() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/clients', {
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch clients');
        }

        setClients(data.clients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying... Attempt ${retryCount} of ${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await fetchClients();
        } else {
          setError(error instanceof Error ? error.message : 'An error occurred loading clients');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchClients();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const client = clients.find(c => c._id === selectedClient);
    if (!client) {
      setError('Please select a client');
      setIsSaving(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const data = {
      clientId: selectedClient,
      date: formData.get("date"),
      summary: formData.get("summary"),
      keyConcepts: selectedKeyConcepts,
      productRecommendations: selectedProducts,
      clientName: client.name,
      dogName: client.dogName,
      mainFolderId: client.folders.mainFolderId,
    };

    try {
      const response = await fetch('/api/report-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create report card');
      }

      router.push(`/clients/${selectedClient}`);
    } catch (error) {
      console.error('Error creating report card:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="client">Client</Label>
        <Select
          value={selectedClient}
          onValueChange={setSelectedClient}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client._id} value={client._id}>
                {client.dogName} - {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Session Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Session Summary</Label>
        <Textarea
          id="summary"
          name="summary"
          required
          className="h-32"
          placeholder="Describe what was covered in the session..."
        />
      </div>

      <div className="space-y-2">
        <Label>Key Concepts Covered</Label>
        <div className="flex flex-wrap gap-2">
          {KEY_CONCEPTS.map((concept) => (
            <Button
              key={concept}
              type="button"
              variant={selectedKeyConcepts.includes(concept) ? "default" : "outline"}
              onClick={() => {
                setSelectedKeyConcepts(prev =>
                  prev.includes(concept)
                    ? prev.filter(c => c !== concept)
                    : [...prev, concept]
                );
              }}
            >
              {concept}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Product Recommendations</Label>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_RECOMMENDATIONS.map((product) => (
            <Button
              key={product}
              type="button"
              variant={selectedProducts.includes(product) ? "default" : "outline"}
              onClick={() => {
                setSelectedProducts(prev =>
                  prev.includes(product)
                    ? prev.filter(p => p !== product)
                    : [...prev, product]
                );
              }}
            >
              {product}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSaving || !selectedClient}>
          {isSaving ? "Creating..." : "Create Report Card"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
} 