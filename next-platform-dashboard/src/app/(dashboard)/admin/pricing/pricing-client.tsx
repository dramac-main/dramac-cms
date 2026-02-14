'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Database, Mail, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function PricingManagementClient() {
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
      
      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || `HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        setResult({ ...data, syncType, timestamp: new Date().toISOString() });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Pricing Refresh</CardTitle>
          <CardDescription>
            Refresh pricing cache from ResellerClub. This fetches the latest customer 
            pricing (retail) and cost pricing (wholesale) for all TLDs and email packages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleSync('domain')}
              disabled={syncing}
              className="h-32 flex-col gap-3"
              variant="outline"
            >
              <Globe className={`h-8 w-8 ${syncing ? 'animate-spin' : ''}`} />
              <div className="text-center">
                <div className="font-semibold text-base">Domain Pricing</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Refresh all TLD prices
                </div>
              </div>
            </Button>

            <Button
              onClick={() => handleSync('email')}
              disabled={syncing}
              className="h-32 flex-col gap-3"
              variant="outline"
            >
              <Mail className={`h-8 w-8 ${syncing ? 'animate-spin' : ''}`} />
              <div className="text-center">
                <div className="font-semibold text-base">Email Pricing</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Refresh Titan email prices
                </div>
              </div>
            </Button>

            <Button
              onClick={() => handleSync('full')}
              disabled={syncing}
              className="h-32 flex-col gap-3"
            >
              <Database className={`h-8 w-8 ${syncing ? 'animate-spin' : ''}`} />
              <div className="text-center">
                <div className="font-semibold text-base">Full Sync</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Refresh all pricing data
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          <div className="flex items-start gap-4">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-semibold">
                  {result.success ? 'Sync Completed' : 'Sync Failed'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>

              {result.success && result.results && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-3">
                  <div className="p-3 bg-background rounded-md border">
                    <div className="text-muted-foreground">Sync Type</div>
                    <div className="font-semibold capitalize">{result.syncType}</div>
                  </div>
                  {result.results.domain && (
                    <div className="p-3 bg-background rounded-md border">
                      <div className="text-muted-foreground">Domains Updated</div>
                      <div className="font-semibold">{result.results.domain.domainsUpdated || 0}</div>
                    </div>
                  )}
                  {result.results.email && (
                    <div className="p-3 bg-background rounded-md border">
                      <div className="text-muted-foreground">Email Packages</div>
                      <div className="font-semibold">{result.results.email.emailPackagesUpdated || 0}</div>
                    </div>
                  )}
                </div>
              )}

              {result.error && (
                <AlertDescription className="mt-2">
                  <code className="text-sm">{result.error}</code>
                </AlertDescription>
              )}
            </div>
          </div>
        </Alert>
      )}

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How Pricing Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Customer Pricing (Retail)</h4>
              <p className="text-muted-foreground">
                The prices you've set in your ResellerClub control panel. This includes 
                your markup and is what your customers see.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Cost Pricing (Wholesale)</h4>
              <p className="text-muted-foreground">
                The actual cost you pay to ResellerClub. Used to calculate your profit margins.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Agency Markups</h4>
              <p className="text-muted-foreground">
                Agency-specific markups configured in Settings → Domains are applied on top 
                of the cached customer pricing.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cache & Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Cache Duration</h4>
              <p className="text-muted-foreground">
                Pricing is cached for 24 hours to reduce API calls. Use manual refresh 
                if you've updated prices in ResellerClub.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Automatic Sync</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Daily 02:00 UTC</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
