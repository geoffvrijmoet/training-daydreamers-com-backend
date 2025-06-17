/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Pencil, Check, X as XIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FormattedDescription } from "@/components/report-cards/formatted-description";
import { ReportCardPreview } from "@/components/report-cards/report-card-preview";
import { toast } from "@/components/ui/use-toast";

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
}

// Helper function to get last name
function getLastName(fullName: string): string {
  const nameParts = fullName.trim().split(' ');
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
}

export default function ReportCardPage({ params }: { params: { id: string } }) {
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [editing, setEditing] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [groupsDraft, setGroupsDraft] = useState<any[]>([]);

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

  const handleUpdateDescription = (category: string, itemTitle: string, newDesc: string) => {
    setGroupsDraft(prev => prev.map(g => {
      if (g.category !== category) return g;
      return {
        ...g,
        items: g.items.map((it: any) => it.itemTitle === itemTitle || it.title === itemTitle ? { ...it, customDescription: newDesc } : it)
      };
    }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/report-cards/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: summaryDraft, selectedItemGroups: groupsDraft }),
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
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Link href="/report-cards">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={16} />
            Back to Report Cards
          </Button>
        </Link>
        <Button variant="outline" onClick={handlePrint} className="gap-2 print:hidden">
          <Printer size={16} />
          Print Report Card
        </Button>
      </div>

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
              format(new Date(reportCard.date), 'MMMM d, yyyy')
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

      <style jsx global>{`
        @media print {
          .container { max-width: none; padding: 0; }
          .print\\:hidden { display: none; }
        }
      `}</style>
    </div>
  );
} 
