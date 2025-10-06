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
    <main className="container mx-auto px-4 py-8 font-fredoka space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 p-8 shadow-md">
        {/* Decorative blurred blob */}
        <div className="absolute -top-10 -left-10 h-40 w-40 bg-blue-200 rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-10 -right-10 h-52 w-52 bg-pink-200 rounded-full blur-3xl opacity-60" />

        <div className="relative z-10 flex flex-col items-center sm:flex-row sm:items-end sm:justify-between gap-6">
          {/* Dog photo (if exists) */}
          {client.dogPhoto?.url ? (
            <div className="h-32 w-32 sm:h-40 sm:w-40 overflow-hidden rounded-full ring-4 ring-white shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={client.dogPhoto.url} alt={client.dogName || 'Dog photo'} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-32 w-32 sm:h-40 sm:w-40 flex items-center justify-center bg-white rounded-full ring-4 ring-white text-4xl text-gray-400 shadow-md">
              🐾
            </div>
          )}

          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">
              {client.dogName ? `${client.dogName} & ` : ''}{client.name}
            </h1>
            {client.city && (
              <p className="mt-2 text-lg text-gray-600">{client.city}, {client.state}</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 text-center">
            {/* <Link href={`/portal/clients/${client._id}/calendar`} className="bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 px-4 py-2 rounded-lg font-medium shadow">
              View Calendar
            </Link> */}
            <Link href={`https://Calendly.com/madjpape`} className="bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 px-4 py-2 rounded-lg font-medium shadow">
              Book Calendly Session
            </Link>
            <Link href={`/portal/report-cards/${reportCards[0]?._id || ''}`} className="bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 px-4 py-2 rounded-lg font-medium shadow disabled:opacity-50" aria-disabled={reportCards.length === 0}>
              Latest Report Card
            </Link>
            {client.liabilityWaiver?.publicId && client.waiverSigned?.signed && (
              <a 
                href={`/api/portal/liability-waiver-url?publicId=${encodeURIComponent(client.liabilityWaiver.publicId)}&resourceType=${encodeURIComponent(client.liabilityWaiver.resourceType || 'raw')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 px-4 py-2 rounded-lg font-medium shadow"
              >
                Download Signed Waiver
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Report Cards Grid */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6">Your Report Cards</h2>

        {reportCards.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reportCards.map((card) => (
              <Link key={card._id} href={`/portal/report-cards/${card._id}`} className="group block rounded-2xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{card.date ? format(new Date(card.date), 'MMMM d, yyyy') : 'Date not set'}</span>
                  <span className="text-sm text-blue-600 group-hover:text-blue-800">View →</span>
                </div>

                {card.summary && (
                  <div 
                    className="mt-4 text-gray-700 line-clamp-4"
                    dangerouslySetInnerHTML={{ 
                      __html: card.summary.replace(/<[^>]*>/g, '') // Strip HTML tags for preview
                    }}
                  />
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed border-gray-300 bg-gray-50">
            <p className="text-xl text-gray-500">No report cards yet. Check back after your first session!</p>
          </div>
        )}
      </section>
    </main>
  );
} 