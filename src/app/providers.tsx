'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { TRPCReactProvider } from '@/lib/trpc';
import { ThemeProvider } from '@/modules/shared/theme/context/ThemeContext';
import { SentryUserContext } from '@/components/SentryUserContext';
import { ErrorBoundary } from '@/modules/shared/ui/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary showDialog>
      <ClerkProvider>
        <SentryUserContext />
        <ThemeProvider>
          <TRPCReactProvider>
            {children}
          </TRPCReactProvider>
        </ThemeProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}