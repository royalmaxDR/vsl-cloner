import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'HomeOffice Pro | Next Enterprise',
  description: 'Plataforma Enterprise para Home Office e Collab de Marcas',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HomeOffice Pro',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
