/**
 * Marketing Hub Client Component
 * Phase MKT-05: Marketing Hub Dashboard
 *
 * Client component rendering stats, quick actions, recent campaigns,
 * active sequences, and engagement charts.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Users,
  TrendingUp,
  Send,
  Eye,
  MousePointerClick,
  Zap,
  ArrowRight,
  BarChart3,
  FileText,
  FormInput,
  Share2,
  CalendarDays,
  MessageSquare,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CAMPAIGN_STATUS_CONFIG,
  SEQUENCE_STATUS_LABELS,
} from "../../lib/marketing-constants";
import type { CampaignStatus, SequenceStatus } from "../../types";

interface HubStats {
  totalCampaigns: number;
  totalSequences: number;
  activeSubscribers: number;
  totalEmailsSent: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface MarketingHubClientProps {
  siteId: string;
  data: {
    stats: HubStats;
    recentCampaigns: any[];
    activeSequences: any[];
  };
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
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

export function MarketingHubClient({ siteId, data }: MarketingHubClientProps) {
  const { stats, recentCampaigns, activeSequences } = data;
  const basePath = `/dashboard/sites/${siteId}/marketing`;

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketing Hub</h1>
        <p className="text-muted-foreground">
          Manage campaigns, sequences, and subscriber engagement
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Subscribers"
          value={stats.activeSubscribers.toLocaleString()}
          subtitle="Opted-in contacts"
          icon={Users}
        />
        <StatCard
          title="Total Emails Sent"
          value={stats.totalEmailsSent.toLocaleString()}
          subtitle={`${stats.totalCampaigns} campaigns`}
          icon={Send}
        />
        <StatCard
          title="Open Rate"
          value={`${stats.openRate}%`}
          subtitle="Of delivered emails"
          icon={Eye}
        />
        <StatCard
          title="Click Rate"
          value={`${stats.clickRate}%`}
          subtitle="Of opened emails"
          icon={MousePointerClick}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
        <Link href={`${basePath}/campaigns`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Campaigns</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalCampaigns} total
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${basePath}/sequences`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Sequences</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalSequences} total
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${basePath}/subscribers`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Subscribers</p>
                <p className="text-xs text-muted-foreground">
                  {stats.activeSubscribers} active
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${basePath}/landing-pages`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Landing Pages</p>
                <p className="text-xs text-muted-foreground">Lead capture</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${basePath}/forms`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <FormInput className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Opt-In Forms</p>
                <p className="text-xs text-muted-foreground">Embed & popup</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${basePath}/templates`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Templates</p>
                <p className="text-xs text-muted-foreground">Email library</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${basePath}/social`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <Share2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Social Media</p>
                <p className="text-xs text-muted-foreground">
                  Posts & connections
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${basePath}/calendar`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Content Calendar</p>
                <p className="text-xs text-muted-foreground">Plan & schedule</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${basePath}/sms`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">SMS Campaigns</p>
                <p className="text-xs text-muted-foreground">Text messaging</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Campaigns + Active Sequences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Campaigns</CardTitle>
            <Link href={`${basePath}/campaigns`}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No campaigns yet. Create your first campaign to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {recentCampaigns.map((campaign: any) => {
                  const status = (campaign.status as CampaignStatus) || "draft";
                  const config = CAMPAIGN_STATUS_CONFIG[status];
                  return (
                    <Link
                      key={campaign.id}
                      href={`${basePath}/campaigns/${campaign.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {campaign.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.subject_line || "No subject"}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`ml-2 ${config?.bgColor} ${config?.color}`}
                      >
                        {config?.label || status}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Sequences */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Sequences</CardTitle>
            <Link href={`${basePath}/sequences`}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeSequences.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active sequences. Create a drip sequence to automate
                engagement.
              </p>
            ) : (
              <div className="space-y-3">
                {activeSequences.map((seq: any) => {
                  const status = (seq.status as SequenceStatus) || "draft";
                  return (
                    <Link
                      key={seq.id}
                      href={`${basePath}/sequences/${seq.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {seq.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {seq.total_enrolled || 0} enrolled &middot;{" "}
                          {seq.total_completed || 0} completed
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="secondary">
                          {(seq.steps as any[])?.length || 0} steps
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-300"
                        >
                          {SEQUENCE_STATUS_LABELS[status] || status}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">
                {stats.openRate}%
              </p>
              <p className="text-sm text-muted-foreground">Avg. Open Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">
                {stats.clickRate}%
              </p>
              <p className="text-sm text-muted-foreground">Avg. Click Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">
                {stats.bounceRate}%
              </p>
              <p className="text-sm text-muted-foreground">Bounce Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Marketing Insights */}
      <AIInsightsSection siteId={siteId} stats={stats} />
    </div>
  );
}

function AIInsightsSection({
  siteId,
  stats,
}: {
  siteId: string;
  stats: HubStats;
}) {
  const [insights, setInsights] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadInsights() {
    setLoading(true);
    setError(null);
    try {
      const { aiGetMarketingInsights } =
        await import("../../actions/ai-marketing-actions");
      const result = await aiGetMarketingInsights(siteId, {
        totalSent: stats.totalEmailsSent,
        avgOpenRate: stats.openRate,
        avgClickRate: stats.clickRate,
        subscriberGrowth: stats.activeSubscribers,
      });
      if (result.success && result.data) {
        setInsights(result.data);
      } else {
        setError(result.error || "Failed to generate insights");
      }
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setLoading(false);
    }
  }

  const insightIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Insights
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={loadInsights}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Analyzing...
            </>
          ) : insights ? (
            "Refresh"
          ) : (
            <>
              <Sparkles className="mr-2 h-3 w-3" />
              Generate Insights
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!insights && !loading && !error && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click &quot;Generate Insights&quot; to get AI-powered analysis of
            your marketing performance.
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive text-center py-4">{error}</p>
        )}
        {insights && (
          <div className="space-y-3">
            {insights.map((insight: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                {insightIcon(insight.type)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {insight.description}
                  </p>
                </div>
                {insight.priority && (
                  <Badge variant="secondary" className="shrink-0">
                    {insight.priority}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
