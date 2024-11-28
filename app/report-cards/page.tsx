import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface ReportCard {
  _id: ObjectId;
  clientId: string;
  clientName: string;
  dogName: string;
  date: string;
  summary: string;
  keyConcepts: string[];
  productRecommendations: string[];
  webViewLink: string;
  createdAt: Date;
}

export default async function ReportCardsPage() {
  const client = await clientPromise;
  const db = client.db('training_daydreamers');
  
  const reportCards = (await db.collection('report_cards')
    .find({})
    .sort({ createdAt: -1 })
    .toArray()) as unknown as ReportCard[];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Report Cards</h1>
        <Button asChild>
          <Link href="/report-cards/new">
            Create New Report Card
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {reportCards.map((card) => (
          <div
            key={card._id.toString()}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors relative"
          >
            <Link 
              href={`/report-cards/${card._id}`}
              className="absolute inset-0"
              aria-label={`View report card for ${card.dogName}`}
            />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h2 className="font-semibold text-lg">
                  {card.dogName} - {card.clientName}
                </h2>
                <p className="text-sm text-gray-500">
                  {new Date(card.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Created {formatDistanceToNow(new Date(card.createdAt))} ago
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="relative z-20"
                >
                  <Link href={card.webViewLink} target="_blank">
                    View in Google Docs
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-gray-600 line-clamp-2">{card.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 