"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "./auth-provider";
import { LoadingProvider } from "./loading-provider";
import { Toaster } from "@/components/ui/sonner";
import { GlobalErrorBoundary } from "@/components/error-boundary";
import { useState } from "react";

// Re-export loading provider hooks
export {
  LoadingProvider,
  useLoading,
  useLoadingState,
  useAsyncOperation,
  useDeferredLoading,
  type LoadingProviderProps,
  type LoadingContextValue,
  type LoadingItem,
} from "./loading-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="dramac-theme">
        <AuthProvider>
          <LoadingProvider>
            <GlobalErrorBoundary>
              {children}
            </GlobalErrorBoundary>
          </LoadingProvider>
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
