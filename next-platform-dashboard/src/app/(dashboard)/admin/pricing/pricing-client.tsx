'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Mail,
  Globe,
  ArrowRight,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

type SyncType = 'domain' | 'email' | 'full';

interface SyncResult {
  success: boolean;
  syncType?: string;
  results?: {
    domain?: { domainsUpdated?: number };
    email?: { emailPackagesUpdated?: number };
  };
  error?: string;
  timestamp: string;
}

interface CacheStatus {
  configured: boolean;
  domain: {
    stale: boolean;
    lastSync?: {
      started_at: string;
      completed_at?: string;
      status: string;
      records_updated?: number;
    };
  };
  email: {
    stale: boolean;
    lastSync?: {
      started_at: string;
      completed_at?: string;
      status: string;
      records_updated?: number;
    };
  };
  timestamp: string;
}

export default function PricingManagementClient() {
  const [syncing, setSyncing] = useState<SyncType | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const fetchCacheStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const response = await fetch('/api/admin/pricing/refresh');
      if (response.ok) {
        const data = await response.json();
        setCacheStatus(data);
      }
    } catch {
      // Status fetch failed — not critical
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchCacheStatus();
  }, [fetchCacheStatus]);

  const handleSync = async (syncType: SyncType) => {
    setSyncing(syncType);
    setResult(null);

    try {
      const response = await fetch('/api/admin/pricing/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || `HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        setResult({ ...data, syncType, timestamp: new Date().toISOString() });
        // Refresh cache status after successful sync
        fetchCacheStatus();
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSyncing(null);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  const timeAgo = (dateString: string) => {
    try {
      const ms = Date.now() - new Date(dateString).getTime();
      const hours = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
      if (hours > 0) return `${hours}h ${mins}m ago`;
      return `${mins}m ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cache Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Domain Pricing Cache</CardTitle>
              </div>
              {loadingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : cacheStatus?.domain.stale ? (
                <Badge variant="destructive" className="text-xs">Stale</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Fresh</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {cacheStatus?.domain.lastSync ? (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Last sync</span>
                    <span>{formatTime(cacheStatus.domain.lastSync.started_at)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Status</span>
                    <span className="capitalize">{cacheStatus.domain.lastSync.status}</span>
                  </div>
                  {cacheStatus.domain.lastSync.records_updated != null && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Records</span>
                      <span>{cacheStatus.domain.lastSync.records_updated} TLDs</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Age</span>
                    <span>{timeAgo(cacheStatus.domain.lastSync.started_at)}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No sync data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Email Pricing Cache</CardTitle>
              </div>
              {loadingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : cacheStatus?.email.stale ? (
                <Badge variant="destructive" className="text-xs">Stale</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Fresh</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {cacheStatus?.email.lastSync ? (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Last sync</span>
                    <span>{formatTime(cacheStatus.email.lastSync.started_at)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Status</span>
                    <span className="capitalize">{cacheStatus.email.lastSync.status}</span>
                  </div>
                  {cacheStatus.email.lastSync.records_updated != null && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Records</span>
                      <span>{cacheStatus.email.lastSync.records_updated} packages</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Age</span>
                    <span>{timeAgo(cacheStatus.email.lastSync.started_at)}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No sync data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual Refresh</CardTitle>
          <CardDescription>
            Fetch the latest prices from ResellerClub. Use this after updating prices in
            your ResellerClub panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={() => handleSync('domain')}
              disabled={syncing !== null}
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
            >
              {syncing === 'domain' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Globe className="h-5 w-5" />
              )}
              <span className="font-medium text-sm">Domains</span>
              <span className="text-xs text-muted-foreground">All TLD prices</span>
            </Button>

            <Button
              onClick={() => handleSync('email')}
              disabled={syncing !== null}
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
            >
              {syncing === 'email' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Mail className="h-5 w-5" />
              )}
              <span className="font-medium text-sm">Email</span>
              <span className="text-xs text-muted-foreground">Titan email packages</span>
            </Button>

            <Button
              onClick={() => handleSync('full')}
              disabled={syncing !== null}
              className="h-auto py-4 flex-col gap-2"
            >
              {syncing === 'full' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Database className="h-5 w-5" />
              )}
              <span className="font-medium text-sm">Full Sync</span>
              <span className="text-xs text-muted-foreground">All pricing data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Result */}
      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {result.success ? 'Sync completed successfully' : 'Sync failed'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(result.timestamp)}
                </span>
              </div>

              {result.success && result.results && (
                <div className="flex gap-4 text-sm">
                  {result.results.domain && (
                    <span>{result.results.domain.domainsUpdated || 0} domain TLDs updated</span>
                  )}
                  {result.results.email && (
                    <span>{result.results.email.emailPackagesUpdated || 0} email packages updated</span>
                  )}
                </div>
              )}

              {result.error && (
                <p className="text-sm"><code>{result.error}</code></p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* How It Works + Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              How Pricing Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Customer Selling Prices</strong> — The retail
              prices from your ResellerClub panel (cost × (1 + your profit margin)).
              Fetched via <code>customer-price.json</code> — this is the source of truth for what
              end-customers pay.
            </p>
            <p>
              <strong className="text-foreground">Cost Prices</strong> — What you pay ResellerClub
              (wholesale). Used to calculate your profit margins.
            </p>
            <p>
              <strong className="text-foreground">Agency Markup</strong> — An optional additional markup
              applied on top of RC selling prices. Configured per-agency in their domain settings.
            </p>

            <Separator />

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Auto-sync schedule</span>
              </div>
              <Badge variant="outline" className="text-xs">Daily 02:00 UTC</Badge>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>Cache duration</span>
              </div>
              <Badge variant="outline" className="text-xs">24 hours</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              Related Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/dashboard/domains/settings/pricing"
              className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Agency Domain Settings</p>
                <p className="text-xs text-muted-foreground">
                  Configure agency-level markup rates and TLD-specific pricing
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/dashboard/domains"
              className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Domain Search</p>
                <p className="text-xs text-muted-foreground">
                  Search and register domains with live pricing
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/dashboard/email"
              className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Business Email</p>
                <p className="text-xs text-muted-foreground">
                  Manage Titan business email accounts
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            {!cacheStatus?.configured && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  ResellerClub is not configured. Set <code>RESELLERCLUB_RESELLER_ID</code> and{' '}
                  <code>RESELLERCLUB_API_KEY</code> in your environment variables.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
