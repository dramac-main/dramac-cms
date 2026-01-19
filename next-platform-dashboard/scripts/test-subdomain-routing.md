# Subdomain Routing Test Guide

## How It Works

1. **User visits**: `testsite.dramacagency.com`
2. **DNS**: Wildcard CNAME `*.dramacagency.com` → `cname.vercel-dns.com`
3. **Vercel**: Routes to Next.js app
4. **proxy.ts**: Detects hostname is NOT `app.dramacagency.com`
5. **Rewrite**: `/site/testsite` (extracts subdomain)
6. **Page**: `src/app/site/[domain]/[[...slug]]/page.tsx`
7. **Fetch**: Queries `sites` table WHERE `subdomain = 'testsite'` AND `published = true`
8. **Render**: Returns site content

## Testing Steps

### Step 1: Check Database
Run in Supabase SQL Editor:
```sql
SELECT id, name, subdomain, custom_domain, published 
FROM sites 
WHERE published = true;
```

Expected result: Sites with subdomain like `'testsite'` (just the subdomain part, NOT full domain)

### Step 2: Check Environment Variables
In `.env.local`:
```
NEXT_PUBLIC_BASE_DOMAIN=dramacagency.com
NEXT_PUBLIC_APP_URL=https://app.dramacagency.com
```

### Step 3: Vercel Domain Setup
1. Go to Vercel Dashboard
2. Project Settings → Domains
3. Add domain: `*.dramacagency.com`
4. Verify DNS configuration

### Step 4: DNS Cleanup
Remove these conflicting ALIAS records from Hostinger:
- ❌ backyardbbq ALIAS
- ❌ bridgetandnathanielwedding ALIAS
- ❌ zamsuite ALIAS
- ❌ jesmic ALIAS

Keep only:
- ✅ `*` CNAME → `cname.vercel-dns.com`
- ✅ `app` CNAME → `3548a3df0b30e26a.vercel-dns-017.com`
- ✅ `www` CNAME → `1d1fc67bdb52700d.vercel-dns-017.com`

### Step 5: Test Locally
Edit your `hosts` file to test locally:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
```
127.0.0.1 testsite.dramacagency.com
```

Then visit: `http://testsite.dramacagency.com:3000`

### Step 6: Debug Logging
Check the terminal when a subdomain is accessed. You should see:
```
GET /site/testsite 200 in ...
```

## Common Issues

### Issue 1: "Page not found"
**Cause**: Site not in database OR not published OR subdomain doesn't match
**Fix**: Check `sites` table, ensure `published = true` and subdomain matches

### Issue 2: Redirects to login
**Cause**: proxy.ts not recognizing subdomain as public
**Fix**: Already fixed in latest commit

### Issue 3: DNS not resolving
**Cause**: Conflicting ALIAS records OR Vercel domain not added
**Fix**: Clean up DNS, add `*.dramacagency.com` to Vercel

### Issue 4: SSL certificate error
**Cause**: Vercel hasn't issued SSL for wildcard yet
**Fix**: Wait 1-2 hours after adding wildcard domain to Vercel
