"use client";

import { useState, useTransition } from "react";
import { Shield, ShieldCheck, ShieldAlert, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { enableDnssec, disableDnssec } from "@/lib/actions/dns";
import type { DnssecStatus } from "@/lib/cloudflare/types";

interface DnssecManagerProps {
  domainId: string;
  domainName: string;
  initialStatus: DnssecStatus;
}

export function DnssecManager({ domainId, domainName, initialStatus }: DnssecManagerProps) {
  const [status, setStatus] = useState<DnssecStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const isActive = status.status === "active";
  const isPendingStatus = status.status === "pending";
  const isDisabled = status.status === "disabled";

  const handleEnable = () => {
    startTransition(async () => {
      const result = await enableDnssec(domainId);
      if (result.success && result.data) {
        setStatus(result.data);
        toast.success("DNSSEC enabled", {
          description: "DS records are being published. Cloudflare handles registry communication automatically.",
        });
      } else {
        toast.error(result.error || "Failed to enable DNSSEC");
      }
    });
  };

  const handleDisable = () => {
    startTransition(async () => {
      const result = await disableDnssec(domainId);
      if (result.success) {
        setStatus({ status: "disabled" });
        toast.success("DNSSEC disabled");
      } else {
        toast.error(result.error || "Failed to disable DNSSEC");
      }
    });
  };

  const handleCopy = () => {
    if (status.dsRecord) {
      navigator.clipboard.writeText(status.dsRecord);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("DS record copied to clipboard");
    }
  };

  const statusBadge = () => {
    if (isActive) return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    if (isPendingStatus) return <Badge variant="secondary">Pending</Badge>;
    return <Badge variant="outline">Disabled</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isActive ? (
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-green-500" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle>DNSSEC</CardTitle>
              <CardDescription>
                Cryptographic DNS validation — protects against spoofing and cache poisoning
              </CardDescription>
            </div>
          </div>
          {statusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive && status.dsRecord && (
          <Alert className="border-green-200 bg-green-500/5">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <AlertDescription className="space-y-2">
              <p className="font-medium text-sm">DS Record (automatically published via Cloudflare)</p>
              <div className="flex items-start gap-2">
                <code className="text-xs bg-muted p-2 rounded font-mono break-all flex-1">
                  {status.dsRecord}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {status.algorithm && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Algorithm: {status.algorithm}</span>
                  {status.keyTag && <span>Key Tag: {status.keyTag}</span>}
                  {status.digestType && <span>Digest Type: {status.digestType}</span>}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isPendingStatus && (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              DNSSEC is being activated. DS records are being published to the registry.
              This can take up to 30 minutes. No action is required.
            </AlertDescription>
          </Alert>
        )}

        {isDisabled && (
          <p className="text-sm text-muted-foreground">
            DNSSEC (Domain Name System Security Extensions) adds a layer of trust by signing
            DNS records with cryptographic keys. This prevents attackers from forging DNS
            responses to redirect your visitors to malicious sites.
          </p>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{domainName}</p>
            <p className="text-xs text-muted-foreground">
              {isActive
                ? "DNSSEC is protecting this domain"
                : "DNSSEC is not active on this domain"}
            </p>
          </div>

          {isDisabled ? (
            <Button onClick={handleEnable} disabled={isPending} size="sm">
              {isPending ? "Enabling…" : "Enable DNSSEC"}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isPending}>
                  {isPending ? "Disabling…" : "Disable DNSSEC"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disable DNSSEC?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Disabling DNSSEC removes the cryptographic verification layer from{" "}
                    <strong>{domainName}</strong>. DS records will be removed from the registry.
                    This may cause temporary DNS resolution failures while records propagate.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisable}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Disable DNSSEC
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
