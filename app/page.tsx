import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Daydreamers Admin</h1>
          <UserButton afterSignOutUrl="/"/>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/clients/new">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">New Client</h3>
                <p className="mt-1 text-sm text-gray-500">Add a new client to the system</p>
              </div>
            </div>
          </Link>

          <Link href="/report-cards/new">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">New Report Card</h3>
                <p className="mt-1 text-sm text-gray-500">Create a new training session report</p>
              </div>
            </div>
          </Link>

          <Link href="/settings">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Settings</h3>
                <p className="mt-1 text-sm text-gray-500">Manage key concepts and products</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
