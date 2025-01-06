import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FormattedDescription } from '@/components/report-cards/formatted-description';

type KeyConcept = {
  title: string;
  description: string;
  category?: string;
};

type CategoryGroup = {
  category: string;
  items: KeyConcept[];
};

export default async function ReportCardPage({ params }: { params: { id: string } }) {
  const client = await clientPromise;
  const db = client.db('training_daydreamers');
  
  const reportCard = await db.collection('report_cards').findOne({
    _id: new ObjectId(params.id)
  });

  if (!reportCard) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Report Card</h1>
          <p className="text-gray-600 mt-1">
            {reportCard.dogName} - {reportCard.clientName}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={reportCard.webViewLink} target="_blank">
            View in Google Docs
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Session Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Date</label>
              <p>{new Date(reportCard.date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Client</label>
              <p>{reportCard.clientName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Dog</label>
              <p>{reportCard.dogName}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <p className="whitespace-pre-wrap">{reportCard.summary}</p>
        </div>

        {reportCard.selectedItems?.map((group: CategoryGroup) => (
          <div key={group.category}>
            <h2 className="text-lg font-semibold mb-2">{group.category}</h2>
            <ul className="list-disc pl-5 space-y-1">
              {group.items.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>:{' '}
                  <FormattedDescription html={item.description} />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {reportCard.productRecommendations?.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Product Recommendations</h2>
            <ul className="list-disc pl-5 space-y-1">
              {reportCard.productRecommendations.map((product: string) => (
                <li key={product}>{product}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 