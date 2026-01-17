"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  setCustomDomain,
  removeCustomDomain,
  getDomainStatus,
  verifyDomain,
  type DomainStatus,
} from "@/lib/publishing/domain-service";
import { DnsInstructions } from "./dns-instructions";
import { toast } from "sonner";

interface DomainSettingsProps {
  siteId: string;
  subdomain: string;
  // Legacy props for backwards compatibility
  siteSlug?: string;
  currentDomain?: string | null;
  isVerified?: boolean;
}

export function DomainSettings({ 
  siteId, 
  subdomain,
  siteSlug,
  currentDomain: legacyCurrentDomain,
}: DomainSettingsProps) {
  const [domain, setDomain] = useState("");
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use subdomain or legacy siteSlug
  const actualSubdomain = subdomain || siteSlug || "";
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";
  const defaultUrl = `https://${actualSubdomain}.${baseDomain}`;

  // Load domain status
  const loadDomainStatus = useCallback(async () => {
    const status = await getDomainStatus(siteId);
    setDomainStatus(status);
    if (status?.domain) {
      setDomain(status.domain);
    } else if (legacyCurrentDomain) {
      setDomain(legacyCurrentDomain);
    }
  }, [siteId, legacyCurrentDomain]);

  useEffect(() => {
    loadDomainStatus();
  }, [loadDomainStatus]);

  const handleSetDomain = async () => {
    if (!domain.trim()) {
      setError("Please enter a domain");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await setCustomDomain(siteId, domain.trim());

    setLoading(false);

    if (result.success) {
      toast.success("Domain configured! Please add the DNS records.");
      loadDomainStatus();
    } else {
      setError(result.error || "Failed to set domain");
    }
  };

  const handleRemoveDomain = async () => {
    setLoading(true);
    setError(null);

    const result = await removeCustomDomain(siteId);

    setLoading(false);

    if (result.success) {
      setDomain("");
      setDomainStatus(null);
      toast.success("Custom domain removed");
    } else {
      setError(result.error || "Failed to remove domain");
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);

    const result = await verifyDomain(siteId);

    setVerifying(false);

    if (result.success && result.verified) {
      toast.success("Domain verified and SSL activated!");
      loadDomainStatus();
    } else {
      setError(result.error || "Verification failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Default Subdomain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Default URL</CardTitle>
          <CardDescription>
            Your site is always accessible at this URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-muted rounded-lg px-3 py-2">
              <Globe className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm font-mono">{defaultUrl}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(defaultUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Custom Domain</CardTitle>
              <CardDescription>
                Use your own domain for this site
              </CardDescription>
            </div>
            {domainStatus?.verified && (
              <Badge className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!domainStatus?.configured ? (
            // Domain input
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <div className="flex gap-2">
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    disabled={loading}
                  />
                  <Button onClick={handleSetDomain} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Domain
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your domain without http:// or www
                </p>
              </div>
            </div>
          ) : (
            // Domain configured
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{domainStatus.domain}</span>
                </div>
                <div className="flex items-center gap-2">
                  {domainStatus.sslActive && (
                    <Badge variant="outline" className="text-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      SSL
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveDomain}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {!domainStatus.verified && (
                <>
                  <Separator />

                  {/* DNS Instructions */}
                  <DnsInstructions
                    domain={domainStatus.domain}
                    records={domainStatus.dnsRecords}
                  />

                  {/* Verify Button */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                      {domainStatus.lastChecked
                        ? `Last checked: ${new Date(domainStatus.lastChecked).toLocaleString()}`
                        : "Not verified yet"}
                    </p>
                    <Button onClick={handleVerify} disabled={verifying}>
                      {verifying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Verify DNS
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
