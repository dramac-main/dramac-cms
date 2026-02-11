"use client";

// src/components/domains/automation/domain-health-check.tsx
// Domain health check status and run component

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  CircleX,
  AlertTriangle,
  RefreshCw,
  Globe,
  Shield,
  Server,
  Loader2,
  Eye,
} from "lucide-react";
import { runHealthCheck } from "@/lib/actions/automation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface HealthCheckData {
  dns_healthy: boolean;
  ssl_healthy: boolean;
  nameservers_correct: boolean;
  whois_accessible: boolean;
  dns_issues: string[];
  ssl_issues: string[];
  last_checked_at: string;
}

interface DomainHealthCheckProps {
  domainId: string;
  healthData?: HealthCheckData | null;
  healthStatus?: string;
}

export function DomainHealthCheck({ domainId, healthData, healthStatus }: DomainHealthCheckProps) {
  const [isPending, startTransition] = useTransition();
  const [localData, setLocalData] = useState<HealthCheckData | null | undefined>(healthData);
  const [localStatus, setLocalStatus] = useState(healthStatus);

  const handleRunCheck = () => {
    startTransition(async () => {
      const result = await runHealthCheck(domainId);
      if (result.success && result.data) {
        setLocalData({
          dns_healthy: result.data.dns_healthy,
          ssl_healthy: result.data.ssl_healthy,
          nameservers_correct: result.data.nameservers_correct,
          whois_accessible: result.data.whois_accessible,
          dns_issues: result.data.dns_issues,
          ssl_issues: result.data.ssl_issues,
          last_checked_at: new Date().toISOString(),
        });
        setLocalStatus(result.data.status);
        toast.success("Health check completed");
      } else {
        toast.error(result.error || "Failed to run health check");
      }
    });
  };

  const getStatusBadge = () => {
    const status = localStatus || 'unknown';
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive"><CircleX className="h-3 w-3 mr-1" />Unhealthy</Badge>;
      default:
        return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Unknown</Badge>;
    }
  };

  const checks = [
    {
      key: 'dns_healthy',
      label: 'DNS Configuration',
      icon: Globe,
      healthy: localData?.dns_healthy ?? false,
      issues: localData?.dns_issues ?? [],
    },
    {
      key: 'ssl_healthy',
      label: 'SSL/TLS Certificate',
      icon: Shield,
      healthy: localData?.ssl_healthy ?? false,
      issues: localData?.ssl_issues ?? [],
    },
    {
      key: 'nameservers_correct',
      label: 'Nameservers',
      icon: Server,
      healthy: localData?.nameservers_correct ?? false,
      issues: localData?.nameservers_correct ? [] : ['Nameservers not matching expected values'],
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            Domain Health
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            {localData?.last_checked_at
              ? `Last checked ${formatDistanceToNow(new Date(localData.last_checked_at), { addSuffix: true })}`
              : 'Health check not run yet'
            }
          </CardDescription>
        </div>
        <Button onClick={handleRunCheck} disabled={isPending} variant="outline" size="sm">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Check Now</span>
        </Button>
      </CardHeader>
      <CardContent>
        {localData ? (
          <div className="space-y-4">
            {checks.map((check) => (
              <div key={check.key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  check.healthy
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <check.icon className={`h-4 w-4 ${
                    check.healthy ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{check.label}</span>
                    {check.healthy ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <CircleX className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {!check.healthy && check.issues.length > 0 && (
                    <ul className="mt-1 text-sm text-muted-foreground">
                      {check.issues.map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">Run a health check to see your domain&apos;s status</p>
            <Button onClick={handleRunCheck} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Health Check
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
