import mongoose, { Types } from 'mongoose';
import ClientModel, { IClient } from "@/models/Client";
import ReportCardModel, { IReportCard } from "@/models/ReportCard";
import { connectDB } from "@/lib/db";
import Link from 'next/link';
import { format } from 'date-fns'; // For formatting dates if needed

type PortalClientPageProps = {
  params: {
    id: string;
  };
};

async function getClientDetails(id: string): Promise<IClient | null> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const client = await ClientModel.findById(id).lean<IClient>();
  return client ? JSON.parse(JSON.stringify(client)) : null;
}

async function getClientReportCards(clientId: string): Promise<Array<Omit<IReportCard, '_id'> & { _id: string }>> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return [];
  }
  const reportCards = await ReportCardModel.find({ clientId: new Types.ObjectId(clientId) })
    .sort({ date: -1 })
    .lean<IReportCard[]>();
  
  // Ensure _id is a string and other properties are preserved
  return reportCards.map(rc => {
    const { _id, ...rest } = JSON.parse(JSON.stringify(rc));
    return { _id: _id.toString(), ...rest }; 
  });
}

export default async function PortalClientPage({ params }: PortalClientPageProps) {
  const client = await getClientDetails(params.id);
  
  if (!client) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold text-red-500">Client Not Found</h1>
        <p>The client you are looking for does not exist or the ID is invalid.</p>
      </main>
    );
  }

  const reportCards = await getClientReportCards(params.id);

  return (
    <main className="container mx-auto p-4 font-fredoka">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Report Cards for <span className="text-blue-600">{client.name}</span>
        </h1>
        {client.dogName && <p className="text-xl text-gray-700">Dog: {client.dogName}</p>}
      </div>

      <div className="space-y-6">
        {reportCards.length > 0 ? (
          reportCards.map((card) => (
            <div key={card._id} className="p-6 border rounded-lg bg-white shadow hover:shadow-xl transition-shadow">
              <h2 className="text-2xl font-semibold mb-2">
                <Link href={`/portal/report-cards/${card._id}`} className="text-blue-500 hover:underline">
                  Session Date: {card.date ? format(new Date(card.date), 'MMMM d, yyyy') : 'Date not set'}
                </Link>
              </h2>
              {card.summary && (
                <div className="mt-2">
                  <h3 className="text-lg font-medium text-gray-800">Summary:</h3>
                  <p className="text-gray-600 whitespace-pre-wrap mt-1">{card.summary}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500">No report cards found for this client yet.</p>
          </div>
        )}
      </div>
    </main>
  );
} 