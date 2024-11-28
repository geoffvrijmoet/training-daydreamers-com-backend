import { Fredoka, Quicksand } from 'next/font/google';
import { Header } from "@/components/layout/header";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-fredoka',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-quicksand',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fredoka.variable} ${quicksand.variable}`}>
      <body className="font-quicksand">
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
