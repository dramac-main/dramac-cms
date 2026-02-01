'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

interface DomainDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DomainDetailError({ error, reset }: DomainDetailErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Domain detail page error:', error);
  }, [error]);

  const isNotFound = error.message.toLowerCase().includes('not found');

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-4 ${
            isNotFound ? 'bg-muted' : 'bg-destructive/10'
          }`}>
            {isNotFound ? (
              <Globe className="h-6 w-6 text-muted-foreground" />
            ) : (
              <AlertCircle className="h-6 w-6 text-destructive" />
            )}
          </div>
          <CardTitle className="text-xl">
            {isNotFound ? 'Domain Not Found' : 'Failed to Load Domain'}
          </CardTitle>
          <CardDescription>
            {isNotFound 
              ? 'The domain you\'re looking for doesn\'t exist or has been removed.'
              : 'Something went wrong while loading domain details. This could be a temporary issue with the registry service.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isNotFound && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="font-mono text-xs mt-1">
                {error.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>
          )}
          
          {error.digest && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/domains">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Domains
            </Link>
          </Button>
          {!isNotFound && (
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
