import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Almarai, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// Body: IBM Plex Sans Arabic — 400/500/600 for running text.
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
});

// Display: Almarai — 700/800 for headlines, hero type, big numbers.
const almarai = Almarai({
  subsets: ['arabic'],
  weight: ['700', '800'],
  variable: '--font-almarai',
  display: 'swap',
});

// Monospaced numerals for tabular data (fine URLs, IDs, code).
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'درع — مستشار التأسيس والامتثال السعودي',
  description:
    'من أول فكرة مشروعك إلى مراقبة امتثالك المستمر. درع يرتّب خطواتك، يُجهّز مستنداتك، ويمنع الغرامات قبل ما تصير.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [ibmPlexArabic.variable, almarai.variable, jetbrainsMono.variable].join(' ');
  return (
    <html lang="ar" dir="rtl" className={fontVars}>
      <body className="bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
