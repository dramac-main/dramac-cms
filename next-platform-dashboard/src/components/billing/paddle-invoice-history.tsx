/**
 * Paddle Invoice History Component
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * Displays invoice history from Paddle billing with:
 * - Invoice list with date, period, status
 * - Download and view links
 * - Status badges
 * 
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface PaddleInvoice {
  id: string;
  paddleInvoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  invoiceUrl: string;
  createdAt: string;
}

interface PaddleInvoiceHistoryProps {
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PaddleInvoiceHistory({ className }: PaddleInvoiceHistoryProps) {
  const [invoices, setInvoices] = useState<PaddleInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/billing/paddle/invoices');
        if (res.ok) {
          const data = await res.json();
          // API returns { success: true, data: invoices } 
          setInvoices(data.data || data.invoices || []);
          setError(null);
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Failed to fetch invoices');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvoices();
  }, []);
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded" />
            ))}
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
            <FileText className="w-5 h-5" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Invoice History
        </CardTitle>
        <CardDescription>
          View and download your past invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No invoices yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden md:table-cell">Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.paddleInvoiceNumber || invoice.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {new Date(invoice.billingPeriodStart).toLocaleDateString()} -{' '}
                      {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(invoice.total / 100).toFixed(2)} {invoice.currency}
                    </TableCell>
                    <TableCell>
                      {invoice.invoiceUrl && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <a 
                              href={invoice.invoiceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="View invoice"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <a 
                              href={`${invoice.invoiceUrl}?download=true`} 
                              download
                              title="Download invoice"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Status Badge Sub-Component
// ============================================================================

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) {
    return (
      <Badge variant="secondary">
        unknown
      </Badge>
    );
  }
  
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    paid: 'default',
    completed: 'default',
    past_due: 'destructive',
    pending: 'secondary',
    draft: 'outline',
    billed: 'secondary',
  };
  
  return (
    <Badge variant={variants[status] || 'secondary'}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
