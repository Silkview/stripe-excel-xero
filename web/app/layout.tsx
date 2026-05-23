import type { Metadata } from 'next';
import { Figtree, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Silkview Connect — Stripe to Xero, inside Excel',
  description:
    'Pull Stripe balance transactions into Excel, build Xero journals, and push to your ledger.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
