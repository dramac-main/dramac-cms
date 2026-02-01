import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Server, 
  Info,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDomain } from "@/lib/actions/domains";
import { DnsActions, DnsQuickTemplates, DnsRecordActions } from "./dns-actions-client";

interface DnspageProps {
  params: Promise<{ domainId: string }>;
}

export async function generateMetadata({ params }: DnspageProps): Promise<Metadata> {
  const { domainId } = await params;
  const response = await getDomain(domainId);
  
  return {
    title: response.data?.domain_name 
      ? `DNS - ${response.data.domain_name} | DRAMAC CMS`
      : 'DNS Settings | DRAMAC CMS',
  };
}

// Mock DNS records for UI testing
const MOCK_DNS_RECORDS = [
  { id: '1', type: 'A', name: '@', value: '192.0.2.1', ttl: 3600, proxied: true },
  { id: '2', type: 'A', name: 'www', value: '192.0.2.1', ttl: 3600, proxied: true },
  { id: '3', type: 'CNAME', name: 'blog', value: 'cname.dramac.app', ttl: 3600, proxied: false },
  { id: '4', type: 'MX', name: '@', value: 'mx1.titan.email', ttl: 3600, priority: 10 },
  { id: '5', type: 'MX', name: '@', value: 'mx2.titan.email', ttl: 3600, priority: 20 },
  { id: '6', type: 'TXT', name: '@', value: 'v=spf1 include:spf.titan.email ~all', ttl: 3600 },
  { id: '7', type: 'TXT', name: '_dmarc', value: 'v=DMARC1; p=none; rua=mailto:dmarc@example.com', ttl: 3600 },
];

const DNS_TYPE_COLORS: Record<string, string> = {
  'A': 'bg-blue-500/10 text-blue-600 border-blue-200',
  'AAAA': 'bg-purple-500/10 text-purple-600 border-purple-200',
  'CNAME': 'bg-green-500/10 text-green-600 border-green-200',
  'MX': 'bg-amber-500/10 text-amber-600 border-amber-200',
  'TXT': 'bg-gray-500/10 text-gray-600 border-gray-200',
  'NS': 'bg-red-500/10 text-red-600 border-red-200',
  'SRV': 'bg-pink-500/10 text-pink-600 border-pink-200',
};

async function DnsContent({ domainId }: { domainId: string }) {
  const response = await getDomain(domainId);
  
  if (!response.success || !response.data) {
    notFound();
  }
  
  const domain = response.data;
  const dnsRecords = MOCK_DNS_RECORDS;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">DNS Records</h1>
          <p className="text-muted-foreground">
            Manage DNS records for {domain.domain_name}
          </p>
        </div>
        <DnsActions domainName={domain.domain_name} />
      </div>
      
      {/* Status */}
      {domain.cloudflare_zone_id ? (
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
                <p className="font-medium">External DNS</p>
                <p className="text-sm text-muted-foreground">
                  DNS is managed externally. Some features may be limited.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Quick Templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Setup Templates</CardTitle>
          <CardDescription>
            Apply pre-configured DNS templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DnsQuickTemplates domainName={domain.domain_name} />
        </CardContent>
      </Card>
      
      {/* DNS Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Records</CardTitle>
          <CardDescription>
            {dnsRecords.length} record{dnsRecords.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-24">TTL</TableHead>
                <TableHead className="w-24">Proxied</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dnsRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={DNS_TYPE_COLORS[record.type] || 'bg-muted'}
                    >
                      {record.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {record.name === '@' ? domain.domain_name : `${record.name}.${domain.domain_name}`}
                  </TableCell>
                  <TableCell className="font-mono text-sm max-w-xs truncate">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="truncate block">
                          {record.value}
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-md">
                          <p className="font-mono text-xs break-all">{record.value}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {record.ttl === 1 ? 'Auto' : `${record.ttl}s`}
                  </TableCell>
                  <TableCell>
                    {record.proxied !== undefined && (
                      <Badge 
                        variant="outline" 
                        className={record.proxied 
                          ? 'bg-orange-500/10 text-orange-600 border-orange-200' 
                          : 'bg-muted text-muted-foreground'}
                      >
                        {record.proxied ? 'Yes' : 'No'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DnsRecordActions 
                      recordId={record.id}
                      recordType={record.type}
                      recordName={record.name}
                      domainName={domain.domain_name}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* DNS Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            DNS Propagation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            DNS changes can take up to 48 hours to propagate globally, though most 
            changes take effect within a few minutes to a few hours.
          </p>
          <p>
            If you&apos;re using Cloudflare proxy, changes to proxied records are 
            typically instant.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DnsPage({ params }: DnspageProps) {
  const { domainId } = await params;
  
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/domains/${domainId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Domain
        </Link>
      </Button>
      
      <Suspense fallback={<DnsSkeleton />}>
        <DnsContent domainId={domainId} />
      </Suspense>
    </div>
  );
}

function DnsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
