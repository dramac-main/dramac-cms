import { Suspense } from "react";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Globe, 
  Calendar, 
  RefreshCw, 
  Shield, 
  Lock,
  ExternalLink,
  Mail,
  Settings,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getDomain } from "@/lib/actions/domains";
import { DomainSettingsClient } from "./domain-settings-client";

interface DomainDetailPageProps {
  params: Promise<{ domainId: string }>;
}

export async function generateMetadata({ params }: DomainDetailPageProps) {
  const { domainId } = await params;
  const response = await getDomain(domainId);
  
  return {
    title: response.data?.domain_name 
      ? `${response.data.domain_name} | Domains | DRAMAC CMS`
      : 'Domain Details | DRAMAC CMS',
  };
}

async function DomainDetails({ domainId }: { domainId: string }) {
  const response = await getDomain(domainId);
  
  if (!response.success || !response.data) {
    notFound();
  }
  
  const domain = response.data;
  
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'expired': return 'destructive';
      default: return 'outline';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{domain.domain_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusVariant(domain.status)} className="capitalize">
                {domain.status}
              </Badge>
              {domain.auto_renew && (
                <Badge variant="outline" className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Auto-Renew
                </Badge>
              )}
              {domain.whois_privacy && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Privacy
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/domains/${domain.id}/dns`}>
              <Settings className="h-4 w-4 mr-2" />
              DNS
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/domains/${domain.id}/email`}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {domain.registration_date 
                ? format(new Date(domain.registration_date), 'MMM d, yyyy')
                : 'Unknown'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiry Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {domain.expiry_date 
                ? format(new Date(domain.expiry_date), 'MMM d, yyyy')
                : 'Unknown'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nameservers</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {domain.nameservers?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">configured</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DNS Status</CardTitle>
            {domain.dns_configured ? (
              <div className="h-2 w-2 rounded-full bg-green-500" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {domain.dns_configured ? 'Configured' : 'Pending'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Domain Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Domain Information</CardTitle>
            <CardDescription>
              Technical details and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Domain Name</span>
                <p className="font-medium">{domain.domain_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">TLD</span>
                <p className="font-medium">{domain.tld}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Transfer Lock</span>
                <p className="font-medium flex items-center gap-1">
                  {domain.transfer_lock ? (
                    <>
                      <Lock className="h-3 w-3 text-green-500" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 text-muted-foreground" />
                      Disabled
                    </>
                  )}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Cloudflare Zone</span>
                <p className="font-medium">
                  {domain.cloudflare_zone_id ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <span className="text-sm text-muted-foreground">Nameservers</span>
              <div className="mt-2 space-y-1">
                {domain.nameservers?.length ? (
                  domain.nameservers.map((ns, i) => (
                    <p key={i} className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {ns}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No nameservers configured</p>
                )}
              </div>
            </div>
            
            {domain.site && (
              <>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">Connected Site</span>
                  <div className="mt-2">
                    <Link 
                      href={`/dashboard/${domain.site.id}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {domain.site.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Settings */}
        <DomainSettingsClient domain={domain} />
      </div>
    </div>
  );
}

export default async function DomainDetailPage({ params }: DomainDetailPageProps) {
  const { domainId } = await params;
  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/domains">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Domains
        </Link>
      </Button>
      
      <Suspense fallback={
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-32 mt-2" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      }>
        <DomainDetails domainId={domainId} />
      </Suspense>
    </div>
  );
}
