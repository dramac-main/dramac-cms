/**
 * Paddle Subscription Card Component
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * Displays current subscription details from Paddle:
 * - Plan name and price
 * - Status (active, past_due, paused, etc.)
 * - Billing period
 * - Management actions (change plan, update payment, pause, cancel)
 * 
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  CreditCard, 
  Calendar, 
  ArrowUpRight,
  Pause,
  Play,
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SubscriptionData {
  id: string;
  planType: string;
  billingCycle: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  unitPrice: number;
  currency: string;
}

interface PaddleSubscriptionCardProps {
  agencyId: string;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PaddleSubscriptionCard({ agencyId, className }: PaddleSubscriptionCardProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchSubscription();
  }, [agencyId]);
  
  async function fetchSubscription() {
    try {
      const res = await fetch('/api/billing/paddle/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription || data);
        setError(null);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to load subscription');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/billing/paddle/subscription/${action}`, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${action} subscription`);
      }
      await fetchSubscription();
    } catch (err) {
      console.error(`Error ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
  }
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Current Subscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold capitalize">
                  {subscription.planType} Plan
                </p>
                <p className="text-muted-foreground">
                  ${(subscription.unitPrice / 100).toFixed(2)}/{subscription.billingCycle}
                </p>
              </div>
              <StatusBadge status={subscription.status} />
            </div>
            
            {subscription.cancelAtPeriodEnd && (
              <Alert>
                <AlertDescription>
                  Your subscription will be cancelled on{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" asChild>
                <Link href="/pricing">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  Change Plan
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAction('update-payment')}
                disabled={actionLoading === 'update-payment'}
              >
                <CreditCard className="w-4 h-4 mr-1" />
                {actionLoading === 'update-payment' ? 'Loading...' : 'Update Payment'}
              </Button>
              
              {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('pause')}
                  disabled={actionLoading === 'pause'}
                >
                  <Pause className="w-4 h-4 mr-1" />
                  {actionLoading === 'pause' ? 'Loading...' : 'Pause'}
                </Button>
              )}
              
              {subscription.status === 'paused' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('resume')}
                  disabled={actionLoading === 'resume'}
                >
                  <Play className="w-4 h-4 mr-1" />
                  {actionLoading === 'resume' ? 'Loading...' : 'Resume'}
                </Button>
              )}
              
              {subscription.cancelAtPeriodEnd ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('reactivate')}
                  disabled={actionLoading === 'reactivate'}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {actionLoading === 'reactivate' ? 'Loading...' : 'Reactivate'}
                </Button>
              ) : (
                <CancelSubscriptionDialog 
                  onCancel={() => handleAction('cancel')}
                  loading={actionLoading === 'cancel'}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have an active subscription
            </p>
            <Button asChild>
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Status Badge Sub-Component
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    trialing: 'secondary',
    past_due: 'destructive',
    paused: 'secondary',
    canceled: 'outline',
  };
  
  return (
    <Badge variant={variants[status] || 'secondary'}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

// ============================================================================
// Cancel Dialog Sub-Component
// ============================================================================

function CancelSubscriptionDialog({ 
  onCancel, 
  loading 
}: { 
  onCancel: () => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel? You&apos;ll still have access until the end 
            of your billing period.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            We&apos;re sorry to see you go! Before you cancel, please consider:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Pausing your subscription instead (you won&apos;t be charged)</li>
            <li>Downgrading to a lower tier</li>
            <li>Contacting support if you&apos;re having issues</li>
          </ul>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep Subscription
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onCancel();
              setOpen(false);
            }}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
