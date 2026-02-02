// src/app/(dashboard)/dashboard/domains/[domainId]/renew/page.tsx
// Domain renewal page

import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Calendar, AlertCircle, CreditCard } from "lucide-react";
import { format, addYears, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDomain } from "@/lib/actions/domains";
import { DomainRenewForm } from "./renew-form";

interface RenewPageProps {
  params: Promise<{ domainId: string }>;
}

export async function generateMetadata({ params }: RenewPageProps): Promise<Metadata> {
  const { domainId } = await params;
  const response = await getDomain(domainId);
  
  return {
    title: response.data?.domain_name 
      ? `Renew ${response.data.domain_name} | DRAMAC CMS`
      : 'Renew Domain | DRAMAC CMS',
  };
}

async function RenewContent({ domainId }: { domainId: string }) {
  const response = await getDomain(domainId);
  
  if (!response.success || !response.data) {
    notFound();
  }
  
  const domain = response.data;
  const expiryDate = domain.expiry_date ? new Date(domain.expiry_date) : null;
  const daysUntilExpiry = expiryDate ? differenceInDays(expiryDate, new Date()) : null;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Alert for expired/expiring domains */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Domain Expired</AlertTitle>
          <AlertDescription>
            This domain has expired. Renew immediately to prevent loss of the domain.
          </AlertDescription>
        </Alert>
      )}
      
      {isExpiringSoon && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">Expiring Soon</AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-300">
            This domain will expire in {daysUntilExpiry} days. Consider renewing now.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Domain Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Renew {domain.domain_name}
          </CardTitle>
          <CardDescription>
            Extend your domain registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Domain</span>
            <span className="font-medium">{domain.domain_name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Current Expiry</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {expiryDate ? format(expiryDate, 'MMM d, yyyy') : 'Unknown'}
              </span>
              {isExpired && (
                <Badge variant="destructive">Expired</Badge>
              )}
              {isExpiringSoon && (
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  {daysUntilExpiry} days
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Auto-Renew</span>
            <Badge variant={domain.auto_renew ? "default" : "secondary"}>
              {domain.auto_renew ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={domain.status === 'active' ? 'default' : 'secondary'} className="capitalize">
              {domain.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Renewal Form */}
      <DomainRenewForm domain={domain} expiryDate={expiryDate} />
    </div>
  );
}

export default async function RenewPage({ params }: RenewPageProps) {
  const { domainId } = await params;
  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/domains/${domainId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Domain
        </Link>
      </Button>
      
      <Suspense fallback={
        <div className="space-y-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      }>
        <RenewContent domainId={domainId} />
      </Suspense>
    </div>
  );
}
