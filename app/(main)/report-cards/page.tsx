import { ReportCardsList } from "@/components/report-cards/report-cards-list";

export default function ReportCardsPage() {
  return (
    <div className="container py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Report Cards</h1>
        <p className="text-gray-500 mt-2">
          View all training session report cards
        </p>
      </div>
      
      <ReportCardsList />
    </div>
  );
} 