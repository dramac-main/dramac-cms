/**
 * Admin Marketing Dashboard Component
 *
 * Phase MKT-10: Super Admin Marketing View
 *
 * Client component displaying platform email health, per-site volumes,
 * sending limits, and admin controls.
 */
"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Mail,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  Shield,
  TrendingUp,
  ArrowUpDown,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type {
  PlatformHealthReport,
  SiteSendingVolume,
  HealthStatus,
} from "../../types/admin-types";
import {
  getPlatformHealthReport,
  adminPauseSiteMarketing,
  adminResumeSiteMarketing,
  runAutoSafety,
} from "../../actions/admin-marketing-actions";

// ============================================================================
// HEALTH STATUS BADGES
// ============================================================================

function HealthBadge({ status }: { status: HealthStatus }) {
  const config: Record<
    HealthStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
  > = {
    healthy: { label: "Good", variant: "default", icon: CheckCircle2 },
    warning: { label: "Warning", variant: "secondary", icon: AlertTriangle },
    critical: { label: "Critical", variant: "destructive", icon: XCircle },
    paused: { label: "Paused", variant: "outline", icon: Pause },
  };
  const c = config[status];
  const Icon = c.icon;

  return (
    <Badge variant={c.variant} className="text-xs">
      <Icon className="mr-1 h-3 w-3" />
      {c.label}
    </Badge>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AdminMarketingDashboard() {
  const [report, setReport] = useState<PlatformHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [pauseDialog, setPauseDialog] = useState<{
    open: boolean;
    siteId: string;
    siteName: string;
  }>({ open: false, siteId: "", siteName: "" });
  const [pauseReason, setPauseReason] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await getPlatformHealthReport();
      setReport(data);
    } catch {
      toast.error("Failed to load platform health report");
    } finally {
      setLoading(false);
    }
  }

  function handlePauseSite(siteId: string, siteName: string) {
    setPauseDialog({ open: true, siteId, siteName });
    setPauseReason("");
  }

  function confirmPause() {
    if (!pauseReason.trim()) {
      toast.error("Please provide a reason for pausing");
      return;
    }
    startTransition(async () => {
      const result = await adminPauseSiteMarketing(
        pauseDialog.siteId,
        pauseReason,
      );
      if (result.success) {
        toast.success(`Marketing paused for ${pauseDialog.siteName}`);
        setPauseDialog({ open: false, siteId: "", siteName: "" });
        loadReport();
      } else {
        toast.error("Failed to pause marketing");
      }
    });
  }

  function handleResumeSite(siteId: string, siteName: string) {
    startTransition(async () => {
      const result = await adminResumeSiteMarketing(siteId);
      if (result.success) {
        toast.success(`Marketing resumed for ${siteName}`);
        loadReport();
      } else {
        toast.error("Failed to resume marketing");
      }
    });
  }

  function handleRunSafety() {
    startTransition(async () => {
      const result = await runAutoSafety();
      if (result.paused.length > 0) {
        toast.warning(result.reason);
      } else {
        toast.success("All sites healthy — no action needed");
      }
      loadReport();
    });
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-64 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load health report.{" "}
        <Button variant="link" onClick={loadReport}>
          Retry
        </Button>
      </div>
    );
  }

  const { health, topSites, sendingLimits, thresholds } = report;
  const usagePercent =
    sendingLimits.monthlyLimit > 0
      ? Math.round(
          (sendingLimits.monthlyUsed / sendingLimits.monthlyLimit) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HealthBadge status={health.status} />
          <span className="text-sm text-muted-foreground">
            Last checked: {new Date(health.lastCheckedAt).toLocaleString()}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReport}
            disabled={isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSafety}
            disabled={isPending}
          >
            <Shield className="mr-2 h-4 w-4" />
            Run Safety Check
          </Button>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold">{health.deliveryRate}%</p>
              </div>
              <HealthBadge
                status={health.deliveryRate >= 95 ? "healthy" : "warning"}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {health.totalEmailsSent7d.toLocaleString()} emails sent (7d)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bounce Rate</p>
                <p className="text-2xl font-bold">{health.bounceRate}%</p>
              </div>
              <HealthBadge
                status={
                  health.bounceRate >= thresholds.bounceRateCritical
                    ? "critical"
                    : health.bounceRate >= thresholds.bounceRateWarning
                      ? "warning"
                      : "healthy"
                }
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {health.totalBounced7d.toLocaleString()} bounced (7d)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Complaint Rate</p>
                <p className="text-2xl font-bold">{health.complaintRate}%</p>
              </div>
              <HealthBadge
                status={
                  health.complaintRate >= thresholds.complaintRateCritical
                    ? "critical"
                    : health.complaintRate >= thresholds.complaintRateWarning
                      ? "warning"
                      : "healthy"
                }
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {health.totalComplaints7d.toLocaleString()} complaints (7d)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Reputation Score
                </p>
                <p className="text-2xl font-bold">
                  {health.reputationScore}/100
                </p>
              </div>
              <HealthBadge
                status={
                  health.reputationScore >= 80
                    ? "healthy"
                    : health.reputationScore >= 50
                      ? "warning"
                      : "critical"
                }
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on delivery metrics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Threshold Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium">Bounce Rate</p>
              <p className="text-muted-foreground">
                ⚠️ Warning: {">"} {thresholds.bounceRateWarning}%
              </p>
              <p className="text-muted-foreground">
                🔴 Auto-pause site: {">"} {thresholds.autoPauseBounceRate}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Complaint Rate</p>
              <p className="text-muted-foreground">
                ⚠️ Warning: {">"} {thresholds.complaintRateWarning}%
              </p>
              <p className="text-muted-foreground">
                🔴 Auto-pause ALL: {">"} {thresholds.autoPauseComplaintRate}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Sending Limits</p>
              <p className="text-muted-foreground">
                Plan: {sendingLimits.resendPlanTier}
              </p>
              <p className="text-muted-foreground">
                Used: {sendingLimits.monthlyUsed.toLocaleString()} /{" "}
                {sendingLimits.monthlyLimit.toLocaleString()} ({usagePercent}%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Sites Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Top Sites by Send Volume (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSites.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No sending data available yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead className="text-right">Emails Sent</TableHead>
                  <TableHead className="text-right">Bounce Rate</TableHead>
                  <TableHead className="text-right">Complaint Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSites.map((site) => (
                  <TableRow key={site.siteId}>
                    <TableCell className="font-medium">
                      {site.siteName}
                    </TableCell>
                    <TableCell>{site.agencyName}</TableCell>
                    <TableCell className="text-right">
                      {site.emailsSent30d.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {site.bounceRate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {site.complaintRate}%
                    </TableCell>
                    <TableCell>
                      <HealthBadge
                        status={site.isPaused ? "paused" : site.status}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {site.isPaused ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleResumeSite(site.siteId, site.siteName)
                          }
                          disabled={isPending}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Resume
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePauseSite(site.siteId, site.siteName)
                          }
                          disabled={isPending}
                        >
                          <Pause className="mr-1 h-3 w-3" />
                          Pause
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pause Dialog */}
      <Dialog
        open={pauseDialog.open}
        onOpenChange={(open) =>
          setPauseDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Marketing for {pauseDialog.siteName}</DialogTitle>
            <DialogDescription>
              This will prevent all marketing emails from being sent for this
              site. Existing scheduled campaigns will be held until resumed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pause-reason">Reason</Label>
              <Input
                id="pause-reason"
                placeholder="e.g., High bounce rate investigation"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setPauseDialog({ open: false, siteId: "", siteName: "" })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmPause}
              disabled={isPending || !pauseReason.trim()}
            >
              Pause Marketing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
