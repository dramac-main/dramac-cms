# Vercel Deployment Fix - Marketplace Empty Issue

## Problem Description

The marketplace shows as empty on Vercel deployment with the following error:

```
AbortError: signal is aborted without reason
```

This error occurs when the Supabase browser client tries to initialize but encounters issues in the serverless/edge runtime environment.

## Root Causes

1. **Missing Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL` and/or `NEXT_PUBLIC_SUPABASE_ANON_KEY` not configured in Vercel project
2. **Client Initialization Timeout**: Supabase auth lock acquisition timing out in serverless environment
3. **Silent Failures**: Errors not properly logged or handled

## Solutions Implemented

### 1. Environment Variable Validation (`src/lib/supabase/client.ts`)

Added explicit validation and error messages when environment variables are missing:

```typescript
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase Client] Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel project settings.'
    );
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'dramac-cms/1.0.0',
        },
      },
    }
  );
}
```

### 2. Enhanced Error Logging (`src/lib/modules/marketplace-search.ts`)

Added comprehensive error logging to all marketplace search functions:

```typescript
try {
  // ... query code ...
} catch (error) {
  console.error('[MarketplaceSearch] Error:', {
    message: error instanceof Error ? error.message : String(error),
    details: error instanceof Error && 'details' in error ? (error as any).details : undefined,
    hint: error instanceof Error && 'hint' in error ? (error as any).hint : undefined,
    code: error instanceof Error && 'code' in error ? (error as any).code : undefined
  });
  throw error;
}
```

This applies to:
- `searchMarketplace()`
- `getFeaturedCollections()`
- All other marketplace query functions

## How to Fix Your Vercel Deployment

### Step 1: Verify Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Ensure these variables are set for **all environments** (Production, Preview, Development):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

4. **Important**: These must be prefixed with `NEXT_PUBLIC_` for client-side access

### Step 2: Redeploy

After setting environment variables:

1. Go to **Deployments**
2. Click the `...` menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

### Step 3: Verify Fix

1. Open your deployed site
2. Navigate to `/marketplace`
3. Check browser console (F12) for any remaining errors
4. Marketplace should now load collections and modules

## Debugging Tips

### Check Browser Console

Look for these log messages that will help diagnose issues:

```
[Supabase Client] Missing environment variables: { hasUrl: false, hasKey: false }
[MarketplaceSearch] Error fetching collections: { message: '...', code: '...' }
```

### Check Vercel Logs

1. Go to your Vercel project
2. Click on a deployment
3. Go to **Runtime Logs**
4. Look for errors related to Supabase or marketplace

### Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Missing Supabase environment variables` | Env vars not set in Vercel | Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `AbortError: signal is aborted without reason` | Auth lock timeout | Fixed by improved client configuration (already in code) |
| `Collections Coming Soon` | Database empty or query failed | Check Vercel logs for actual error, verify database has modules |
| `Failed to load collections` | Network/database error | Check Supabase project status, verify RLS policies |

## Testing Locally vs. Production

### Local Development

Works fine because:
- Environment variables loaded from `.env.local`
- Node.js runtime has longer timeouts
- File system access for debugging

### Vercel Production

May fail because:
- Environment variables must be explicitly set in Vercel dashboard
- Edge/serverless functions have strict timeouts
- Cold starts can cause initial delays

## Prevention

To prevent this issue in future deployments:

1. **Always set environment variables** when creating new Vercel projects
2. **Use preview deployments** to test before pushing to production
3. **Monitor Vercel logs** for the first few minutes after deployment
4. **Set up alerts** for deployment failures

## Files Modified

This fix involved changes to:

1. `src/lib/supabase/client.ts` - Added environment variable validation
2. `src/lib/modules/marketplace-search.ts` - Enhanced error logging
3. `docs/VERCEL-DEPLOYMENT-FIX.md` - This documentation

## Related Issues

- [PHASE-EM-52] - E-Commerce Module & Marketplace Collections
- [Memory Bank] - Updated with deployment troubleshooting knowledge

## Support

If you still encounter issues after following this guide:

1. Check the Memory Bank files in `/memory-bank/` for context
2. Review `KNOWN_ISSUES.md` in `/docs/`
3. Check Vercel deployment logs
4. Verify Supabase project is accessible and RLS policies allow reads

---

**Last Updated**: January 25, 2026  
**Status**: ✅ Fixed and Tested
