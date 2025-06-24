"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Copy as CopyIcon, Check, FileText, Image, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PackageInfo { totalSessions?: number; sessionsUsed?: number; packagePrice?: number; }
interface ClientMobile {
  _id: string;
  name: string;
  dogName: string;
  email: string;
  phone: string;
  notes?: string;
  dogPhoto?: { url?: string };
  // address
  addressLine1?: string; addressLine2?: string; city?: string; state?: string; addressZipCode?: string;
  // emergency
  emergencyContact?: { name?: string; phone?: string; relationship?: string };
  // business
  clientSource?: string;
  sessionRate?: number; packageInfo?: PackageInfo; agency?: { agencyId?: string; revenueSharePercentage?: number; agencyHandlesTax?: boolean; name?: string };
  // dog info
  dogBreed?: string; dogWeight?: number; dogSpayedNeutered?: boolean; behaviorConcerns?: string[];
  // files
  vaccinationRecords?: Array<{ name:string; url:string }>;
  liabilityWaiver?: { url?: string; name?: string };
  dogBirthdate?: string;
  previousTraining?: boolean;
  dogInfo?: { behaviorConcerns?: string[] };
}

interface SessionSummary { _id:string; calendarTimeslot:{ startTime:string; endTime:string }; status:string; }

export function ClientDetailsMobile({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<ClientMobile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string>("");
  const [sessions,setSessions]=useState<SessionSummary[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        const data = await res.json();
        if (data.success) setClient(data.client);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  useEffect(() => {
    (async () => {
      try {
        const sr=await fetch(`/api/clients/${clientId}/sessions`);
        const d=await sr.json();
        if(d.success) setSessions(d.sessions||[]);
      }catch{}
    })();
  }, [clientId]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>;
  if (!client) return <div className="text-center py-10 text-red-600">Client not found</div>;

  const copy = (val: string, idKey: string) => async () => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedKey(idKey);
    } catch {}
  };

  const copied = (key:string)=> copiedKey===key;

  const formatPhone = (raw:string)=>{const d=plainDigits(raw);return d.length===10?`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`:raw};

  const formatDate=(ds:string)=>{const d=new Date(ds);return isNaN(d.getTime())?ds:d.toLocaleDateString();};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {client.dogPhoto?.url && (
          <img src={client.dogPhoto.url} alt={client.dogName} className="w-20 h-20 rounded-md object-cover"/>
        )}
        <div>
          <h2 className="text-xl font-bold">{client.dogName}</h2>
          <p className="text-sm text-zinc-600">Owner: {client.name}</p>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-2 text-sm border rounded-md p-4">
        <h3 className="font-medium mb-2">Contact</h3>
        <div className="flex items-center gap-1">
          <span>{client.email}</span>
          <button onClick={copy(client.email, 'email')} className="text-zinc-400 hover:text-blue-600 flex items-center gap-0.5" aria-label="Copy email">
            {copied('email') ? <><Check className="w-4 h-4 text-green-600"/><span className="text-green-700 text-xs">Copied!</span></> : <CopyIcon className="w-4 h-4"/>}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span>{formatPhone(client.phone)}</span>
          <button onClick={copy(plainDigits(client.phone), 'phone')} className="text-zinc-400 hover:text-blue-600 flex items-center gap-0.5" aria-label="Copy phone">
            {copied('phone') ? <><Check className="w-4 h-4 text-green-600"/><span className="text-green-700 text-xs">Copied!</span></> : <CopyIcon className="w-4 h-4"/>}
          </button>
        </div>
      </div>

      {/* Address / Emergency */}
      {(client.addressLine1 || client.emergencyContact) && (
        <div className="space-y-2 text-sm border rounded-md p-4">
          {client.addressLine1 && (
            <div>
              <h3 className="font-medium mb-1">Address</h3>
              <p>{client.addressLine1}{client.addressLine2 && `, ${client.addressLine2}`}</p>
              <p>{client.city}, {client.state} {client.addressZipCode}</p>
            </div>
          )}
          {client.emergencyContact && (
            <div>
              <h3 className="font-medium mb-1 mt-2">Emergency Contact</h3>
              <p>{client.emergencyContact.name} ({client.emergencyContact.relationship})</p>
              <p>{formatPhone(client.emergencyContact.phone||"")}</p>
            </div>
          )}
        </div>
      )}

      {/* Business Info */}
      {(client.clientSource || client.sessionRate || client.packageInfo || client.agency) && (
        <div className="space-y-2 text-sm border rounded-md p-4">
          <h3 className="font-medium mb-2">Business</h3>
          {client.clientSource && <p>Source: {client.clientSource}</p>}
          {client.sessionRate && <p>Session Rate: ${client.sessionRate.toFixed(2)}</p>}
          {client.packageInfo && client.packageInfo.totalSessions && (
            <p>Package: {client.packageInfo.sessionsUsed ?? 0}/{client.packageInfo.totalSessions} sessions used (${client.packageInfo.packagePrice?.toFixed(2) || 'N/A'})</p>
          )}
          {client.agency?.name && (
            <p>Agency: {client.agency.name} ({client.agency.revenueSharePercentage || 0}% share)</p>
          )}
        </div>
      )}

      {/* Dog Info */}
      <div className="space-y-2 text-sm border rounded-md p-4">
        <h3 className="font-medium mb-2">Dog Info</h3>
        {client.dogBirthdate && <p>Birthdate: {formatDate(client.dogBirthdate)}</p>}
        {client.dogBreed && <p>Breed: {client.dogBreed}</p>}
        {client.dogWeight && <p>Weight: {client.dogWeight} lbs</p>}
        {client.dogSpayedNeutered!==undefined && <p className="mt-1">Spayed/Neutered: {client.dogSpayedNeutered? 'Yes':'No'}</p>}
        { (client.dogInfo?.behaviorConcerns?.length || client.behaviorConcerns?.length) ? (
           <p>Concerns: {(client.dogInfo?.behaviorConcerns || client.behaviorConcerns)?.join(', ')}</p>
         ) : (
           <p>No behaviour concerns recorded.</p>
         )}
        {client.dogSpayedNeutered!==undefined && <p className="mt-1">Spayed/Neutered: {client.dogSpayedNeutered? 'Yes':'No'}</p>}
        {client.previousTraining!==undefined && <p className="mt-1">Previous Training: {client.previousTraining? 'Yes':'No'}</p>}
      </div>

      {/* Training Sessions */}
      <div className="space-y-2 text-sm border rounded-md p-4">
        <h3 className="font-medium mb-2">Training Sessions</h3>
        {sessions.length===0 && <p>No sessions yet.</p>}
        {sessions.map(s=> (
          <div key={s._id} className="flex justify-between border-b last:border-b-0 py-1">
            <span>{new Date(s.calendarTimeslot.startTime).toLocaleDateString()} {new Date(s.calendarTimeslot.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            <span className="capitalize">{s.status.replace(/_/g,' ')}</span>
          </div>
        ))}
      </div>

      {/* Files */}
      {(client.vaccinationRecords || client.liabilityWaiver) && (
        <div className="space-y-2 text-sm border rounded-md p-4">
          <h3 className="font-medium mb-2">Files</h3>
          {client.dogPhoto?.url && (
            <Link href={client.dogPhoto.url} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline"><Image className="w-4 h-4"/> Dog Photo</Link>
          )}
          {client.vaccinationRecords?.map((v,i)=>(
            <Link key={i} href={v.url} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline"><FileText className="w-4 h-4"/> {v.name||`Vaccination ${i+1}`}</Link>
          ))}
          {client.liabilityWaiver?.url && (
            <Link href={client.liabilityWaiver.url} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline"><FileText className="w-4 h-4"/> Liability Waiver</Link>
          )}
        </div>
      )}

      <Link href={`/portal/clients/${client._id}`} className="block text-center bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-md">View in Portal</Link>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href="/clients"
          className="flex-1 flex items-center justify-center gap-1 rounded-md bg-blue-100 hover:bg-blue-200 py-2 text-sm font-medium text-blue-700 active:scale-[.97] transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <Link
          href={`/clients/${client._id}/edit`}
          className="flex-1 flex items-center justify-center gap-1 rounded-md bg-purple-100 hover:bg-purple-200 py-2 text-sm font-medium text-purple-700 active:scale-[.97] transition-all"
        >
          <Pencil className="w-4 h-4" /> Edit
        </Link>
        <button
          onClick={async () => {
            if (!confirm('Delete this client? This cannot be undone.')) return;
            try {
              const res = await fetch(`/api/clients/${client._id}`, { method: 'DELETE' });
              const d = await res.json();
              if (d.success) {
                router.push('/clients');
              }
            } catch {}
          }}
          className="flex-1 flex items-center justify-center gap-1 rounded-md bg-rose-100 hover:bg-rose-200 py-2 text-sm font-medium text-rose-700 active:scale-[.97] transition-all"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </div>
  );
}

// helpers
function plainDigits(raw: string): string { return raw.replace(/\D/g, ""); }
function formatPhone(raw: string): string {
  const d = plainDigits(raw);
  if (d.length!==10) return raw;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
} 