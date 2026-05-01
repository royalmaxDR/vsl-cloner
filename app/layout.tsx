import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VSL Cloner — Clone e Replique Funis VSL',
  description: 'Extraia, personalize e publique funis VSL com um clique. Suporte a ConvertAI, VTurb e SmartPlayer.',
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-sans antialiased"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
