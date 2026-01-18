"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RefreshCw, ArrowLeft, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error("App error:", error);
    
    // In production, you would send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
  }, [error]);

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
            {isNetworkError 
              ? "There was a problem connecting to the server."
              : isAuthError
                ? "There was an authentication issue."
                : "An unexpected error occurred while loading this page."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {error.message || "We're sorry for the inconvenience. Please try again."}
          </p>
          
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
          <Button onClick={reset} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild className="w-full sm:w-auto">
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
