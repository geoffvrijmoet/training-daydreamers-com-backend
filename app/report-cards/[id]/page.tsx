"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FormattedDescription } from "@/components/report-cards/formatted-description";

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
  createdAt: string;
}

// Helper function to get last name
function getLastName(fullName: string): string {
  const nameParts = fullName.trim().split(' ');
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
}

export default function ReportCardPage({ params }: { params: { id: string } }) {
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportCard = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/report-cards/${params.id}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch report card');
      }
      
      setReportCard(data.reportCard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchReportCard();
  }, [fetchReportCard]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading report card...</div>;
  }

  if (error || !reportCard) {
    return (
      <div className="text-center py-8 text-red-500">
        Error: {error || 'Report card not found'}
      </div>
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
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer size={16} />
          Print Report Card
        </Button>
      </div>

      <div className="border rounded-lg p-6 bg-white space-y-4 w-full max-w-2xl mx-auto font-fredoka font-light">
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
            <span className="font-medium">Date:</span> {format(new Date(reportCard.date), 'MMMM d, yyyy')}
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-medium">Summary:</p>
          <p className="whitespace-pre-wrap">{reportCard.summary}</p>
        </div>

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