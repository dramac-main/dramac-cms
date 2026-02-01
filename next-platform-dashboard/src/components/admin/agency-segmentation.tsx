/**
 * Agency Segmentation Component
 * 
 * PHASE-DS-04B: Admin Dashboard - Agency Metrics
 * 
 * Visualizations for agency distribution by plan, size, industry, and region.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Globe,
  Users,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Treemap,
} from "recharts";
import { getAgencySegmentation } from "@/lib/actions/admin-analytics";
import type { AgencySegmentation, AdminTimeRange } from "@/types/admin-analytics";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// Types
// ============================================================================

interface AgencySegmentationProps {
  timeRange?: AdminTimeRange;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PLAN_COLORS = {
  starter: "#3b82f6",
  professional: "#8b5cf6",
  enterprise: "#22c55e",
  trial: "#f59e0b",
  free: "#6b7280",
};

const SIZE_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b"];
const INDUSTRY_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];
const REGION_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444"];

// ============================================================================
// Helper Components
// ============================================================================

function SegmentCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ProgressBar({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Charts
// ============================================================================

function PlanDistributionPie({ data }: { data: AgencySegmentation["byPlan"] }) {
  const chartData = data.map((item) => ({
    name: item.plan.charAt(0).toUpperCase() + item.plan.slice(1),
    value: item.count,
    percentage: item.percentage,
    color: PLAN_COLORS[item.plan as keyof typeof PLAN_COLORS] || "#6b7280",
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.value.toLocaleString()} ({data.percentage.toFixed(1)}%)
                  </p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function SizeDistributionChart({ data }: { data: AgencySegmentation["bySize"] }) {
  const chartData = data.map((item, index) => ({
    name: item.size,
    agencies: item.count,
    color: SIZE_COLORS[index % SIZE_COLORS.length],
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.agencies.toLocaleString()} agencies
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="agencies" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function IndustryChart({ data }: { data: AgencySegmentation["byIndustry"] }) {
  const chartData = data.slice(0, 8).map((item, index) => ({
    name: item.industry,
    value: item.count,
    color: INDUSTRY_COLORS[index % INDUSTRY_COLORS.length],
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.value.toLocaleString()} agencies
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RegionChart({ data }: { data: AgencySegmentation["byRegion"] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      {data.slice(0, 5).map((item, index) => (
        <ProgressBar
          key={item.region}
          label={item.region}
          value={item.count}
          percentage={item.percentage}
          color={REGION_COLORS[index % REGION_COLORS.length]}
        />
      ))}
      {data.length > 5 && (
        <div className="text-sm text-muted-foreground text-center">
          +{data.length - 5} more regions
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function SegmentationSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-[320px]" />
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AgencySegmentationComponent({
  timeRange = "12m",
  className,
}: AgencySegmentationProps) {
  const [data, setData] = useState<AgencySegmentation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const segmentationData = await getAgencySegmentation(timeRange);
        setData(segmentationData);
      } catch (error) {
        console.error("Failed to fetch agency segmentation:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading || !data) {
    return <SegmentationSkeleton />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <SegmentCard title="By Subscription Plan" icon={Briefcase}>
          <PlanDistributionPie data={data.byPlan} />
        </SegmentCard>

        {/* Size Distribution */}
        <SegmentCard title="By Agency Size" icon={Users}>
          <SizeDistributionChart data={data.bySize} />
        </SegmentCard>

        {/* Industry Distribution */}
        <SegmentCard title="By Industry" icon={Building2}>
          <IndustryChart data={data.byIndustry} />
        </SegmentCard>

        {/* Region Distribution */}
        <SegmentCard title="By Region" icon={Globe}>
          <RegionChart data={data.byRegion} />
        </SegmentCard>
      </div>

      {/* Detailed Breakdown Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Segmentation</CardTitle>
          <CardDescription>Comprehensive breakdown of agency distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="plan">
            <TabsList>
              <TabsTrigger value="plan">Plans</TabsTrigger>
              <TabsTrigger value="size">Size</TabsTrigger>
              <TabsTrigger value="industry">Industry</TabsTrigger>
              <TabsTrigger value="region">Region</TabsTrigger>
            </TabsList>

            <TabsContent value="plan" className="pt-4">
              <div className="space-y-2">
                {data.byPlan.map((item) => (
                  <div
                    key={item.plan}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PLAN_COLORS[item.plan as keyof typeof PLAN_COLORS] || "#6b7280" }}
                      />
                      <span className="font-medium capitalize">{item.plan}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{item.count.toLocaleString()} agencies</span>
                      <Badge variant="secondary">{item.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="size" className="pt-4">
              <div className="space-y-2">
                {data.bySize.map((item, index) => (
                  <div
                    key={item.size}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: SIZE_COLORS[index % SIZE_COLORS.length] }}
                      />
                      <span className="font-medium">{item.size}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{item.count.toLocaleString()} agencies</span>
                      <Badge variant="secondary">{item.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="industry" className="pt-4">
              <div className="space-y-2">
                {data.byIndustry.map((item, index) => (
                  <div
                    key={item.industry}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: INDUSTRY_COLORS[index % INDUSTRY_COLORS.length] }}
                      />
                      <span className="font-medium">{item.industry}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{item.count.toLocaleString()} agencies</span>
                      <Badge variant="secondary">{item.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="region" className="pt-4">
              <div className="space-y-2">
                {data.byRegion.map((item, index) => (
                  <div
                    key={item.region}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: REGION_COLORS[index % REGION_COLORS.length] }}
                      />
                      <span className="font-medium">{item.region}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{item.count.toLocaleString()} agencies</span>
                      <Badge variant="secondary">{item.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Compact Version for Dashboard
// ============================================================================

export function AgencySegmentationCompact({
  timeRange = "12m",
  className,
}: AgencySegmentationProps) {
  const [data, setData] = useState<AgencySegmentation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const segmentationData = await getAgencySegmentation(timeRange);
        setData(segmentationData);
      } catch (error) {
        console.error("Failed to fetch agency segmentation:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading || !data) {
    return <Skeleton className="h-[200px]" />;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Agency Segments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Top Plans</p>
            <div className="flex gap-2 flex-wrap">
              {data.byPlan.slice(0, 3).map((item) => (
                <Badge
                  key={item.plan}
                  variant="secondary"
                  className="capitalize"
                >
                  {item.plan}: {item.count}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Top Industries</p>
            <div className="flex gap-2 flex-wrap">
              {data.byIndustry.slice(0, 3).map((item) => (
                <Badge
                  key={item.industry}
                  variant="outline"
                >
                  {item.industry}: {item.count}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AgencySegmentationComponent;
