'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

type SyncType = 'domain' | 'email' | 'full';

interface SyncResult {
  success: boolean;
  syncType: string;
  domainsUpdated?: number;
  emailPackagesUpdated?: number;
  duration?: string;
  error?: string;
  timestamp: string;
}

export default function AdminPricingPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = async (syncType: SyncType) => {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/pricing/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType }),
      });

      const data = await response.json();
      setResult({ ...data, timestamp: new Date().toISOString() });
    } catch (error) {
      setResult({
        success: false,
        syncType,
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">ResellerClub Pricing Management</h1>
        <p className="text-muted-foreground mt-2">
          Manually refresh domain and email pricing from ResellerClub API. 
          Pricing is also automatically synced daily at 02:00 UTC.
        </p>
      </div>

      {/* Sync Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Manual Pricing Refresh</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Refresh pricing cache from ResellerClub. This fetches the latest customer 
          pricing (retail) and cost pricing (wholesale) for all TLDs and email packages.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => handleSync('domain')}
            disabled={syncing}
            className="h-24 flex-col gap-2"
            variant="outline"
          >
            <RefreshCw className={`h-6 w-6 ${syncing ? 'animate-spin' : ''}`} />
            <div className="text-center">
              <div className="font-semibold">Domain Pricing</div>
              <div className="text-xs text-muted-foreground">
                Refresh all TLD prices
              </div>
            </div>
          </Button>

          <Button
            onClick={() => handleSync('email')}
            disabled={syncing}
            className="h-24 flex-col gap-2"
            variant="outline"
          >
            <RefreshCw className={`h-6 w-6 ${syncing ? 'animate-spin' : ''}`} />
            <div className="text-center">
              <div className="font-semibold">Email Pricing</div>
              <div className="text-xs text-muted-foreground">
                Refresh Titan email prices
              </div>
            </div>
          </Button>

          <Button
            onClick={() => handleSync('full')}
            disabled={syncing}
            className="h-24 flex-col gap-2"
          >
            <RefreshCw className={`h-6 w-6 ${syncing ? 'animate-spin' : ''}`} />
            <div className="text-center">
              <div className="font-semibold">Full Sync</div>
              <div className="text-xs text-muted-foreground">
                Refresh all pricing data
              </div>
            </div>
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <Card className={`p-6 ${result.success ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-start gap-4">
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
            )}
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {result.success ? 'Sync Completed' : 'Sync Failed'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>

              {result.success && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-muted-foreground">Sync Type</div>
                    <div className="font-semibold capitalize">{result.syncType}</div>
                  </div>
                  {result.domainsUpdated !== undefined && (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="text-muted-foreground">Domains Updated</div>
                      <div className="font-semibold">{result.domainsUpdated}</div>
                    </div>
                  )}
                  {result.emailPackagesUpdated !== undefined && (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="text-muted-foreground">Email Packages</div>
                      <div className="font-semibold">{result.emailPackagesUpdated}</div>
                    </div>
                  )}
                  {result.duration && (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="text-muted-foreground">Duration</div>
                      <div className="font-semibold">{result.duration}</div>
                    </div>
                  )}
                </div>
              )}

              {result.error && (
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                    {result.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">How Pricing Works</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Customer Pricing (Retail)</h3>
            <p className="text-muted-foreground">
              The prices you've set in your ResellerClub control panel. This includes 
              your markup and is what your customers see.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Cost Pricing (Wholesale)</h3>
            <p className="text-muted-foreground">
              The actual cost you pay to ResellerClub. Used to calculate your profit margins.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Cache Duration</h3>
            <p className="text-muted-foreground">
              Pricing is cached for 24 hours to reduce API calls. Automatic refresh runs 
              daily at 02:00 UTC. Use manual refresh if you've updated prices in ResellerClub.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Agency Markups</h3>
            <p className="text-muted-foreground">
              Agency-specific markups configured in Settings → Domains are applied on top 
              of the cached customer pricing.
            </p>
          </div>
        </div>
      </Card>

      {/* Status Indicator */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Automatic Sync Status</h3>
            <p className="text-sm text-muted-foreground">
              Next scheduled sync: Daily at 02:00 UTC
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
