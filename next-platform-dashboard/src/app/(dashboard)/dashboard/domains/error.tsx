'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

interface DomainsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DomainsError({ error, reset }: DomainsErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Domains page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Failed to Load Domains</CardTitle>
          <CardDescription>
            Something went wrong while loading your domains. This could be a 
            temporary issue with the domain registry service.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="font-mono text-xs mt-1">
              {error.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
          
          {error.digest && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
