/**
 * Marketing Hub Client Component
 * Phase MKT-05: Marketing Hub Dashboard
 *
 * Client component rendering stats, quick actions, recent campaigns,
 * active sequences, and engagement overview.
 *
 * Production-ready: proper types, accessible, responsive, empty states with CTAs.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Users,
  TrendingUp,
  TrendingDown,
  Send,
  Eye,
  MousePointerClick,
  Zap,
  ArrowRight,
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
  Plus,
  Palette,
  Target,
  Rocket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CAMPAIGN_STATUS_CONFIG,
  SEQUENCE_STATUS_LABELS,
} from "../../lib/marketing-constants";
import type { CampaignStatus, SequenceStatus } from "../../types";

// ============================================================================
// TYPES
// ============================================================================

interface HubStats {
  totalCampaigns: number;
  totalSequences: number;
  activeSubscribers: number;
  totalEmailsSent: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface HubCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
  subject_line?: string | null;
  type?: string;
  total_sent?: number;
  total_opened?: number;
  created_at?: string;
}

interface HubSequence {
  id: string;
  name: string;
  status: SequenceStatus;
  total_enrolled?: number;
  total_completed?: number;
  steps?: unknown[];
}

interface MarketingHubClientProps {
  siteId: string;
  data: {
    stats: HubStats;
    recentCampaigns: HubCampaign[];
    activeSequences: HubSequence[];
  };
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-md bg-primary/10 p-1.5">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center gap-1.5 mt-1">
          {trend && trend !== "neutral" && (
            <span
              className={`inline-flex items-center text-xs font-medium ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              )}
              {trendLabel}
            </span>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// QUICK ACTION CARD
// ============================================================================

function QuickActionCard({
  href,
  icon: Icon,
  label,
  sublabel,
  count,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  sublabel: string;
  count?: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {count || sublabel}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// MAIN HUB CLIENT
// ============================================================================

export function MarketingHubClient({ siteId, data }: MarketingHubClientProps) {
  const { stats, recentCampaigns, activeSequences } = data;
  const basePath = `/dashboard/sites/${siteId}/marketing`;
  const isNewUser =
    stats.totalCampaigns === 0 &&
    stats.totalSequences === 0 &&
    stats.activeSubscribers === 0;

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing Hub</h1>
          <p className="text-sm text-muted-foreground">
            Manage campaigns, sequences, and subscriber engagement
          </p>
        </div>
        {!isNewUser && (
          <div className="flex items-center gap-2">
            <Link href={`${basePath}/campaigns/new`}>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Campaign</span>
                <span className="sm:hidden">Campaign</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Getting Started - shown for new users */}
      {isNewUser && (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center text-center py-10 px-6">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">
              Welcome to Marketing Hub
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Create your first email campaign, build subscriber lists, and
              automate engagement with drip sequences. Start by adding
              subscribers or creating a campaign.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={`${basePath}/subscribers`}>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Add Subscribers
                </Button>
              </Link>
              <Link href={`${basePath}/campaigns/new`}>
                <Button className="gap-2">
                  <Mail className="h-4 w-4" />
                  Create First Campaign
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Active Subscribers"
          value={stats.activeSubscribers.toLocaleString()}
          subtitle="Opted-in contacts"
          icon={Users}
        />
        <StatCard
          title="Emails Sent"
          value={stats.totalEmailsSent.toLocaleString()}
          subtitle={`Across ${stats.totalCampaigns} campaigns`}
          icon={Send}
        />
        <StatCard
          title="Open Rate"
          value={`${stats.openRate}%`}
          subtitle="Of delivered emails"
          icon={Eye}
          trend={
            stats.openRate >= 20
              ? "up"
              : stats.openRate > 0
                ? "down"
                : "neutral"
          }
          trendLabel={
            stats.openRate >= 20
              ? "Good"
              : stats.openRate > 0
                ? "Below avg"
                : undefined
          }
        />
        <StatCard
          title="Click Rate"
          value={`${stats.clickRate}%`}
          subtitle="Of opened emails"
          icon={MousePointerClick}
          trend={
            stats.clickRate >= 3
              ? "up"
              : stats.clickRate > 0
                ? "down"
                : "neutral"
          }
          trendLabel={
            stats.clickRate >= 3
              ? "Good"
              : stats.clickRate > 0
                ? "Below avg"
                : undefined
          }
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <QuickActionCard
            href={`${basePath}/campaigns`}
            icon={Mail}
            label="Campaigns"
            sublabel="Email marketing"
            count={stats.totalCampaigns > 0 ? `${stats.totalCampaigns} campaigns` : undefined}
          />
          <QuickActionCard
            href={`${basePath}/sequences`}
            icon={Zap}
            label="Sequences"
            sublabel="Drip automation"
            count={stats.totalSequences > 0 ? `${stats.totalSequences} sequences` : undefined}
          />
          <QuickActionCard
            href={`${basePath}/subscribers`}
            icon={Users}
            label="Subscribers"
            sublabel="Contact lists"
            count={stats.activeSubscribers > 0 ? `${stats.activeSubscribers} active` : undefined}
          />
          <QuickActionCard
            href={`${basePath}/landing-pages`}
            icon={FileText}
            label="Landing Pages"
            sublabel="Lead capture"
          />
          <QuickActionCard
            href={`${basePath}/forms`}
            icon={FormInput}
            label="Opt-In Forms"
            sublabel="Embed & popup"
          />
          <QuickActionCard
            href={`${basePath}/templates`}
            icon={Palette}
            label="Templates"
            sublabel="Email library"
          />
          <QuickActionCard
            href={`${basePath}/social`}
            icon={Share2}
            label="Social Media"
            sublabel="Multi-platform"
          />
          <QuickActionCard
            href={`${basePath}/calendar`}
            icon={CalendarDays}
            label="Calendar"
            sublabel="Plan & schedule"
          />
          <QuickActionCard
            href={`${basePath}/sms`}
            icon={MessageSquare}
            label="SMS"
            sublabel="Text campaigns"
          />
          <QuickActionCard
            href={`${basePath}/campaigns/new`}
            icon={Target}
            label="Create Campaign"
            sublabel="Start now"
          />
        </div>
      </div>

      {/* Recent Campaigns + Active Sequences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Recent Campaigns</CardTitle>
              <CardDescription className="text-xs">
                Latest email campaigns
              </CardDescription>
            </div>
            {recentCampaigns.length > 0 && (
              <Link href={`${basePath}/campaigns`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8">
                <Mail className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No campaigns yet
                </p>
                <p className="text-xs text-muted-foreground/80 mb-4 max-w-[200px]">
                  Create your first email campaign to start engaging subscribers
                </p>
                <Link href={`${basePath}/campaigns/new`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Create Campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <TooltipProvider>
                <div className="space-y-2">
                  {recentCampaigns.map((campaign) => {
                    const status = campaign.status || "draft";
                    const config = CAMPAIGN_STATUS_CONFIG[status];
                    return (
                      <Link
                        key={campaign.id}
                        href={`${basePath}/campaigns/${campaign.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm font-medium truncate">
                                {campaign.name}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start">
                              {campaign.name}
                            </TooltipContent>
                          </Tooltip>
                          <p className="text-xs text-muted-foreground truncate">
                            {campaign.subject_line || "No subject line"}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`shrink-0 text-xs ${config?.bgColor || ""} ${config?.color || ""}`}
                        >
                          {config?.label || status}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>

        {/* Active Sequences */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Active Sequences</CardTitle>
              <CardDescription className="text-xs">
                Running drip automations
              </CardDescription>
            </div>
            {activeSequences.length > 0 && (
              <Link href={`${basePath}/sequences`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {activeSequences.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8">
                <Zap className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No active sequences
                </p>
                <p className="text-xs text-muted-foreground/80 mb-4 max-w-[200px]">
                  Create a drip sequence to automate subscriber engagement
                </p>
                <Link href={`${basePath}/sequences/new`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Create Sequence
                  </Button>
                </Link>
              </div>
            ) : (
              <TooltipProvider>
                <div className="space-y-2">
                  {activeSequences.map((seq) => {
                    const status = seq.status || "draft";
                    const enrolled = seq.total_enrolled || 0;
                    const completed = seq.total_completed || 0;
                    const progress =
                      enrolled > 0
                        ? Math.round((completed / enrolled) * 100)
                        : 0;
                    const stepCount = Array.isArray(seq.steps)
                      ? seq.steps.length
                      : 0;
                    return (
                      <Link
                        key={seq.id}
                        href={`${basePath}/sequences/${seq.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm font-medium truncate">
                                {seq.name}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start">
                              {seq.name}
                            </TooltipContent>
                          </Tooltip>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {enrolled} enrolled
                            </span>
                            {enrolled > 0 && (
                              <Progress
                                value={progress}
                                className="h-1.5 w-16"
                              />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {completed} done
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {stepCount} {stepCount === 1 ? "step" : "steps"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 border-green-300"
                          >
                            {SEQUENCE_STATUS_LABELS[status] || status}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Overview
          </CardTitle>
          <CardDescription className="text-xs">
            Aggregate metrics from your recent campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.totalEmailsSent === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Send your first campaign to see performance metrics here.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {stats.openRate}%
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Avg. Open Rate
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {stats.openRate >= 20 ? "Above" : "Below"} industry avg (20%)
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {stats.clickRate}%
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Avg. Click Rate
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {stats.clickRate >= 3 ? "Above" : "Below"} industry avg (3%)
                </p>
              </div>
              <div className="text-center">
                <p
                  className={`text-2xl sm:text-3xl font-bold ${
                    stats.bounceRate > 5
                      ? "text-red-600"
                      : stats.bounceRate > 2
                        ? "text-amber-600"
                        : "text-green-600"
                  }`}
                >
                  {stats.bounceRate}%
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Bounce Rate
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {stats.bounceRate <= 2 ? "Healthy" : stats.bounceRate <= 5 ? "Monitor" : "Action needed"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Marketing Insights */}
      <AIInsightsSection siteId={siteId} stats={stats} />
    </div>
  );
}

// ============================================================================
// AI INSIGHTS SECTION
// ============================================================================

interface MarketingInsight {
  title: string;
  description: string;
  type: "positive" | "warning" | "suggestion";
  priority?: string;
}

function AIInsightsSection({
  siteId,
  stats,
}: {
  siteId: string;
  stats: HubStats;
}) {
  const [insights, setInsights] = useState<MarketingInsight[] | null>(null);
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
        setInsights(result.data as MarketingInsight[]);
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
        return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" aria-label="Positive insight" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" aria-label="Warning" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-500 shrink-0" aria-label="Suggestion" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Insights
          </CardTitle>
          <CardDescription className="text-xs">
            AI-powered analysis of your marketing performance
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadInsights}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="hidden sm:inline">Analyzing...</span>
            </>
          ) : insights ? (
            "Refresh"
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">Generate Insights</span>
              <span className="sm:hidden">Analyze</span>
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!insights && !loading && !error && (
          <div className="flex flex-col items-center text-center py-6">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Get AI-powered analysis of your marketing performance
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Recommendations based on your campaign metrics and subscriber data
            </p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center text-center py-4 gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive/60" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={loadInsights}>
              Try Again
            </Button>
          </div>
        )}
        {insights && (
          <div className="space-y-2">
            {insights.map((insight, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
              >
                {insightIcon(insight.type)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {insight.description}
                  </p>
                </div>
                {insight.priority && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
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
