"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Globe, MapPin, Flag } from "lucide-react";
import type { GeoAnalytics } from "@/types/site-analytics";
import { formatNumber, formatPercentage } from "./site-analytics-metrics";

// Country flag emoji helper (simplified)
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface GeoBreakdownProps {
  geoData: GeoAnalytics[];
  loading?: boolean;
  className?: string;
  limit?: number;
  showPercentage?: boolean;
}

export function GeoBreakdown({
  geoData,
  loading = false,
  className,
  limit = 10,
  showPercentage = true,
}: GeoBreakdownProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Geographic Distribution</CardTitle>
          <CardDescription>Visitor locations by country</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...geoData]
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, limit);

  const totalVisitors = geoData.reduce((sum, g) => sum + g.visitors, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Geographic Distribution
        </CardTitle>
        <CardDescription>Visitor locations by country</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map((geo, index) => {
            const percentage = totalVisitors > 0 
              ? (geo.visitors / totalVisitors) * 100 
              : 0;
            return (
              <div key={`${geo.country}-${geo.region || index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">
                      {getCountryFlag(geo.countryCode)}
                    </span>
                    <div>
                      <span className="font-medium">{geo.country}</span>
                      {geo.region && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({geo.region})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(geo.visitors)}</span>
                    {showPercentage && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatPercentage(percentage)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {geoData.length > limit && (
          <div className="mt-4 text-center">
            <span className="text-sm text-muted-foreground">
              +{geoData.length - limit} more countries
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GeoMapPlaceholderProps {
  geoData: GeoAnalytics[];
  loading?: boolean;
  className?: string;
}

export function GeoMapPlaceholder({
  geoData,
  loading = false,
  className,
}: GeoMapPlaceholderProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">World Map</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const totalVisitors = geoData.reduce((sum, g) => sum + g.visitors, 0);
  const topCountries = geoData
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 3);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Visitor Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[300px] rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Globe className="h-16 w-16 mx-auto text-muted-foreground/40" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Interactive map visualization
              </p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(totalVisitors)} visitors from {geoData.length} countries
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              {topCountries.map((geo) => (
                <div key={geo.countryCode} className="flex items-center gap-1">
                  <span>{getCountryFlag(geo.countryCode)}</span>
                  <span className="text-xs">{geo.countryCode}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface GeoStatsCardProps {
  geoData: GeoAnalytics[];
  loading?: boolean;
  className?: string;
}

export function GeoStatsCard({
  geoData,
  loading = false,
  className,
}: GeoStatsCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="h-4 w-20 mt-2" />
        </CardContent>
      </Card>
    );
  }

  const uniqueCountries = new Set(geoData.map((g) => g.countryCode)).size;
  const totalVisitors = geoData.reduce((sum, g) => sum + g.visitors, 0);
  const topCountry = geoData.sort((a, b) => b.visitors - a.visitors)[0];

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{uniqueCountries}</p>
            <p className="text-sm text-muted-foreground">Countries</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="h-6 w-6 text-primary" />
          </div>
        </div>
        {topCountry && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">Top Country</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{getCountryFlag(topCountry.countryCode)}</span>
              <span className="font-medium">{topCountry.country}</span>
              <span className="text-xs text-muted-foreground">
                ({formatPercentage((topCountry.visitors / totalVisitors) * 100)})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GeoCompactListProps {
  geoData: GeoAnalytics[];
  className?: string;
  limit?: number;
}

export function GeoCompactList({
  geoData,
  className,
  limit = 5,
}: GeoCompactListProps) {
  const totalVisitors = geoData.reduce((sum, g) => sum + g.visitors, 0);
  const sortedData = [...geoData]
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, limit);

  return (
    <div className={cn("space-y-2", className)}>
      {sortedData.map((geo) => (
        <div
          key={geo.countryCode}
          className="flex items-center justify-between py-1"
        >
          <div className="flex items-center gap-2">
            <span>{getCountryFlag(geo.countryCode)}</span>
            <span className="text-sm">{geo.country}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatPercentage((geo.visitors / totalVisitors) * 100)}
          </span>
        </div>
      ))}
    </div>
  );
}
