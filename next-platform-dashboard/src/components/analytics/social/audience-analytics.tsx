"use client";

/**
 * Audience Analytics Components
 * 
 * PHASE-DS-03B: Social Analytics Dashboard
 * Components for audience growth and demographics
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_LOCALE } from '@/lib/locale-config'
import {
  Users,
  UserPlus,
  UserMinus,
  TrendingUp,
  TrendingDown,
  Globe,
  Languages,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import type { 
  AudienceGrowth, 
  AudienceDemographics, 
  AudienceActivity,
  HeatmapData,
  OptimalTime,
} from "@/types/social-analytics";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

// ============================================================================
// AUDIENCE GROWTH CHART
// ============================================================================

export function AudienceGrowthChart({ data }: { data: AudienceGrowth[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audience Growth</CardTitle>
        <CardDescription>Follower count over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString(DEFAULT_LOCALE, { month: "short", day: "numeric" })}
                className="text-xs"
              />
              <YAxis tickFormatter={formatNumber} className="text-xs" />
              <Tooltip 
                formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="followers" 
                name="Total Followers"
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FOLLOWER GAIN/LOSS CHART
// ============================================================================

export function FollowerGainLossChart({ data }: { data: AudienceGrowth[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Followers Gained vs Lost</CardTitle>
        <CardDescription>Daily follower changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString(DEFAULT_LOCALE, { month: "short", day: "numeric" })}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Bar dataKey="gained" name="Gained" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lost" name="Lost" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Line 
                type="monotone" 
                dataKey="netGrowth" 
                name="Net Growth"
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// AUDIENCE GROWTH STATS
// ============================================================================

export function AudienceGrowthStats({ data }: { data: AudienceGrowth[] }) {
  const latest = data[data.length - 1];
  const first = data[0];
  const totalGained = data.reduce((sum, d) => sum + d.gained, 0);
  const totalLost = data.reduce((sum, d) => sum + d.lost, 0);
  const netGrowth = totalGained - totalLost;
  const growthRate = first.followers > 0 
    ? ((latest.followers - first.followers) / first.followers * 100).toFixed(1)
    : "0";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Current Followers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(latest.followers)}</div>
          <span className="text-xs text-muted-foreground">Total audience</span>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Followers Gained</CardTitle>
          <UserPlus className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">+{formatNumber(totalGained)}</div>
          <span className="text-xs text-muted-foreground">This period</span>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Followers Lost</CardTitle>
          <UserMinus className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">-{formatNumber(totalLost)}</div>
          <span className="text-xs text-muted-foreground">This period</span>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Growth Rate</CardTitle>
          {parseFloat(growthRate) >= 0 
            ? <TrendingUp className="h-4 w-4 text-green-500" />
            : <TrendingDown className="h-4 w-4 text-red-500" />
          }
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${parseFloat(growthRate) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {parseFloat(growthRate) >= 0 ? "+" : ""}{growthRate}%
          </div>
          <span className="text-xs text-muted-foreground">Period over period</span>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// AGE DEMOGRAPHICS
// ============================================================================

export function AgeDemographicsChart({ data }: { data: AudienceDemographics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Age Distribution</CardTitle>
        <CardDescription>Your audience by age group</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.ageGroups} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="range" width={50} />
              <Tooltip formatter={(value) => `${typeof value === 'number' ? value : 0}%`} />
              <Bar dataKey="percentage" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// GENDER DEMOGRAPHICS
// ============================================================================

export function GenderDemographicsChart({ data }: { data: AudienceDemographics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gender Distribution</CardTitle>
        <CardDescription>Your audience by gender</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.genders}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="percentage"
                label={({ percent, name }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.genders.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${typeof value === 'number' ? value : 0}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TOP LOCATIONS
// ============================================================================

export function TopLocationsChart({ data }: { data: AudienceDemographics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Top Locations
        </CardTitle>
        <CardDescription>Where your audience is located</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.topLocations.map((location, index) => (
            <div key={location.location} className="flex items-center gap-4">
              <Badge variant={index < 3 ? "default" : "outline"}>
                #{index + 1}
              </Badge>
              <span className="font-medium flex-1">{location.location}</span>
              <span className="text-sm text-muted-foreground">{formatNumber(location.count)}</span>
              <span className="text-sm font-bold">{location.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TOP LANGUAGES
// ============================================================================

export function TopLanguagesChart({ data }: { data: AudienceDemographics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Top Languages
        </CardTitle>
        <CardDescription>Languages your audience speaks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.topLanguages.map((language, index) => (
            <div key={language.language} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{language.language}</span>
                <span className="font-bold">{language.percentage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${language.percentage}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ACTIVITY HEATMAP
// ============================================================================

export function ActivityHeatmap({ data }: { data: HeatmapData[] }) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Group by day
  const groupedData = dayNames.map((_, dayIndex) => 
    data.filter(d => d.dayOfWeek === dayIndex)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audience Activity</CardTitle>
        <CardDescription>When your audience is most active</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour header */}
            <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 mb-2">
              <div />
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="text-xs text-center text-muted-foreground">
                  {i.toString().padStart(2, "0")}
                </div>
              ))}
            </div>
            
            {/* Days */}
            {groupedData.map((dayData, dayIndex) => (
              <div key={dayIndex} className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 mb-1">
                <div className="text-xs font-medium flex items-center">{dayNames[dayIndex]}</div>
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = dayData.find(d => d.hour === hour);
                  const value = cell?.value || 0;
                  const opacity = value / 100;
                  
                  return (
                    <div
                      key={hour}
                      className="aspect-square rounded-sm cursor-pointer transition-all hover:scale-110"
                      style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                      title={`${dayNames[dayIndex]} ${hour}:00 - ${value}% activity`}
                    />
                  );
                })}
              </div>
            ))}
            
            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
                  <div
                    key={opacity}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// OPTIMAL POSTING TIMES
// ============================================================================

export function OptimalTimesChart({ data }: { data: OptimalTime[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Times to Post</CardTitle>
        <CardDescription>Optimal posting times based on engagement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 5).map((time, index) => (
            <div 
              key={`${time.dayOfWeek}-${time.hour}`}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Badge variant={index === 0 ? "default" : "secondary"}>
                  #{index + 1}
                </Badge>
                <div>
                  <p className="font-medium">{time.dayName}</p>
                  <p className="text-sm text-muted-foreground">{time.timeLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${time.score}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{time.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// AUDIENCE SUMMARY COMPACT
// ============================================================================

export function AudienceSummaryCompact({ growth, demographics }: { 
  growth: AudienceGrowth[];
  demographics: AudienceDemographics;
}) {
  const latest = growth[growth.length - 1];
  const topLocation = demographics.topLocations[0];
  const topAge = demographics.ageGroups.reduce((a, b) => a.percentage > b.percentage ? a : b);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Audience Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-bold text-lg">{formatNumber(latest.followers)}</div>
            <div className="text-xs text-muted-foreground">Total Followers</div>
          </div>
          <div>
            <div className="font-bold text-lg">{topAge.range}</div>
            <div className="text-xs text-muted-foreground">Top Age Group</div>
          </div>
          <div>
            <div className="font-bold text-lg">{topLocation?.location || "N/A"}</div>
            <div className="text-xs text-muted-foreground">Top Location</div>
          </div>
          <div>
            <div className="font-bold text-lg text-green-600">+{formatNumber(latest.netGrowth)}</div>
            <div className="text-xs text-muted-foreground">Net Growth</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
