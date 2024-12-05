import { Fredoka, Quicksand } from 'next/font/google';
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Header } from "@/components/layout/header";
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
          {/* <SignedIn> */}
            <Header />
          {/* </SignedIn> */}
          <SignedOut>
            <div className="flex justify-end p-4">
              <SignInButton />
            </div>
          </SignedOut>
          <main>
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
