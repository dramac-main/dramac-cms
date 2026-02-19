"use client";

// src/components/clients/client-domains-list.tsx
// Domains assigned to a specific client — shown in client detail tabs

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  ExternalLink,
  Calendar,
  Shield,
  AlertTriangle,
  Loader2,
  Unlink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getClientDomains,
  assignDomainToClient,
} from "@/lib/actions/domains";

interface ClientDomainsListProps {
  clientId: string;
}

export function ClientDomainsList({ clientId }: ClientDomainsListProps) {
  const [domains, setDomains] = useState<
    Array<{
      id: string;
      domain_name: string;
      tld: string;
      status: string;
      expiry_date: string | null;
      auto_renew: boolean;
      whois_privacy: boolean;
      site_id: string | null;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDomains();
  }, [clientId]);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      const result = await getClientDomains(clientId);
      if (result.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setDomains((result.data as any[]) || []);
      }
    } catch {
      // Silently fail — empty state will show
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async (domainId: string, domainName: string) => {
    try {
      const result = await assignDomainToClient(domainId, null, null);
      if (result.success) {
        toast.success(`${domainName} unassigned from client`);
        loadDomains();
      } else {
        toast.error(result.error || "Failed to unassign domain");
      }
    } catch {
      toast.error("Failed to unassign domain");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return expiry.getTime() - now.getTime() < thirtyDays && expiry > now;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Assigned Domains ({domains.length})
        </CardTitle>
        <CardDescription>
          Domains assigned to this client. Manage assignments from the domain
          detail page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {domains.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No domains assigned</p>
            <p className="text-sm mt-1">
              Assign domains to this client from the domain detail page or the
              domain settings page.
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/dashboard/domains">View All Domains</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/domains/${domain.id}`}
                        className="font-medium text-sm hover:underline truncate"
                      >
                        {domain.domain_name}
                      </Link>
                      {getStatusBadge(domain.status)}
                      {isExpiringSoon(domain.expiry_date) && (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-300"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expiring
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {domain.expiry_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires{" "}
                          {new Date(domain.expiry_date).toLocaleDateString()}
                        </span>
                      )}
                      {domain.whois_privacy && (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Privacy
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/domains/${domain.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleUnassign(domain.id, domain.domain_name)
                    }
                    title="Unassign from client"
                  >
                    <Unlink className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
