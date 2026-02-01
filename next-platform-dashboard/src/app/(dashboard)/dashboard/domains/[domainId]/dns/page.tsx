import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  RefreshCw,
  Shield,
  Server,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getDomain } from "@/lib/actions/domains";
import { listDnsRecords, checkZoneActivation } from "@/lib/actions/dns";
import { DnsRecordsTable } from "@/components/domains/dns/dns-records-table";
import { DnsRecordForm } from "@/components/domains/dns/dns-record-form";
import { DnsTemplatesDropdown } from "@/components/domains/dns/dns-templates-dropdown";
import { DnsNameservers } from "@/components/domains/dns/dns-nameservers";
import { DnsPropagationChecker } from "@/components/domains/dns/dns-propagation-checker";
import { DnsSyncButton } from "./dns-sync-button";

interface DnsPageProps {
  params: Promise<{ domainId: string }>;
}

export async function generateMetadata({ params }: DnsPageProps): Promise<Metadata> {
  const { domainId } = await params;
  const response = await getDomain(domainId);
  
  return {
    title: response.data?.domain_name 
      ? `DNS - ${response.data.domain_name} | DRAMAC CMS`
      : 'DNS Settings | DRAMAC CMS',
  };
}

async function DnsRecordsSection({ domainId, domainName }: { domainId: string; domainName: string }) {
  const result = await listDnsRecords(domainId);
  
  if (!result.success || !result.data) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {result.error || "Failed to load DNS records. DNS zone may not be configured."}
      </div>
    );
  }

  return (
    <DnsRecordsTable 
      records={result.data} 
      domainId={domainId}
      domainName={domainName}
    />
  );
}

async function NameserversSection({ domainId, nameservers }: { domainId: string; nameservers: string[] }) {
  // Check zone activation status
  const activationResult = await checkZoneActivation(domainId);
  
  if (!activationResult.success) {
    // Zone not configured - don't show nameservers section
    return null;
  }

  const expected = activationResult.data?.nameservers || [];
  const configured = activationResult.data?.activated || false;

  return (
    <DnsNameservers 
      current={nameservers}
      expected={expected}
      configured={configured}
    />
  );
}

export default async function DnsPage({ params }: DnsPageProps) {
  const { domainId } = await params;
  
  // Get domain details
  const response = await getDomain(domainId);
  
  if (!response.success || !response.data) {
    notFound();
  }
  
  const domain = response.data;
  const hasCloudflareZone = !!domain.cloudflare_zone_id;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/domains/${domainId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Domain
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">DNS Records</h1>
          <p className="text-muted-foreground">
            Manage DNS records for {domain.domain_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DnsSyncButton domainId={domainId} />
          <DnsTemplatesDropdown domainId={domainId} />
          <DnsRecordForm 
            domainId={domainId} 
            domainName={domain.domain_name}
          />
        </div>
      </div>

      {/* Cloudflare Status */}
      {hasCloudflareZone ? (
        <Card className="border-orange-200 bg-orange-500/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Managed by Cloudflare</p>
                  <p className="text-sm text-muted-foreground">
                    DNS is proxied through Cloudflare for security and performance
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Server className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">DNS Zone Not Configured</p>
                <p className="text-sm text-muted-foreground">
                  Set up a Cloudflare DNS zone to manage records. Use &quot;Quick Setup&quot; to get started.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nameservers Section */}
      {hasCloudflareZone && (
        <Suspense fallback={<Skeleton className="h-32" />}>
          <NameserversSection 
            domainId={domainId} 
            nameservers={domain.nameservers || []} 
          />
        </Suspense>
      )}

      {/* DNS Records Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>DNS Records</CardTitle>
            <CardDescription>
              Manage A, AAAA, CNAME, MX, TXT, and other DNS records
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <DnsRecordsSection domainId={domainId} domainName={domain.domain_name} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Propagation Checker */}
      {hasCloudflareZone && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Propagation</CardTitle>
            <CardDescription>
              Check if your DNS changes have propagated across global DNS servers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DnsPropagationChecker domainId={domainId} domainName={domain.domain_name} />
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            DNS Help
          </CardTitle>
          <CardDescription>Common DNS configurations and troubleshooting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Common Record Types</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><strong>A</strong> - Points domain to IPv4 address</li>
                <li><strong>AAAA</strong> - Points domain to IPv6 address</li>
                <li><strong>CNAME</strong> - Alias to another domain</li>
                <li><strong>MX</strong> - Mail server routing</li>
                <li><strong>TXT</strong> - Text records (SPF, DKIM, verification)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quick Links</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <a 
                    href="https://developers.cloudflare.com/dns/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Cloudflare DNS Documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://dnschecker.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    DNS Checker Tool
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> DNS changes can take up to 48 hours to propagate globally, 
                  though most changes take effect within a few minutes. Cloudflare-proxied records 
                  update instantly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
