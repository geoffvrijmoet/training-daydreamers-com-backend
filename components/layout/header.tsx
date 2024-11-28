import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <div className="bg-red-500 rounded-full p-1 mr-2">
            <Image
              src="/logo.webp"
              alt="Daydreamers Dog Training"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </div>
          <span className="text-lg font-semibold">
            Daydreamers Dog Training
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link 
            href="/clients" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clients
          </Link>
          <Link 
            href="/clients/new" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            New Client
          </Link>
          <Link 
            href="/report-cards" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Report Cards
          </Link>
          <Link 
            href="/report-cards/new" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            New Report Card
          </Link>
          <Link 
            href="/settings" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
} 