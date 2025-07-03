'use client';
import Link from "next/link";
import Image from "next/image";
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className="border-b sticky top-0 z-40 bg-white">
      <div className="w-full max-w-full px-4 sm:px-6 h-16 flex items-center justify-between">
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
              className="object-contain [filter:brightness(0)_saturate(100%)_invert(11%)_sepia(82%)_saturate(5876%)_hue-rotate(356deg)_brightness(96%)_contrast(113%)]"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-stretch h-16">
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
            href="/calendar" 
            className="px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors h-full flex items-center"
          >
            Calendar
          </Link>
          <Link 
            href="/settings" 
            className="px-3 py-2 text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors h-full flex items-center"
          >
            Format Your Report Card
          </Link>
          <Link 
            href="/qr-codes" 
            className="px-3 py-2 text-sm font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors h-full flex items-center"
          >
            QR Codes
          </Link>
          <div className="ml-4 flex items-center">
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/sign-in" />
            </SignedIn>
          </div>
        </nav>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center">
          <button
            className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
      {/* Mobile Menu Popover */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileMenuOpen(false)}>
          <nav
            className="absolute top-0 right-0 w-64 h-full bg-white shadow-lg flex flex-col gap-2 p-6"
            onClick={e => e.stopPropagation()}
          >
            <Link href="/clients" className="py-2 px-2 rounded hover:bg-blue-50 text-blue-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Clients</Link>
            <Link href="/clients/new" className="py-2 px-2 rounded hover:bg-green-50 text-green-700 font-medium" onClick={() => setMobileMenuOpen(false)}>New Client</Link>
            <Link href="/report-cards" className="py-2 px-2 rounded hover:bg-purple-50 text-purple-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Report Cards</Link>
            <Link href="/report-cards/new" className="py-2 px-2 rounded hover:bg-pink-50 text-pink-700 font-medium" onClick={() => setMobileMenuOpen(false)}>New Report Card</Link>
            <Link href="/calendar" className="py-2 px-2 rounded hover:bg-blue-50 text-blue-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Calendar</Link>
            <Link href="/settings" className="py-2 px-2 rounded hover:bg-amber-50 text-amber-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Format Your Report Card</Link>
            <Link href="/qr-codes" className="py-2 px-2 rounded hover:bg-orange-50 text-orange-700 font-medium" onClick={() => setMobileMenuOpen(false)}>QR Codes</Link>
            <div className="mt-4 flex items-center gap-2">
              <SignedOut>
                <SignInButton />
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/sign-in" />
              </SignedIn>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
} 