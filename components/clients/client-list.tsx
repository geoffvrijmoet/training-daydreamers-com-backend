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
import { Trash2, Loader2, Check, X, Copy as CopyIcon } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [copiedKey, setCopiedKey] = useState<string>("");

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

  const removeClientFromList = (id: string) => {
    setClients(prev => prev.filter(c => c._id !== id));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden sm:block rounded-md border">
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
                <TableCell className="font-medium">
                  <Link href={`/clients/${client._id}`} className="text-blue-600 hover:underline">
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>{client.dogName}</TableCell>
                <TableCell className="flex items-center gap-1">
                  <span>{client.email}</span>
                  <CopyButton value={client.email} idKey={`email-${client._id}`} copiedKey={copiedKey} setCopiedKey={setCopiedKey} />
                </TableCell>
                <TableCell className="flex items-center gap-1">
                  <span>{formatPhone(client.phone)}</span>
                  <CopyButton value={plainDigits(client.phone)} idKey={`phone-${client._id}`} copiedKey={copiedKey} setCopiedKey={setCopiedKey} />
                </TableCell>
                <TableCell>
                  <DeleteClientButton client={client} onDeleted={removeClientFromList} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-4">
        {clients.map((client) => (
          <div key={client._id} className="rounded-md border p-4 space-y-3">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{client.name}</p>
                <p className="text-sm text-zinc-600">{client.dogName}</p>
              </div>
              <DeleteClientButton client={client} onDeleted={removeClientFromList} />
            </div>
            <div className="text-sm space-y-1">
              <p className="flex items-center gap-1">
                <span>{client.email}</span>
                <CopyButton value={client.email} idKey={`email-${client._id}`} copiedKey={copiedKey} setCopiedKey={setCopiedKey} />
              </p>
              <p className="flex items-center gap-1">
                <span>{formatPhone(client.phone)}</span>
                <CopyButton value={plainDigits(client.phone)} idKey={`phone-${client._id}`} copiedKey={copiedKey} setCopiedKey={setCopiedKey} />
              </p>
            </div>
            <Link href={`/clients/${client._id}`} className="text-blue-600 text-sm hover:underline">
              View Details
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

interface DeleteClientButtonProps {
  client: Client;
  onDeleted: (id: string) => void;
}

function DeleteClientButton({ client, onDeleted }: DeleteClientButtonProps) {
  const [mode, setMode] = useState<'idle' | 'confirm' | 'deleting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const startDelete = () => setMode('confirm');
  const cancel = () => setMode('idle');

  const performDelete = async () => {
    setMode('deleting');
    try {
      const res = await fetch(`/api/clients/${client._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Delete failed');

      setMode('success');
      // remove from list after short delay so user sees success msg
      setTimeout(() => {
        onDeleted(client._id);
        setMode('idle');
      }, 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setErrorMsg(msg);
      setMode('error');
    }
  };

  // trigger disabled while deleting
  const isDisabled = mode === 'deleting';

  return (
    <Popover open={mode !== 'idle'} onOpenChange={(open) => { if (!open && mode === 'confirm') cancel(); }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={startDelete}
          disabled={isDisabled}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {mode === 'deleting' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === 'success' ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : mode === 'error' ? (
            <X className="w-4 h-4 text-red-600" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </PopoverTrigger>
      {mode !== 'idle' && (
        <PopoverContent className="w-56 text-sm" align="center">
          {mode === 'confirm' && (
            <div className="space-y-3">
              <p>Delete <span className="font-medium">{client.name}</span> &amp; <span className="font-medium">{client.dogName}</span>? <br/>This cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={cancel}>Cancel</Button>
                <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 !text-white" onClick={performDelete}>Delete</Button>
              </div>
            </div>
          )}
          {mode === 'deleting' && (
            <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Deleting…</div>
          )}
          {mode === 'success' && (
            <div className="flex items-center gap-2 text-green-700"><Check className="w-4 h-4"/> Deleted!</div>
          )}
          {mode === 'error' && (
            <div className="space-y-2 text-red-700">
              <p>{errorMsg}</p>
              <Button variant="ghost" size="sm" onClick={cancel}>Close</Button>
            </div>
          )}
        </PopoverContent>
      )}
    </Popover>
  );
}

// Helper to format phone for display
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 10) return raw; // fallback
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
}

function plainDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

interface CopyButtonProps {
  value: string;
  idKey: string;
  copiedKey: string;
  setCopiedKey: React.Dispatch<React.SetStateAction<string>>;
}

function CopyButton({ value, idKey, copiedKey, setCopiedKey }: CopyButtonProps) {
  const copied = copiedKey === idKey;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(idKey);
    } catch {}
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 ml-1 text-zinc-400 hover:text-blue-600 focus:outline-none"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <CopyIcon className="w-4 h-4" />}
      {copied && <span className="text-xs text-green-700">Copied!</span>}
    </button>
  );
} 