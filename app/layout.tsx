import { Fredoka, Quicksand } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import RouteLoadingHandler from '@/components/route-loading-handler';
// Removed: SignInButton, SignedIn, SignedOut, UserButton as they are in Header or (main)/layout
// Removed: import { Header } from "@/components/layout/header";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  weight: ['300', '500']
});

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand'
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${fredoka.variable} ${quicksand.variable}`}>
        <body>
          <RouteLoadingHandler />
          {/* <Header /> has been moved to app/(main)/layout.tsx */}
          {/* <SignedOut> block has been effectively moved as it's part of Header or was contextually for main app */}
          {/* The <main> tag here will wrap the content from nested layouts or pages */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
