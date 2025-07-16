import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/lib/trpc";
import { headers } from "next/headers";
import { Header } from "@/modules/shared/layout/components/Header";
import { ErrorBoundary } from "@/modules/shared";
import { ThemeProvider } from "@/modules/shared/theme/context/ThemeContext";
import { ThemeScript } from "@/modules/shared/theme/scripts/theme-script";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "few - 우리의 취향과 꿀팁이 모이는 공간",
  description: "라이브 공연 및 페스티벌 참가자들이 경험을 즐기고 공유하는 커뮤니티",
  keywords: ["페스티벌", "공연", "리뷰", "커뮤니티", "음악", "경험"],
  authors: [{ name: "few team" }],
  openGraph: {
    title: "few - 우리의 취향과 꿀팁이 모이는 공간",
    description: "라이브 공연 및 페스티벌 참가자들이 경험을 즐기고 공유하는 커뮤니티",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  
  return (
    <ClerkProvider>
      <html lang="ko" className={inter.variable} suppressHydrationWarning>
        <head>
          <ThemeScript />
        </head>
        <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
          <ThemeProvider>
            <TRPCReactProvider headers={requestHeaders}>
              <ErrorBoundary>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <footer className="border-t border-border bg-muted">
                    <div className="mx-auto max-w-6xl px-6 py-12">
                      <p className="text-center text-sm text-muted-foreground">
                        © 2024 few. 우리의 취향과 꿀팁이 모이는 공간.
                      </p>
                    </div>
                  </footer>
                </div>
              </ErrorBoundary>
            </TRPCReactProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
