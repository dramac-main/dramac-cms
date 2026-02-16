'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

type PurchaseStatus = 'pending_payment' | 'paid' | 'provisioning' | 'completed' | 'failed' | 'refunded' | 'refund_failed';

interface PurchaseDetails {
  id: string;
  purchase_type: 'domain_register' | 'domain_renew' | 'domain_transfer' | 'email_order';
  status: PurchaseStatus;
  provisioned_resource_id?: string;
  resellerclub_order_id?: string;
  retail_amount: number;
  currency: string;
  error_message?: string;
  refund_reason?: string;
  paddle_refund_id?: string;
  refunded_at?: string;
  needs_manual_refund?: boolean;
  purchase_data: {
    domainName?: string;
    domain_name?: string;
    years?: number;
    mailboxes?: number;
    domains?: Array<{ domainName?: string; domain_name?: string; years?: number }>;
    [key: string]: unknown;
  };
}

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [purchase, setPurchase] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  
  const purchaseId = searchParams.get('purchase_id');
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    if (!purchaseId && !transactionId) {
      setError('Missing purchase or transaction ID');
      setLoading(false);
      return;
    }

    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;
    const MAX_POLLS = 60; // 5 minutes (5 second intervals)

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/purchases/status?${purchaseId ? `purchase_id=${purchaseId}` : `transaction_id=${transactionId}`}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch purchase status');
        }

        const data = await response.json();
        setPurchase(data);
        setLoading(false);

        // Stop polling if terminal state reached
        if (['completed', 'failed', 'refunded', 'refund_failed'].includes(data.status)) {
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check status');
        setLoading(false);
        if (pollInterval) clearInterval(pollInterval);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 5 seconds — also restarts when purchase status changes (e.g., after retry)
    pollInterval = setInterval(() => {
      pollCount++;
      if (pollCount >= MAX_POLLS) {
        clearInterval(pollInterval);
        setError('Status check timed out. Please check your domains or contact support.');
        return;
      }
      checkStatus();
    }, 5000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [purchaseId, transactionId, purchase?.status]);

  const getStatusInfo = () => {
    if (!purchase) return null;

    switch (purchase.status) {
      case 'pending_payment':
        return {
          icon: <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />,
          title: 'Waiting for Payment',
          description: 'Please complete your payment to continue.',
          color: 'border-blue-500',
        };
      case 'paid':
        return {
          icon: <Loader2 className="h-12 w-12 text-green-500 animate-spin" />,
          title: 'Payment Confirmed',
          description: 'Your payment has been confirmed. Setting up your service...',
          color: 'border-green-500',
        };
      case 'provisioning':
        return {
          icon: <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />,
          title: 'Provisioning Service',
          description: 'We\'re setting up your service. This usually takes a few moments.',
          color: 'border-blue-500',
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: 'Success!',
          description: 'Your purchase is complete and ready to use.',
          color: 'border-green-500',
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          title: 'Setup Failed',
          description: 'There was an issue setting up your service. You can retry or contact support.',
          color: 'border-red-500',
        };
      case 'refunded':
        return {
          icon: <CheckCircle className="h-12 w-12 text-blue-500" />,
          title: 'Payment Refunded',
          description: 'We couldn\'t complete your order, so a full refund has been issued automatically. The refund will appear on your payment method within 5-10 business days.',
          color: 'border-blue-500',
        };
      case 'refund_failed':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          title: 'Refund Pending',
          description: 'We couldn\'t complete your order. A refund is being processed — please contact support if you don\'t receive it within 48 hours.',
          color: 'border-red-500',
        };
    }
  };

  const getPurchaseTypeLabel = (type: string) => {
    switch (type) {
      case 'domain_register':
        return 'Domain Registration';
      case 'domain_renew':
        return 'Domain Renewal';
      case 'domain_transfer':
        return 'Domain Transfer';
      case 'email_order':
        return 'Email Account';
      default:
        return 'Purchase';
    }
  };

  const handleContinue = () => {
    if (!purchase) return;

    // Use provisioned_resource_id for correct navigation
    if (purchase.purchase_type.startsWith('domain') && purchase.provisioned_resource_id) {
      // Navigate to specific domain details page
      router.push(`/dashboard/domains/${purchase.provisioned_resource_id}`);
    } else if (purchase.purchase_type === 'email_order' && purchase.provisioned_resource_id) {
      // Navigate to specific email order page
      router.push(`/dashboard/email/${purchase.provisioned_resource_id}`);
    } else if (purchase.purchase_type.startsWith('domain')) {
      // Fallback to domains list
      router.push('/dashboard/domains');
    } else if (purchase.purchase_type === 'email_order') {
      // Fallback to email list
      router.push('/dashboard/email');
    } else {
      router.push('/dashboard');
    }
  };

  if (loading && !purchase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-12 text-center max-w-md">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Checking Status...</h2>
          <p className="text-muted-foreground">
            Please wait while we verify your purchase.
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-12 text-center max-w-md border-red-500">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard/domains')}>
            Go to Domains
          </Button>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className={`p-12 text-center max-w-2xl ${statusInfo?.color}`}>
        <div className="flex flex-col items-center space-y-6">
          {/* Status Icon */}
          {statusInfo?.icon}

          {/* Status Text */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{statusInfo?.title}</h1>
            <p className="text-muted-foreground text-lg">{statusInfo?.description}</p>
          </div>

          {/* Purchase Details */}
          {purchase && (
            <div className="w-full bg-muted rounded-lg p-6 space-y-3 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-semibold">{getPurchaseTypeLabel(purchase.purchase_type)}</div>
                </div>
                {/* Handle both single and multi-domain purchase data formats */}
                {(() => {
                  const pd = purchase.purchase_data;
                  const domainName = pd?.domainName || pd?.domain_name;
                  const domains = pd?.domains;
                  
                  if (domainName) {
                    return (
                      <div>
                        <div className="text-sm text-muted-foreground">Domain</div>
                        <div className="font-semibold">{domainName}</div>
                      </div>
                    );
                  }
                  if (domains && domains.length > 0) {
                    return (
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Domains</div>
                        <div className="font-semibold">
                          {domains.map(d => d.domainName || d.domain_name).filter(Boolean).join(', ')}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                {purchase.purchase_data?.years && (
                  <div>
                    <div className="text-sm text-muted-foreground">Period</div>
                    <div className="font-semibold">{purchase.purchase_data.years} {purchase.purchase_data.years === 1 ? 'year' : 'years'}</div>
                  </div>
                )}
                {!purchase.purchase_data?.years && purchase.purchase_data?.domains?.[0]?.years && (
                  <div>
                    <div className="text-sm text-muted-foreground">Period</div>
                    <div className="font-semibold">{purchase.purchase_data.domains[0].years} {purchase.purchase_data.domains[0].years === 1 ? 'year' : 'years'}</div>
                  </div>
                )}
                {purchase.purchase_data?.mailboxes && (
                  <div>
                    <div className="text-sm text-muted-foreground">Mailboxes</div>
                    <div className="font-semibold">{purchase.purchase_data.mailboxes}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="font-semibold">
                    {purchase.currency} ${purchase.retail_amount.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-border">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className={`font-semibold capitalize ${
                  purchase.status === 'refunded' ? 'text-blue-500' : 
                  purchase.status === 'refund_failed' ? 'text-orange-500' :
                  purchase.status === 'failed' ? 'text-red-500' : 
                  purchase.status === 'completed' ? 'text-green-500' : ''
                }`}>
                  {purchase.status === 'refunded' ? 'Refunded' :
                   purchase.status === 'refund_failed' ? 'Refund Pending' :
                   purchase.status.replace('_', ' ')}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {purchase?.status === 'completed' && (
            <Button onClick={handleContinue} size="lg" className="mt-4">
              Continue to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {(purchase?.status === 'refunded' || purchase?.status === 'refund_failed') && (
            <div className="flex gap-3 mt-4">
              {purchase.paddle_refund_id && (
                <p className="text-sm text-muted-foreground w-full text-center">
                  Refund ID: {purchase.paddle_refund_id}
                </p>
              )}
              <Button onClick={handleContinue}>
                Go to Domains
              </Button>
            </div>
          )}

          {purchase?.status === 'failed' && (
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={async () => {
                  setRetrying(true);
                  try {
                    const response = await fetch('/api/purchases/retry', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ purchase_id: purchase.id }),
                    });
                    if (response.ok) {
                      // Reset to polling state
                      setPurchase(prev => prev ? { ...prev, status: 'provisioning' as PurchaseStatus, error_message: undefined } : null);
                    } else {
                      const data = await response.json();
                      setPurchase(prev => prev ? { ...prev, error_message: data.error } : null);
                    }
                  } catch {
                    // Ignore — user can try again
                  } finally {
                    setRetrying(false);
                  }
                }}
                disabled={retrying}
              >
                {retrying ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Retrying...</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" /> Retry Setup</>
                )}
              </Button>
              <Button onClick={handleContinue}>
                Go to Domains
              </Button>
            </div>
          )}

          {/* Loading States Info */}
          {(purchase?.status === 'provisioning' || purchase?.status === 'paid') && (
            <div className="text-sm text-muted-foreground mt-4">
              This page will automatically update when your service is ready.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
