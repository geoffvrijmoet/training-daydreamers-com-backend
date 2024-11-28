import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image
            src="/images/dog-logo-left.webp"
            alt=""
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-xl font-fredoka font-light">
            Daydreamers Dog Training
          </span>
          <Image
            src="/images/dog-logo-right.webp"
            alt=""
            width={32}
            height={32}
            className="w-8 h-8"
          />
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