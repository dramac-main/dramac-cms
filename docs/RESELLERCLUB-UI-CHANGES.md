# UI Changes Required for ResellerClub Integration

## Overview

The domain and email purchase flows now redirect users to Paddle checkout instead of provisioning immediately. The UI needs to handle the new flow and display purchase status.

## Changed User Flows

### Before (Old Flow)
1. User clicks "Register Domain"
2. Domain registers immediately
3. Page shows success message
4. Domain appears in list as "Active"

### After (New Flow)
1. User clicks "Register Domain"
2. **Action returns checkout URL**
3. **Redirect user to Paddle checkout**
4. User completes payment
5. **Shows "Processing..." status**
6. Webhook provisions domain
7. Domain appears in list as "Active"

## Required UI Updates

### 1. Domain Registration Button/Form

**File**: Likely in `app/dashboard/domains/` or similar

**Current behavior**:
```typescript
const result = await registerDomain(params);
if (result.success) {
  toast.success('Domain registered!');
  router.push('/dashboard/domains');
}
```

**New behavior**:
```typescript
const result = await registerDomain(params);
if (result.success && result.data?.checkoutUrl) {
  // Redirect to Paddle checkout
  window.location.href = result.data.checkoutUrl;
} else if (result.success) {
  toast.success('Domain registered!');
  router.push('/dashboard/domains');
} else {
  toast.error(result.error || 'Registration failed');
}
```

### 2. Domain Renewal Button

**Same pattern as registration**:
```typescript
const result = await renewDomain(domainId, years);
if (result.success && result.data?.checkoutUrl) {
  window.location.href = result.data.checkoutUrl;
} else if (result.success) {
  toast.success('Domain renewed!');
}
```

### 3. Business Email Order Creation

**Same pattern**:
```typescript
const result = await createBusinessEmailOrder(formData);
if (result.success && result.data?.checkoutUrl) {
  window.location.href = result.data.checkoutUrl;
} else if (result.success && result.data?.order) {
  toast.success('Email order created!');
  router.push('/dashboard/email');
}
```

## New Status Display

### Pending Purchase Status

Add UI to show pending purchases awaiting payment or provisioning:

**Query pending purchases**:
```typescript
// New server action needed
export async function getPendingPurchases() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  const { data, error } = await supabase
    .from('pending_purchases')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false });
  
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
```

**Display component**:
```tsx
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
  <h3 className="font-medium text-yellow-900">Pending Purchases</h3>
  {pendingPurchases.map(purchase => (
    <div key={purchase.id} className="mt-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            {purchase.purchase_data.domain_name}
          </p>
          <p className="text-sm text-gray-600">
            Status: {purchase.status}
          </p>
        </div>
        {purchase.status === 'pending_payment' && (
          <a
            href={purchase.paddle_checkout_url}
            className="btn btn-primary"
          >
            Complete Payment
          </a>
        )}
        {purchase.status === 'provisioning' && (
          <span className="text-blue-600">Processing...</span>
        )}
      </div>
    </div>
  ))}
</div>
```

### Status Badge Component

Add status badges for pending purchases:

```tsx
function PurchaseStatusBadge({ status }: { status: string }) {
  const config = {
    pending_payment: { color: 'yellow', label: 'Awaiting Payment' },
    paid: { color: 'blue', label: 'Payment Received' },
    provisioning: { color: 'blue', label: 'Provisioning...' },
    completed: { color: 'green', label: 'Completed' },
    failed: { color: 'red', label: 'Failed' },
    cancelled: { color: 'gray', label: 'Cancelled' },
  };
  
  const { color, label } = config[status] || config.pending_payment;
  
  return (
    <span className={`badge badge-${color}`}>
      {label}
    </span>
  );
}
```

## Payment Return/Cancel Handling

### Add Return URL Handler

Users will return from Paddle after payment. Add a return handler page:

**File**: `app/dashboard/payment/success/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  
  // Paddle adds transaction ID to URL
  const transactionId = searchParams.get('_ptxn');
  
  useEffect(() => {
    // Poll for provisioning status
    const checkStatus = async () => {
      // Add API endpoint to check pending purchase by transaction ID
      const response = await fetch(`/api/purchases/status?txn=${transactionId}`);
      const result = await response.json();
      
      if (result.status === 'completed') {
        setStatus('success');
      } else if (result.status === 'failed') {
        setStatus('failed');
      } else {
        // Still provisioning, check again
        setTimeout(checkStatus, 2000);
      }
    };
    
    if (transactionId) {
      checkStatus();
    }
  }, [transactionId]);
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      {status === 'checking' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Processing Your Purchase</h1>
          <p className="text-gray-600">
            We're setting up your domain/email. This usually takes 10-30 seconds.
          </p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Purchase Complete!</h1>
          <p className="text-gray-600 mb-4">
            Your domain/email has been successfully provisioned.
          </p>
          <a href="/dashboard/domains" className="btn btn-primary">
            View Domains
          </a>
        </div>
      )}
      
      {status === 'failed' && (
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">✕</div>
          <h1 className="text-2xl font-bold mb-2">Provisioning Failed</h1>
          <p className="text-gray-600 mb-4">
            Payment was successful but we couldn't provision your purchase.
            Our team has been notified and will reach out shortly.
          </p>
          <a href="/dashboard/domains" className="btn btn-secondary">
            Back to Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
```

### Configure Paddle Return URLs

In Paddle dashboard, set:
- **Success URL**: `https://yourdomain.com/dashboard/payment/success`
- **Cancel URL**: `https://yourdomain.com/dashboard/domains` (or wherever user should return)

## API Endpoint for Status Checking

**File**: `app/api/purchases/status/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('txn');
  
  if (!transactionId) {
    return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 });
  }
  
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data: purchase } = await supabase
    .from('pending_purchases')
    .select('status, purchase_type, purchase_data, provisioned_resource_id, error_message')
    .eq('paddle_transaction_id', transactionId)
    .single();
  
  if (!purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }
  
  return NextResponse.json({
    status: purchase.status,
    type: purchase.purchase_type,
    details: purchase.purchase_data,
    resourceId: purchase.provisioned_resource_id,
    error: purchase.error_message,
  });
}
```

## Loading States

Add loading states while checking pricing:

```tsx
function DomainRegistrationForm() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricing, setPricing] = useState(null);
  
  useEffect(() => {
    const calculatePrice = async () => {
      setIsCalculating(true);
      const result = await calculateDomainPrice({
        tld: selectedTld,
        years: selectedYears,
        operation: 'register',
        includePrivacy: includePrivacy,
      });
      if (result.success && result.data) {
        setPricing(result.data);
      }
      setIsCalculating(false);
    };
    
    calculatePrice();
  }, [selectedTld, selectedYears, includePrivacy]);
  
  return (
    <div>
      {isCalculating ? (
        <div>Calculating price...</div>
      ) : pricing ? (
        <div>
          <p className="text-2xl font-bold">
            ${pricing.total_retail.toFixed(2)}
          </p>
          <button onClick={handleRegister}>
            Proceed to Checkout
          </button>
        </div>
      ) : null}
    </div>
  );
}
```

## Error Handling

Display helpful error messages:

```tsx
function handleError(error: string) {
  const errorMap = {
    'IP not whitelisted': 'Our server is currently unable to connect to the domain registrar. Please try again in a few minutes or contact support.',
    'Domain already registered': 'This domain has already been registered. Please try a different domain.',
    'Invalid contact info': 'Please check your contact information and try again.',
    'Insufficient funds': 'Unable to complete registration. Please contact support.',
  };
  
  const userFriendlyMessage = Object.keys(errorMap).find(key => 
    error.includes(key)
  );
  
  return userFriendlyMessage 
    ? errorMap[userFriendlyMessage]
    : 'An error occurred during registration. Please try again or contact support.';
}
```

## Admin Pricing Refresh UI

Add admin controls for pricing management:

**File**: `app/dashboard/admin/pricing/page.tsx`

```tsx
'use client';

import { useState } from 'react';

export default function PricingAdminPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleRefresh = async (type: 'domain' | 'email' | 'full') => {
    setRefreshing(true);
    const response = await fetch('/api/admin/pricing/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syncType: type }),
    });
    const data = await response.json();
    setResult(data);
    setRefreshing(false);
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pricing Management</h1>
      
      <div className="space-y-4">
        <button 
          onClick={() => handleRefresh('domain')}
          disabled={refreshing}
          className="btn btn-primary"
        >
          Refresh Domain Pricing
        </button>
        
        <button 
          onClick={() => handleRefresh('email')}
          disabled={refreshing}
          className="btn btn-primary"
        >
          Refresh Email Pricing
        </button>
        
        <button 
          onClick={() => handleRefresh('full')}
          disabled={refreshing}
          className="btn btn-primary"
        >
          Refresh All Pricing
        </button>
      </div>
      
      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## Testing Checklist

### UI Flow Testing
- [ ] Domain registration redirects to Paddle
- [ ] Can complete payment on Paddle checkout
- [ ] Returns to success page after payment
- [ ] Success page polls and shows final status
- [ ] Pending purchases show in dashboard
- [ ] Can resume pending payment from dashboard
- [ ] Error messages are user-friendly
- [ ] Loading states display correctly

### Edge Cases
- [ ] User closes checkout before paying (purchase stays pending)
- [ ] User clicks back button during checkout (can resume)
- [ ] Webhook delayed (success page continues polling)
- [ ] Provisioning fails (shows error message with support info)

---

**Summary**: All purchase actions now return `checkoutUrl` that should be used to redirect users to Paddle. Add a success page to handle return and show provisioning status.
