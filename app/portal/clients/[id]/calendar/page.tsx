import mongoose from 'mongoose';
import ClientModel, { IClient } from "@/models/Client";
import { connectDB } from "@/lib/db";
import ClientCalendar from '@/components/ClientCalendar';

type ClientCalendarPageProps = {
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

export default async function ClientCalendarPage({ params }: ClientCalendarPageProps) {
  const client = await getClientDetails(params.id);
  
  if (!client) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-semibold text-red-500 mb-4">Client Not Found</h1>
          <p className="text-gray-600">The client you are looking for does not exist or the ID is invalid.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 font-fredoka">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Training Calendar
          </h1>
          <p className="text-gray-600">
            Welcome, {client.name}! Book {client.dogName}’s training sessions with Madeline.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <ClientCalendar clientId={params.id} clientName={client.name} dogName={client.dogName || ''} />
      </div>
    </main>
  );
} 