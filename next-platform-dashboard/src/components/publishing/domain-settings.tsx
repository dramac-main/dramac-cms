"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Check, X, Loader2, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface DomainSettingsProps {
  siteId: string;
  siteSlug: string;
  currentDomain: string | null;
  isVerified: boolean;
}

interface DomainConfig {
  txtRecord: string;
  cnameTarget: string;
}

export function DomainSettings({
  siteId,
  siteSlug,
  currentDomain,
}: DomainSettingsProps) {
  const [domain, setDomain] = useState(currentDomain || "");
  const [config, setConfig] = useState<DomainConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "failed" | null>(null);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "platform.com";
  const subdomainUrl = `${siteSlug}.${baseDomain}`;

  useEffect(() => {
    // Fetch domain config
    fetch(`/api/sites/${siteId}/domain`)
      .then((res) => res.json())
      .then(setConfig);
  }, [siteId]);

  const handleVerify = async () => {
    if (!domain) return;

    setIsVerifying(true);
    setVerificationStatus("pending");

    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      const result = await res.json();

      if (result.verified) {
        setVerificationStatus("success");
      } else {
        setVerificationStatus("failed");
      }
    } catch {
      setVerificationStatus("failed");
    }

    setIsVerifying(false);
  };

  const handleSave = async () => {
    if (!domain) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Custom domain saved successfully");
      } else {
        toast.error(result.error || "Failed to save domain");
      }
    } catch {
      toast.error("Failed to save domain");
    }

    setIsLoading(false);
  };

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDomain("");
        setVerificationStatus(null);
        toast.success("Custom domain removed");
      }
    } catch {
      toast.error("Failed to remove domain");
    }

    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Custom Domain
        </CardTitle>
        <CardDescription>
          Connect your own domain to this site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default subdomain */}
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Default URL</p>
              <p className="text-sm text-muted-foreground">{subdomainUrl}</p>
            </div>
            <Badge>Always Active</Badge>
          </div>
        </div>

        {/* Custom domain input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Custom Domain</Label>
            <div className="flex gap-2">
              <Input
                placeholder="www.example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={!domain || isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Verification status */}
          {verificationStatus && (
            <Alert variant={verificationStatus === "success" ? "default" : "destructive"}>
              <AlertDescription className="flex items-center gap-2">
                {verificationStatus === "success" ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Domain verified successfully
                  </>
                ) : verificationStatus === "failed" ? (
                  <>
                    <X className="h-4 w-4" />
                    Domain verification failed. Please check DNS settings.
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying domain...
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* DNS Configuration */}
        {config && domain && (
          <div className="space-y-4 p-4 rounded-lg border">
            <h4 className="font-medium">DNS Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Add one of the following records to your DNS provider:
            </p>

            {/* CNAME Option */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Option 1: CNAME Record</p>
              <div className="flex items-center gap-2 bg-muted p-2 rounded text-sm font-mono">
                <span className="text-muted-foreground">CNAME</span>
                <span className="flex-1">{config.cnameTarget}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(config.cnameTarget)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* TXT Option */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Option 2: TXT Record (for verification)</p>
              <div className="flex items-center gap-2 bg-muted p-2 rounded text-sm font-mono">
                <span className="text-muted-foreground">TXT</span>
                <span className="flex-1 truncate">{config.txtRecord}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(config.txtRecord)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {currentDomain && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isLoading}
            >
              Remove Domain
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!domain || verificationStatus !== "success" || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {currentDomain ? "Update Domain" : "Connect Domain"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
