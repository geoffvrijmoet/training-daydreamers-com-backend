import mongoose from 'mongoose';
import ReportCardModel, { IReportCard } from "@/models/ReportCard";
import { connectDB } from "@/lib/db"; // Assuming a DB connection utility
import { format } from "date-fns";
import Image from "next/image";
import { FormattedDescription } from "@/components/report-cards/formatted-description"; // Adjust path as needed

// Helper function to get last name (can be moved to a utility file if used elsewhere)
function getLastName(fullName: string): string {
  if (!fullName) return '';
  const nameParts = fullName.trim().split(' ');
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
}

type PortalReportCardPageProps = {
  params: {
    id: string;
  };
};

async function getReportCard(id: string): Promise<IReportCard | null> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null; // Or throw an error
  }
  const reportCard = await ReportCardModel.findById(id).lean<IReportCard>();
  return reportCard ? JSON.parse(JSON.stringify(reportCard)) : null; // Ensure plain object for Server Component
}

export default async function PortalReportCardPage({ params }: PortalReportCardPageProps) {
  const reportCard = await getReportCard(params.id);

  if (!reportCard) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold text-red-500">Report Card Not Found</h1>
        <p>The report card you are looking for does not exist or the ID is invalid.</p>
      </main>
    );
  }

  const clientLastName = getLastName(reportCard.clientName || '');

  return (
    <main className="container mx-auto p-4 font-fredoka">
      {/* Adapting structure from app/report-cards/[id]/page.tsx */}
      <div className="border rounded-lg p-6 bg-white space-y-4 w-full max-w-2xl mx-auto font-light">
        <div className="flex justify-center mb-6">
          <div className="relative h-[100px] w-[400px]">
            <Image
              src="/images/report-card-training-transp-bg.png" // Ensure this image is in public/images
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
          {reportCard.date && (
            <p>
              <span className="font-medium">Date:</span> {format(new Date(reportCard.date), 'MMMM d, yyyy')}
            </p>
          )}
        </div>

        {reportCard.summary && (
          <div className="space-y-2">
            <p className="font-medium">Summary:</p>
            <p className="whitespace-pre-wrap">{reportCard.summary}</p>
          </div>
        )}

        {/* Assuming reportCard.selectedItems matches the structure from the admin page */}
        {/* If selectedItems is not part of IReportCard, this needs adjustment or data transformation */}
        {/* For now, let's assume keyConcepts from IReportCard is what we want to display similarly */}
        {reportCard.keyConcepts && reportCard.keyConcepts.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">Key Concepts:</p>
            <ul className="list-disc pl-5 space-y-1">
              {reportCard.keyConcepts.map((concept, index) => (
                <li key={index}>{concept}</li> // Simplified: admin page had title/description objects
              ))}
            </ul>
          </div>
        )}

        {reportCard.productRecommendations && reportCard.productRecommendations.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">Product Recommendations:</p>
            <ul className="list-disc pl-5 space-y-1">
              {reportCard.productRecommendations.map((product, index) => (
                // Assuming productRecommendations in IReportCard are objects with a title property.
                <li key={product.id || index}>{product.title}</li> 
              ))}
            </ul>
          </div>
        )}

        {/* Short Term Goals are not in the current IReportCard interface */}
        {/* If they need to be displayed, the model and interface should be updated */}

      </div>
    </main>
  );
} 