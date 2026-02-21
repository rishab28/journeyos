import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import ClientShell from '@/components/ClientShell';
import { Toaster } from 'sonner';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
};

export const metadata: Metadata = {
  title: 'JourneyOS — AI-Powered UPSC/HAS Preparation',
  description:
    'The neuroscience-backed, AI-native cognitive operating system for UPSC & HAS aspirants. Master concepts with spaced repetition, adaptive feeds, and real-time rank probability tracking.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JourneyOS',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-[#0a0a0f] text-white overflow-hidden`}
      >
        <ClientShell>{children}</ClientShell>
        <Toaster theme="dark" position="bottom-center" toastOptions={{ style: { background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white' } }} />
      </body>
    </html>
  );
}

