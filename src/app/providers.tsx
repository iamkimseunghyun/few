'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { TRPCReactProvider } from '@/lib/trpc';
import { ThemeProvider } from '@/modules/shared/theme/context/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <TRPCReactProvider>
          {children}
        </TRPCReactProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}