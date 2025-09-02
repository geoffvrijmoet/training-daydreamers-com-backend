"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import Link from "next/link";

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

interface ReportCardsListProps {
  clientId?: string;
}

// Convert YYYY-MM-DD into a Date object in the browser's local timezone
function parseYMDToLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Use noon to safeguard against DST edge cases
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function ReportCardsList({ clientId }: ReportCardsListProps) {
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportCards = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = new URL('/api/report-cards', window.location.origin);
      if (clientId) {
        url.searchParams.set('clientId', clientId);
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch report cards');
      }
      
      setReportCards(data.reportCards);
    } catch (err) {
      console.error('Error fetching report cards:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchReportCards();
  }, [fetchReportCards]);

  if (isLoading) {
    return <div className="text-center py-8">Loading report cards...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error: {error}
      </div>
    );
  }

  if (reportCards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No report cards found.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4">
      {reportCards.map((reportCard) => (
        <Link href={`/report-cards/${reportCard._id}`} className="block" key={reportCard._id}>
          <Card className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-semibold">{reportCard.dogName}</div>
                  <div className="text-sm text-gray-500">{reportCard.clientName}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {format(parseYMDToLocalDate(reportCard.date), 'MMM d, yyyy')}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div>
                  <div className="font-medium mb-1">Summary</div>
                  <div 
                    className="text-sm text-gray-600 line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: (reportCard.summary || '').replace(/<[^>]*>/g, '') // Strip HTML tags for preview
                    }}
                  />
                </div>
                <div>
                  <div className="font-medium mb-1">Key Points</div>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {reportCard.selectedItems?.slice(0, 3).map((category) => (
                      <li key={category.category} className="line-clamp-1">
                        {category.category}
                      </li>
                    ))}
                    {reportCard.selectedItems?.length > 3 && (
                      <li className="text-gray-400">
                        +{reportCard.selectedItems.length - 3} more categories
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
            <div className="p-4 mt-auto text-sm text-blue-600 flex items-center gap-1"><Eye size={14}/> View details</div>
          </Card>
        </Link>
      ))}
    </div>
  );
} 