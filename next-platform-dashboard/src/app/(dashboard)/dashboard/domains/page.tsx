import { Suspense } from "react";
import { Globe, PlusCircle, AlertCircle, RefreshCw, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDomains, getDomainStats } from "@/lib/actions/domains";
import { DomainListClient } from "./domain-list-client";

export const metadata = {
  title: "Domains | DRAMAC CMS",
  description: "Manage your domain portfolio - search, register, and configure domains",
};

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function DomainStats() {
  const response = await getDomainStats();
  const stats = response.data;
  
  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load stats
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active} active
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <AlertCircle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.expiringSoon}</div>
          <p className="text-xs text-muted-foreground">
            Within 30 days
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Auto-Renewal</CardTitle>
          <RefreshCw className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active}</div>
          <p className="text-xs text-muted-foreground">
            Domains protected
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Email Accounts</CardTitle>
          <Mail className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEmails}</div>
          <p className="text-xs text-muted-foreground">
            Across {stats.domainsWithEmail} domains
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function DomainListSection() {
  const response = await getDomains({ limit: 50 });
  
  if (!response.success) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Failed to load domains: {response.error}
        </CardContent>
      </Card>
    );
  }
  
  return <DomainListClient initialDomains={response.data || []} />;
}

export default function DomainsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Domains</h1>
          <p className="text-muted-foreground">
            Search, register, and manage your domain portfolio
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/domains/search">
              <PlusCircle className="h-4 w-4 mr-2" />
              Register Domain
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <DomainStats />
      </Suspense>
      
      {/* Domain List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Domains</CardTitle>
          <CardDescription>
            View and manage all your registered domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          }>
            <DomainListSection />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
