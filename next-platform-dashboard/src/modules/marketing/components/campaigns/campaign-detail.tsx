/**
 * Campaign Detail Component
 * Phase MKT-02: Email Campaign Engine (UI)
 *
 * Displays campaign info, status actions, and performance metrics.
 * Status-aware: draft shows edit, sent shows analytics.
 * Secure: email preview uses sandboxed iframe to prevent XSS.
 */
"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  Archive,
  Copy,
  Users,
  Mail,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  CAMPAIGN_STATUS_CONFIG,
  VALID_CAMPAIGN_TRANSITIONS,
} from "../../lib/marketing-constants";
import {
  updateCampaignStatus,
  duplicateCampaign,
  sendCampaignNow,
} from "../../actions/campaign-actions";
import type { Campaign, CampaignStatus } from "../../types";

interface CampaignDetailProps {
  siteId: string;
  campaign: Campaign;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function CampaignDetail({ siteId, campaign }: CampaignDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("overview");

  // Campaign fields - safe access with typed defaults
  const c = campaign as unknown as Record<string, unknown>;
  const status = (c.status as CampaignStatus) || "draft";
  const config = CAMPAIGN_STATUS_CONFIG[status];
  const validTransitions = VALID_CAMPAIGN_TRANSITIONS[status] || [];
  const basePath = `/dashboard/sites/${siteId}/marketing/campaigns`;

  const totalSent = Number(c.total_sent) || 0;
  const totalDelivered = Number(c.total_delivered) || 0;
  const totalOpened = Number(c.total_opened) || 0;
  const totalClicked = Number(c.total_clicked) || 0;
  const totalBounced = Number(c.total_bounced) || 0;
  const totalUnsubscribed = Number(c.total_unsubscribed) || 0;

  const openRate =
    totalDelivered > 0
      ? ((totalOpened / totalDelivered) * 100).toFixed(1)
      : "0";
  const clickRate =
    totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : "0";
  const bounceRate =
    totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : "0";

  // Build sandboxed email preview HTML (XSS-safe)
  const previewSrcDoc = useMemo(() => {
    const html = typeof c.content_html === "string" ? c.content_html : "";
    if (!html) return "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;font-size:14px;color:#333;}</style></head><body>${html}</body></html>`;
  }, [c.content_html]);

  async function handleStatusChange(newStatus: CampaignStatus) {
    startTransition(async () => {
      try {
        await updateCampaignStatus(siteId, c.id as string, newStatus);
        router.refresh();
        toast.success(`Campaign ${newStatus}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update campaign status";
        toast.error(msg);
      }
    });
  }

  async function handleSend() {
    startTransition(async () => {
      try {
        await sendCampaignNow(siteId, c.id as string);
        router.refresh();
        toast.success("Campaign is now sending!");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to send campaign";
        toast.error(msg);
      }
    });
  }

  async function handleDuplicate() {
    try {
      const dup = await duplicateCampaign(siteId, c.id as string);
      toast.success("Campaign duplicated");
      if (dup && typeof dup === "object" && "id" in dup) {
        router.push(`${basePath}/${dup.id}`);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to duplicate campaign";
      toast.error(msg);
    }
  }

  const formatDate = (val: unknown) => {
    if (!val) return null;
    return new Date(String(val)).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (val: unknown) => {
    if (!val) return null;
    return new Date(String(val)).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold truncate">{String(c.name || "Untitled")}</h2>
            <Badge
              variant="secondary"
              className={`${config?.bgColor} ${config?.color} shrink-0`}
            >
              {config?.label || status}
            </Badge>
          </div>
          {Boolean(c.subject_line) && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              Subject: {String(c.subject_line)}
            </p>
          )}
          {Boolean(c.description) && (
            <p className="text-sm text-muted-foreground mt-1">
              {String(c.description)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {status === "draft" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("scheduled")}
                disabled={isPending}
              >
                <Clock className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={isPending}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Now
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send Campaign Now?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will send the campaign to all targeted subscribers immediately.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSend}>
                      Send Now
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {status === "sending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("paused")}
              disabled={isPending}
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          {status === "paused" && (
            <Button
              size="sm"
              onClick={() => handleStatusChange("sending")}
              disabled={isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          )}
          {validTransitions.includes("archived") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange("archived")}
              disabled={isPending}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {totalSent > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            label="Emails Sent"
            value={totalSent.toLocaleString()}
            icon={Send}
            subtitle={`${totalDelivered.toLocaleString()} delivered`}
          />
          <MetricCard
            label="Open Rate"
            value={`${openRate}%`}
            icon={Eye}
            subtitle={`${totalOpened.toLocaleString()} opens`}
          />
          <MetricCard
            label="Click Rate"
            value={`${clickRate}%`}
            icon={MousePointerClick}
            subtitle={`${totalClicked.toLocaleString()} clicks`}
          />
          <MetricCard
            label="Bounce Rate"
            value={`${bounceRate}%`}
            icon={AlertTriangle}
            subtitle={`${totalBounced} bounced, ${totalUnsubscribed} unsubs`}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Mail className="h-4 w-4" />
            Overview
          </TabsTrigger>
          {totalSent > 0 && (
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          )}
          <TabsTrigger value="audience" className="gap-2">
            <Users className="h-4 w-4" />
            Audience
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    From
                  </p>
                  <p className="text-sm">
                    {String(c.from_name || "Default")} &lt;
                    {String(c.from_email || "Default")}&gt;
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Reply To
                  </p>
                  <p className="text-sm">{String(c.reply_to || "Same as sender")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Type
                  </p>
                  <p className="text-sm capitalize">{String(c.type || "email")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="text-sm">
                    {formatDate(c.created_at) || "Unknown"}
                  </p>
                </div>
                {Boolean(c.scheduled_at) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Scheduled For
                    </p>
                    <p className="text-sm">
                      {formatDateTime(c.scheduled_at)}
                    </p>
                  </div>
                )}
                {Boolean(c.completed_at) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Completed At
                    </p>
                    <p className="text-sm">
                      {formatDateTime(c.completed_at)}
                    </p>
                  </div>
                )}
              </div>

              {Array.isArray(c.tags) && c.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(c.tags as string[]).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {typeof c.content_html === "string" && c.content_html && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Email Preview
                  </p>
                  <div className="border rounded-lg bg-white overflow-hidden">
                    <iframe
                      srcDoc={previewSrcDoc}
                      sandbox=""
                      title="Email content preview"
                      className="w-full h-96 border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{totalSent}</p>
                  <p className="text-sm text-muted-foreground">Total Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{totalDelivered}</p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{totalOpened}</p>
                  <p className="text-sm text-muted-foreground">Opened</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{totalClicked}</p>
                  <p className="text-sm text-muted-foreground">Clicked</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">
                    {totalBounced}
                  </p>
                  <p className="text-sm text-muted-foreground">Bounced</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {totalUnsubscribed}
                  </p>
                  <p className="text-sm text-muted-foreground">Unsubscribed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Recipients
                  </p>
                  <p className="text-lg font-semibold">
                    {(Number(c.total_recipients) || 0).toLocaleString()}
                  </p>
                </div>
                {Boolean(c.audience_id) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Audience ID
                    </p>
                    <p className="text-sm font-mono">{String(c.audience_id)}</p>
                  </div>
                )}
                {Boolean(c.segment_id) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Segment ID
                    </p>
                    <p className="text-sm font-mono">{String(c.segment_id)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
