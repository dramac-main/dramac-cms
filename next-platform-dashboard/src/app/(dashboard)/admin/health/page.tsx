import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import {
  CircleCheck,
  CircleX,
  AlertTriangle,
  Database,
  Server,
  Globe,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `System Health | Admin | ${PLATFORM.name}`,
  description: "Monitor system health and status",
};

interface HealthCheck {
  name: string;
  status: "healthy" | "warning" | "error";
  message: string;
  latency?: number;
}

async function getSystemHealth(): Promise<{
  checks: HealthCheck[];
  uptime: string;
  version: string;
}> {
  await requireSuperAdmin();
  const supabase = await createClient();
  const checks: HealthCheck[] = [];

  // Database check
  const dbStart = Date.now();
  const { error: dbError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);
  const dbLatency = Date.now() - dbStart;

  checks.push({
    name: "Database",
    status: dbError ? "error" : dbLatency > 1000 ? "warning" : "healthy",
    message: dbError
      ? `Connection failed: ${dbError.message}`
      : `Connected (${dbLatency}ms)`,
    latency: dbLatency,
  });

  // Auth check
  const authStart = Date.now();
  const { error: authError } = await supabase.auth.getSession();
  const authLatency = Date.now() - authStart;

  checks.push({
    name: "Authentication",
    status: authError ? "error" : authLatency > 500 ? "warning" : "healthy",
    message: authError
      ? `Auth error: ${authError.message}`
      : `Working (${authLatency}ms)`,
    latency: authLatency,
  });

  // Storage check
  const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
  
  checks.push({
    name: "Storage",
    status: storageError ? "error" : "healthy",
    message: storageError
      ? `Storage error: ${storageError.message}`
      : `${buckets?.length || 0} buckets available`,
  });

  // Environment variables check
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];
  const missingVars = requiredEnvVars.filter(
    (v) => !process.env[v]
  );

  checks.push({
    name: "Environment",
    status: missingVars.length > 0 ? "warning" : "healthy",
    message:
      missingVars.length > 0
        ? `Missing: ${missingVars.join(", ")}`
        : "All required variables set",
  });

  // Calculate uptime (requires external uptime monitoring service)
  const uptime = "—"; // Requires external uptime monitoring service
  const version = process.env.npm_package_version || "1.0.0";

  return { checks, uptime, version };
}

const statusIcons = {
  healthy: CircleCheck,
  warning: AlertTriangle,
  error: CircleX,
};

const statusColors = {
  healthy: "text-green-600",
  warning: "text-yellow-600",
  error: "text-red-600",
};

const statusBadgeColors = {
  healthy: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
};

export default async function AdminHealthPage() {
  const { checks, uptime, version } = await getSystemHealth();

  const healthyCount = checks.filter((c) => c.status === "healthy").length;
  const overallHealth = Math.round((healthyCount / checks.length) * 100);
  const overallStatus =
    checks.some((c) => c.status === "error")
      ? "error"
      : checks.some((c) => c.status === "warning")
        ? "warning"
        : "healthy";

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Monitor platform health and performance"
        actions={
          <Link href="/admin/health" prefetch={false}>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </Link>
        }
      />

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-bold">{overallHealth}%</div>
                <Progress value={overallHealth} className="mt-2" />
              </div>
              <Badge
                variant="secondary"
                className={statusBadgeColors[overallStatus]}
              >
                {overallStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Uptime (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uptime}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Target: 99.9%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Version
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">v{version}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Next.js 15 + Supabase
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Health Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checks.map((check) => {
              const StatusIcon = statusIcons[check.status];
              const iconColorClass = statusColors[check.status];

              return (
                <div
                  key={check.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <StatusIcon className={`w-5 h-5 ${iconColorClass}`} />
                    <div>
                      <p className="font-medium">{check.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {check.message}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={statusBadgeColors[check.status]}
                  >
                    {check.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Resources — use Vercel/Supabase dashboards for real metrics */}

      {/* Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Infrastructure</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This application is deployed on Vercel with Supabase as the
                backend. For detailed metrics and logs, visit your Vercel and
                Supabase dashboards.
              </p>
              <div className="flex gap-2 mt-3">
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Globe className="w-4 h-4 mr-2" />
                    Vercel Dashboard
                  </Button>
                </a>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Database className="w-4 h-4 mr-2" />
                    Supabase Dashboard
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
