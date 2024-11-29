import { Fredoka, Quicksand } from 'next/font/google';
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
    <html lang="en" className={`${fredoka.variable} ${quicksand.variable}`}>
      <body>
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
