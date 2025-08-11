/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Pencil, Check, X as XIcon, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FormattedDescription } from "@/components/report-cards/formatted-description";
import { ReportCardPreview } from "@/components/report-cards/report-card-preview";
import { toast } from "@/components/ui/use-toast";
import { ReportCardEmail } from '@/emails/ReportCardEmail';
import clsx from 'clsx';

interface ReportCard {
  _id: string;
  clientName: string;
  dogName: string;
  date: string;
  summary: string;
  selectedItems: Array<{
    category: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  }>;
  productRecommendations: string[];
  shortTermGoals?: Array<{
    title: string;
    description: string;
  }>;
  createdAt: string;
  selectedItemGroupsRaw: any[];
  emailSentAt?: string;
  // Client-related fields for email preview
  additionalContacts?: Array<{
    name?: string;
    email?: string;
    phone?: string;
  }>;
  agencyName?: string;
}

// Helper function to get last name
function getLastName(fullName: string): string {
  const nameParts = fullName.trim().split(' ');
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
}

// Convert YYYY-MM-DD into a Date object in the browser's local timezone
function parseYMDToLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export default function ReportCardPage({ params }: { params: { id: string } }) {
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [editing, setEditing] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [groupsDraft, setGroupsDraft] = useState<any[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const fetchReportCard = useCallback(async () => {
    try {
      const response = await fetch(`/api/report-cards/${params.id}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch report card');
      }
      
      setReportCard(data.reportCard);
      setSummaryDraft(data.reportCard.summary);
      setGroupsDraft(data.reportCard.selectedItemGroupsRaw);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'An error occurred', variant: "destructive" });
    }
  }, [params.id]);

  useEffect(() => {
    fetchReportCard();
  }, [fetchReportCard]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      const res = await fetch(`/api/report-cards/${params.id}/send-email`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send');
      toast({ title: 'Email sent', description: 'Report card emailed to client.' });
      setReportCard(rc => rc ? { ...rc, emailSentAt: new Date().toISOString() } : rc);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setSendingTestEmail(true);
      const res = await fetch(`/api/report-cards/${params.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTestEmail: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send test email');
      toast({ title: 'Test email sent', description: 'Test email sent to dogtraining@daydreamersnyc.com' });
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleUpdateDescription = (category: string, itemTitle: string, newDesc: string) => {
    setGroupsDraft(prev => prev.map(group => {
      if (group.category !== category) return group;

      // Try to find matching index between selectedItems and raw group.items
      const displayGroup = reportCard?.selectedItems.find(g => g.category === category);
      if (!displayGroup) return group;

      return {
        ...group,
        items: group.items.map((it: any, idx: number) => {
          const displayItem = displayGroup.items[idx];
          if (displayItem && displayItem.title === itemTitle) {
            return { ...it, customDescription: newDesc };
          }
          return it;
        })
      };
    }));

    // Update reportCard preview immediately
    setReportCard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        selectedItems: prev.selectedItems.map(g =>
          g.category === category
            ? {
                ...g,
                items: g.items.map(it =>
                  it.title === itemTitle ? { ...it, description: newDesc } : it
                ),
              }
            : g
        ),
      } as ReportCard;
    });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/report-cards/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: reportCard?.date, summary: summaryDraft, selectedItemGroups: groupsDraft }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      toast({ title: "Report card updated" });
      setEditing(false);
      fetchReportCard();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (!reportCard) {
    return (
      <div className="text-center py-8">Loading report card...</div>
    );
  }

  const clientLastName = getLastName(reportCard.clientName);

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8 print:hidden px-4 md:px-0">
        <Link href="/report-cards">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={16} />
            <span className="hidden md:inline">Back to Report Cards</span>
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2 print:hidden">
            <Printer size={16} />
            <span className="hidden md:inline">Print</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className={clsx(
              'gap-2 print:hidden group',
              reportCard?.emailSentAt && !sendingEmail && 'bg-green-100 hover:bg-green-200 text-green-700'
            )}
          >
            {reportCard?.emailSentAt && !sendingEmail ? (
              <>
                <Check size={16} className="group-hover:hidden" />
                <Mail size={16} className="hidden group-hover:inline" />
                <span className="group-hover:hidden hidden md:inline">Sent to Client</span>
                <span className="hidden group-hover:inline md:group-hover:inline">Send Again</span>
              </>
            ) : (
              <>
                <Mail size={16} />
                <span className="hidden md:inline">{sendingEmail ? 'Sending...' : 'Send to Client'}</span>
              </>
            )}
          </Button>
          <Button variant="outline" className="gap-2 print:hidden" onClick={() => setShowEmailPreview(p=>!p)}>
            <Mail size={16} />
            <span className="hidden md:inline">{showEmailPreview ? 'Hide' : 'Show'} Email</span>
            <span className="md:hidden">{showEmailPreview ? 'Hide' : 'Preview'}</span>
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 print:hidden bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border-amber-300" 
            onClick={handleSendTestEmail}
            disabled={sendingTestEmail}
          >
            <Mail size={16} />
            <span className="hidden md:inline">{sendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
            <span className="md:hidden">{sendingTestEmail ? 'Sending...' : 'Test'}</span>
          </Button>
        </div>
      </div>

      {!showEmailPreview ? (
        <div className="relative border rounded-lg p-6 bg-white space-y-4 w-full max-w-2xl mx-auto font-fredoka font-light">
          <div className="absolute top-4 right-4 flex gap-3">
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-gray-700">
                <Pencil size={28} />
              </button>
            )}
            {editing && (
              <>
                <button onClick={handleSave} className="text-green-600 hover:text-green-800">
                  <Check size={28} />
                </button>
                <button onClick={() => { setEditing(false); setSummaryDraft(reportCard.summary); setGroupsDraft(reportCard.selectedItemGroupsRaw); }} className="text-red-600 hover:text-red-800">
                  <XIcon size={28} />
                </button>
              </>
            )}
          </div>

        <div className="flex justify-center mb-6">
          <div className="relative h-[100px] w-[400px]">
            <Image
              src="/images/report-card-training-transp-bg.png"
              alt="Daydreamers Dog Training"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <p>
            <span className="font-medium">Dog&apos;s Name:</span> {reportCard.dogName} {clientLastName}
          </p>
          <p>
            <span className="font-medium">Date:</span>{' '}
            {editing ? (
              <input
                type="date"
                className="border rounded px-2 py-1"
                value={reportCard.date}
                onChange={(e) => setReportCard(rc => rc ? { ...rc, date: e.target.value } : rc)}
              />
            ) : (
              format(parseYMDToLocalDate(reportCard.date), 'MMMM d, yyyy')
            )}
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-medium">Summary:</p>
          {editing ? (
            <textarea className="w-full border rounded p-2" rows={4} value={summaryDraft} onChange={e=>setSummaryDraft(e.target.value)} />
          ) : (
            <p className="whitespace-pre-wrap">{reportCard.summary}</p>
          )}
        </div>

        {editing ? (
          <ReportCardPreview
            date={reportCard.date}
            clientName={reportCard.clientName}
            dogName={reportCard.dogName}
            summary={summaryDraft}
            selectedItems={reportCard.selectedItems}
            productRecommendations={reportCard.productRecommendations}
            onUpdateDescription={handleUpdateDescription}
          />
        ) : (
          <>
            {reportCard.selectedItems?.map(group => (
              <div key={group.category} className="space-y-2">
                <p className="font-medium">{group.category}:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {group.items?.map((item, index) => (
                    <li key={index}>
                      <span className="font-medium">{item.title}</span>:&nbsp;
                      <FormattedDescription html={item.description} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {reportCard.productRecommendations.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">Product Recommendations:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {reportCard.productRecommendations.map((product, index) => (
                    <li key={index}>{product}</li>
                  ))}
                </ul>
              </div>
            )}

            {reportCard.shortTermGoals && reportCard.shortTermGoals.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">Short Term Goals:</p>
                <div className="space-y-4">
                  {reportCard.shortTermGoals.map((goal, index) => (
                    <div
                      key={index}
                      className="bg-[#F8FCFD] border-2 border-[#80CDDE] rounded-xl p-6"
                    >
                      <div className="font-medium">{goal.title}</div>
                      <div className="text-gray-600 mt-1">{goal.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      ) : (
        <div className="space-y-4 w-full max-w-2xl mx-auto">
          {/* Email Preview Header */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail size={24} className="text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-blue-800">Email Preview</h2>
                  <p className="text-sm text-blue-600">This is exactly how the email will appear to recipients</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600">Recipients will include:</p>
                <p className="text-xs text-blue-700 font-medium">• {reportCard.clientName}</p>
                {reportCard.additionalContacts && reportCard.additionalContacts.length > 0 && (
                  <p className="text-xs text-blue-700 font-medium">• Additional contacts</p>
                )}
                {reportCard.agencyName && (
                  <p className="text-xs text-blue-700 font-medium">• {reportCard.agencyName}</p>
                )}
                <p className="text-xs text-blue-700 font-medium">• dogtraining@daydreamersnyc.com</p>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                <span className="text-xs text-gray-600">📧 Email Content</span>
              </div>
            </div>
            <ReportCardEmail
              clientName={reportCard.clientName}
              dogName={reportCard.dogName}
              date={reportCard.date}
              summary={editing ? summaryDraft : reportCard.summary}
              selectedItemGroups={reportCard.selectedItems}
              shortTermGoals={reportCard.shortTermGoals || []}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .container { max-width: none; padding: 0; }
          .print\\:hidden { display: none; }
        }
      `}</style>
    </div>
  );
} 
