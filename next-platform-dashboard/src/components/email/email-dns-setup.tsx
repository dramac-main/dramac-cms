"use client";

import { useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Settings2, Loader2 } from "lucide-react";
import { configureBusinessEmailDns } from "@/lib/actions/business-email";
import { toast } from "sonner";
import Link from "next/link";

interface EmailDnsSetupProps {
  orderId: string;
  domainId?: string | null;
  dnsConfigured: boolean;
}

export function EmailDnsSetup({ orderId, domainId, dnsConfigured }: EmailDnsSetupProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfigureDns = () => {
    startTransition(async () => {
      const result = await configureBusinessEmailDns(orderId);
      if (result.success) {
        toast.success("DNS records configured for email");
      } else {
        toast.error(result.error || "Failed to configure DNS");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Email DNS Configuration
              {dnsConfigured ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              MX, SPF, and DKIM records required for email delivery
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dnsConfigured ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>Your email DNS records are configured correctly.</span>
            </div>
            {domainId && (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/domains/${domainId}/dns`}>
                  <Settings2 className="h-4 w-4 mr-2" />
                  View DNS Records
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Email DNS records need to be configured for email to work properly. 
              This will add MX, SPF, and DKIM records to your domain.
            </p>
            
            <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
              <div><span className="text-purple-600 dark:text-purple-400">MX</span> mx1.titan.email (priority 10)</div>
              <div><span className="text-purple-600 dark:text-purple-400">MX</span> mx2.titan.email (priority 20)</div>
              <div><span className="text-yellow-600 dark:text-yellow-400">TXT</span> v=spf1 include:spf.titan.email ~all</div>
            </div>

            {domainId ? (
              <div className="flex gap-2">
                <Button onClick={handleConfigureDns} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Configuring...
                    </>
                  ) : (
                    <>
                      <Settings2 className="h-4 w-4 mr-2" />
                      Auto-Configure DNS
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/domains/${domainId}/dns`}>
                    Configure Manually
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This email order is not linked to a managed domain. 
                Please configure DNS records manually at your DNS provider.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
