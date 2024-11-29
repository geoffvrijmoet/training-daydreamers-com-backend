import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="hidden sm:block h-12 relative aspect-[4/1] w-[300px]">
            <Image
              src="/images/daydreamers-dog-training-logo.webp"
              alt="Daydreamers Dog Training"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="sm:hidden h-10 relative aspect-square w-10">
            <Image
              src="/images/dog-logo-right.webp"
              alt="Daydreamers Dog Training"
              fill
              className="object-contain [filter:sepia(100%)_saturate(2000%)_hue-rotate(320deg)]"
              priority
            />
          </div>
        </Link>

        <nav className="flex items-stretch h-16">
          <Link 
            href="/clients" 
            className="px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors h-full flex items-center"
          >
            Clients
          </Link>
          <Link 
            href="/clients/new" 
            className="px-3 py-2 text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors h-full flex items-center"
          >
            New Client
          </Link>
          <Link 
            href="/report-cards" 
            className="px-3 py-2 text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors h-full flex items-center"
          >
            Report Cards
          </Link>
          <Link 
            href="/report-cards/new" 
            className="px-3 py-2 text-sm font-medium bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors h-full flex items-center"
          >
            New Report Card
          </Link>
          <Link 
            href="/settings" 
            className="px-3 py-2 text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors h-full flex items-center"
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
} 