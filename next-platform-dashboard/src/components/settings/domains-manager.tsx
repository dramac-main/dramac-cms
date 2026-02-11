"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Globe,
  CheckCircle2,
  CircleX,
  Loader2,
  Trash2,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertTriangle,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DOMAINS } from "@/lib/constants/domains";

interface DomainHealthCheck {
  dns: { passed: boolean; records: { type: string; value: string }[] };
  http: { passed: boolean; statusCode?: number; responseTime?: number };
  healthy: boolean;
}

interface DomainsManagerProps {
  siteId: string;
  currentSubdomain: string;
  currentCustomDomain: string | null;
  domainVerified: boolean;
}

type DomainStep = "idle" | "entering" | "verifying" | "configuring" | "complete";

export function DomainsManager({
  siteId,
  currentSubdomain,
  currentCustomDomain,
  domainVerified,
}: DomainsManagerProps) {
  const [customDomain, setCustomDomain] = useState(currentCustomDomain);
  const [verified, setVerified] = useState(domainVerified);
  const [newDomain, setNewDomain] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState<DomainStep>("idle");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [healthCheck, setHealthCheck] = useState<DomainHealthCheck | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [validationError, setValidationError] = useState("");

  const subdomainUrl = `${DOMAINS.PROTOCOL}://${currentSubdomain}.${DOMAINS.SITES_BASE}`;
  const customDomainUrl = customDomain ? `${DOMAINS.PROTOCOL}://${customDomain}` : null;

  // Domain format validation
  const validateDomain = (domain: string): boolean => {
    setValidationError("");
    if (!domain) return false;

    // Strip protocol if user pasted a URL
    const cleaned = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(cleaned)) {
      setValidationError("Enter a valid domain (e.g., www.example.com)");
      return false;
    }

    // Don't allow platform domains
    if (
      cleaned.endsWith(`.${DOMAINS.SITES_BASE}`) ||
      cleaned.endsWith(`.${DOMAINS.PLATFORM_BASE}`)
    ) {
      setValidationError("Cannot use a platform domain as a custom domain");
      return false;
    }

    return true;
  };

  // Verify DNS records
  const verifyDns = useCallback(async (domain: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Verification failed");
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("DNS verify error:", error);
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Auto-poll DNS after domain is entered (up to 20 times = ~10 minutes)
  useEffect(() => {
    if (step !== "verifying" || !newDomain || pollCount >= 20) return;

    const timer = setTimeout(async () => {
      const result = await verifyDns(newDomain);
      if (result?.propagated) {
        setStep("configuring");
        handleAddDomain(newDomain);
      } else {
        setPollCount((c) => c + 1);
      }
    }, 30000); // Check every 30 seconds

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, newDomain, pollCount, verifyDns]);

  // Add/change custom domain via cascade API
  const handleAddDomain = async (domain: string) => {
    setStep("configuring");
    try {
      const res = await fetch("/api/domains/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, domain }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add domain");
      }

      setCustomDomain(domain);
      setVerified(true);
      setStep("complete");
      setIsDialogOpen(false);
      setNewDomain("");
      setPollCount(0);
      toast.success(`Domain ${domain} configured successfully!`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add domain";
      toast.error(message);
      setStep("entering");
    }
  };

  // Remove custom domain
  const handleRemoveDomain = async () => {
    if (!customDomain) return;
    setIsRemoving(true);
    try {
      const res = await fetch("/api/domains/add", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to remove domain");
      }

      toast.success("Custom domain removed. Site reverted to subdomain.");
      setCustomDomain(null);
      setVerified(false);
      setHealthCheck(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to remove domain";
      toast.error(message);
    } finally {
      setIsRemoving(false);
    }
  };

  // Check domain health
  const checkHealth = useCallback(async () => {
    if (!customDomain) return;
    setIsCheckingHealth(true);
    try {
      const res = await fetch(
        `/api/domains/${encodeURIComponent(customDomain)}/status`
      );
      if (res.ok) {
        const data = await res.json();
        setHealthCheck(data);
      }
    } catch {
      toast.error("Health check failed");
    } finally {
      setIsCheckingHealth(false);
    }
  }, [customDomain]);

  // Initial health check for existing custom domains
  useEffect(() => {
    if (customDomain && verified) {
      checkHealth();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Manual DNS verify button
  const handleManualVerify = async () => {
    if (!newDomain) return;
    const result = await verifyDns(newDomain);
    if (result?.propagated) {
      toast.success("DNS verified! Configuring domain...");
      setStep("configuring");
      await handleAddDomain(newDomain);
    } else {
      toast.info("DNS not propagated yet. This can take up to 48 hours.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Domain Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Configuration
          </CardTitle>
          <CardDescription>
            Manage your site&apos;s domain and SSL settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subdomain (always present) */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Subdomain</p>
                <p className="text-sm text-muted-foreground">
                  {currentSubdomain}.{DOMAINS.SITES_BASE}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyToClipboard(subdomainUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a
                  href={subdomainUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Custom Domain */}
          {customDomain ? (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full ${verified ? "bg-green-500" : "bg-yellow-500"}`}
                />
                <div>
                  <p className="text-sm font-medium">Custom Domain</p>
                  <p className="text-sm text-muted-foreground">
                    {customDomain}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {verified && (
                  <Badge
                    variant="secondary"
                    className="text-green-700 bg-green-100"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    SSL
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(customDomainUrl!)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a
                    href={customDomainUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleRemoveDomain}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setStep("idle");
                  setNewDomain("");
                  setPollCount(0);
                  setValidationError("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-dashed">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Domain
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Custom Domain</DialogTitle>
                  <DialogDescription>
                    Connect your own domain to this site. You&apos;ll need to
                    configure DNS records with your domain registrar.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Domain input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Domain</label>
                    <Input
                      placeholder="www.example.com"
                      value={newDomain}
                      onChange={(e) => {
                        setNewDomain(e.target.value.toLowerCase().trim());
                        setValidationError("");
                      }}
                      disabled={
                        step === "configuring" || step === "complete"
                      }
                    />
                    {validationError && (
                      <p className="text-sm text-destructive">
                        {validationError}
                      </p>
                    )}
                  </div>

                  {/* DNS Instructions */}
                  {newDomain && !validationError && (
                    <div className="space-y-3">
                      <Separator />
                      <p className="text-sm font-medium">
                        Configure DNS Records
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Add one of the following records with your domain
                        registrar:
                      </p>

                      {/* CNAME instruction */}
                      <div className="rounded-md border bg-muted/50 p-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Option A: CNAME Record (recommended for www)
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm font-mono">
                          <div>
                            <span className="text-xs text-muted-foreground">
                              Type
                            </span>
                            <p>CNAME</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">
                              Name
                            </span>
                            <p>www</p>
                          </div>
                          <div className="flex items-end gap-1">
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Value
                              </span>
                              <p className="truncate">
                                {DOMAINS.VERCEL_CNAME}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() =>
                                copyToClipboard(DOMAINS.VERCEL_CNAME)
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* A record instruction */}
                      <div className="rounded-md border bg-muted/50 p-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Option B: A Record (for root domain @)
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm font-mono">
                          <div>
                            <span className="text-xs text-muted-foreground">
                              Type
                            </span>
                            <p>A</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">
                              Name
                            </span>
                            <p>@</p>
                          </div>
                          <div className="flex items-end gap-1">
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Value
                              </span>
                              <p>{DOMAINS.VERCEL_A_RECORD}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() =>
                                copyToClipboard(DOMAINS.VERCEL_A_RECORD)
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Verification status */}
                      {step === "verifying" && (
                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertTitle>Waiting for DNS propagation</AlertTitle>
                          <AlertDescription>
                            Auto-checking every 30 seconds ({pollCount}/20
                            checks). DNS can take up to 48 hours.
                          </AlertDescription>
                        </Alert>
                      )}

                      {step === "configuring" && (
                        <Alert>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <AlertTitle>Configuring domain...</AlertTitle>
                          <AlertDescription>
                            Setting up SSL certificate and routing. This takes a
                            few seconds.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  {step !== "configuring" && step !== "complete" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleManualVerify}
                        disabled={
                          !newDomain ||
                          isVerifying ||
                          !validateDomain(newDomain)
                        }
                      >
                        {isVerifying ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Verify DNS
                      </Button>
                      <Button
                        onClick={() => {
                          if (!validateDomain(newDomain)) return;
                          setStep("verifying");
                          setPollCount(0);
                          handleManualVerify();
                        }}
                        disabled={!newDomain || step === "verifying"}
                      >
                        {step === "verifying" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Verifying...
                          </>
                        ) : (
                          "Add Domain"
                        )}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Domain Health Status */}
      {customDomain && verified && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Domain Health</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkHealth}
                disabled={isCheckingHealth}
              >
                {isCheckingHealth ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {healthCheck ? (
              <div className="space-y-3">
                {/* Overall status */}
                <div className="flex items-center gap-2">
                  {healthCheck.healthy ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700">
                        Healthy
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <span className="font-medium text-amber-700">
                        Issues Detected
                      </span>
                    </>
                  )}
                </div>

                {/* Individual checks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      DNS Resolution
                    </span>
                    {healthCheck.dns.passed ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <CircleX className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      HTTP Reachability
                    </span>
                    {healthCheck.http.passed ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {healthCheck.http.responseTime
                          ? `${healthCheck.http.responseTime}ms`
                          : "OK"}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <CircleX className="h-3 w-3 mr-1" />
                        Unreachable
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      SSL Certificate
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Auto (Vercel)
                    </Badge>
                  </div>
                </div>
              </div>
            ) : isCheckingHealth ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking domain health...
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Health check data not available
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
