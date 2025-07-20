import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/modules/shared/layout/components/Header';
import { ErrorBoundary } from '@/modules/shared';
import { ThemeScript } from '@/modules/shared/theme/scripts/theme-script';
import { MobileNav } from '@/modules/shared/navigation/components/MobileNav';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import { Analytics } from '@/components/Analytics';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { WebVitals } from './web-vitals';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'few - 우리의 취향과 꿀팁이 모이는 공간',
  description:
    '라이브 공연 및 페스티벌 참가자들이 경험을 즐기고 공유하는 커뮤니티',
  keywords: ['페스티벌', '공연', '리뷰', '커뮤니티', '음악', '경험'],
  authors: [{ name: 'few team' }],
  openGraph: {
    title: 'few - 우리의 취향과 꿀팁이 모이는 공간',
    description:
      '라이브 공연 및 페스티벌 참가자들이 경험을 즐기고 공유하는 커뮤니티',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'few',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        <Providers>
          <ErrorBoundary>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 pb-16 lg:pb-0">{children}</main>
              <footer className="hidden border-t border-border bg-background lg:block">
                <div className="mx-auto max-w-6xl px-6 py-8">
                  <p className="text-center text-sm text-muted-foreground">
                    © 2024 few. 우리의 취향과 꿀팁이 모이는 공간.
                  </p>
                </div>
              </footer>
              <MobileNav />
            </div>
            {modal}
            <Toaster 
              position="top-center"
              expand={false}
              richColors
              closeButton
              theme="system"
            />
          </ErrorBoundary>
          <Analytics />
          <GoogleAnalytics />
          <WebVitals />
        </Providers>
      </body>
    </html>
  );
}
