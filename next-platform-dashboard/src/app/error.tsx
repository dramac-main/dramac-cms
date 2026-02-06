"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Home, RefreshCw, ArrowLeft, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Check if it's a ChunkLoadError (happens after deployments when browser has stale cache)
  const isChunkLoadError = error.name === "ChunkLoadError" || 
                           error.message.includes("ChunkLoadError") ||
                           error.message.includes("Failed to load chunk") ||
                           error.message.includes("Loading chunk");

  useEffect(() => {
    // Log the error to the console for debugging
    console.error("App error:", error);
    
    // Auto-refresh for ChunkLoadError (stale cache after deployment)
    if (isChunkLoadError) {
      // Check if we already tried refreshing to avoid infinite loops
      const refreshKey = "chunk_error_refresh";
      const lastRefresh = sessionStorage.getItem(refreshKey);
      const now = Date.now();
      
      // Only auto-refresh if we haven't tried in the last 10 seconds
      if (!lastRefresh || now - parseInt(lastRefresh) > 10000) {
        setIsAutoRefreshing(true);
        sessionStorage.setItem(refreshKey, now.toString());
        // Force a hard refresh to get new chunks
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
  }, [error, isChunkLoadError]);

  // Check if it's a known error type based on the message
  const isNetworkError = error.message.toLowerCase().includes("network") ||
                        error.message.toLowerCase().includes("fetch");
  const isAuthError = error.message.toLowerCase().includes("auth") ||
                     error.message.toLowerCase().includes("unauthorized");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Something went wrong!</CardTitle>
          <CardDescription>
            {isChunkLoadError
              ? isAutoRefreshing 
                ? "Refreshing to load the latest version..."
                : "A new version was deployed. Please refresh the page."
              : isNetworkError 
                ? "There was a problem connecting to the server."
                : isAuthError
                  ? "There was an authentication issue."
                  : "An unexpected error occurred while loading this page."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isChunkLoadError ? (
            <p className="text-sm text-muted-foreground text-center">
              {isAutoRefreshing 
                ? "Please wait while we refresh the page..."
                : "This usually happens after a new deployment. Click the button below to refresh."}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {error.message || "We're sorry for the inconvenience. Please try again."}
            </p>
          )}
          
          {process.env.NODE_ENV === "development" && error.digest && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Bug className="h-3 w-3" />
                Error Digest
              </summary>
              <code className="mt-2 block p-2 bg-muted rounded-md overflow-auto text-[10px]">
                {error.digest}
              </code>
            </details>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={isAutoRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
            {isAutoRefreshing ? 'Refreshing...' : 'Try again'}
          </Button>
          <Button asChild className="w-full sm:w-auto" disabled={isAutoRefreshing}>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Go back
        </button>
        <span>•</span>
        <Link 
          href="/support" 
          className="hover:text-foreground transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
