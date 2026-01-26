/**
 * Admin Billing Dashboard
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * Platform administrator dashboard for billing oversight:
 * - MRR/ARR metrics
 * - Active subscriptions count
 * - Churn rate
 * - Revenue by plan
 * - Top agencies by revenue
 * 
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminBillingOverview } from '@/components/admin/billing-overview';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Billing Overview - Admin',
  description: 'Platform billing and revenue metrics',
};

export default async function AdminBillingPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check if user is super admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing Overview</h1>
        <p className="text-muted-foreground">
          Revenue metrics and subscription analytics
        </p>
      </div>
      
      <Suspense fallback={<AdminBillingSkeleton />}>
        <AdminBillingOverview />
      </Suspense>
    </div>
  );
}

function AdminBillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
