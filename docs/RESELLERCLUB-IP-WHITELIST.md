# ResellerClub IP Whitelisting Guide

## Overview
ResellerClub requires IP whitelisting for API access. You can configure this directly in your control panel without contacting support.

## Step-by-Step Setup

### 1. Access Your ResellerClub Control Panel

1. Go to: https://manage.resellerclub.com/ (or https://freeaccount.myorderbox.com/ for test accounts)
2. Log in with your credentials

### 2. Navigate to API Settings

1. Click on **Settings** in the top menu
2. Select **API** from the dropdown or sidebar
3. Look for the section: **Whitelist your IP Addresses**

### 3. Find Your Server's Outbound IP

**For local development:**
```bash
# Find your current public IP
curl ifconfig.me
# or
curl icanhazip.com
```

**For Vercel (Production):**

⚠️ **CRITICAL ISSUE**: Vercel uses **dynamic IPs** that change frequently. This will NOT work reliably with ResellerClub's IP whitelisting.

**Solutions:**

#### Option 1: Free / low-cost (try first)
- **Fixie** (https://usefixie.com/) - **Free tier “Tricycle”**: 500 requests/month, 100 MB. Real outbound static IP; Vercel integration. Good for light ResellerClub use. $5/mo “Commuter” if you need more.
- **Noble IP** (https://noble-ip.com/) - Free tier may **not** include outbound proxy creation (only paid Starter $29/mo lists “1 Outbound Proxy”). Use if you’re on a paid plan.

#### Option 2: Paid proxy services
- **QuotaGuard** (https://www.quotaguard.com/) - Static IP for Vercel (~$10/month)
- **Axiom** (https://axiom.co/) - API gateway with static IPs

#### Option 3: Deploy to Infrastructure with Static IP
- **AWS EC2** with Elastic IP
- **DigitalOcean Droplet** with reserved IP
- **Azure VM** with static public IP
- **Google Cloud Compute** with static external IP

#### Option 4: Contact ResellerClub Support
Ask if they can whitelist Vercel's entire IP range:
- Vercel publishes their IP ranges
- Some registrars allow CIDR range whitelisting
- Email: support@resellerclub.com
- Phone: Listed in your control panel

### 4. Add IP to Whitelist

1. In the **Whitelist your IP Addresses** field, enter your IP address(es)
2. Format: One IP per line, or comma-separated
   ```
   203.0.113.1
   203.0.113.2
   ```
3. For IP ranges (if supported):
   ```
   203.0.113.0/24
   ```
4. Click **Save** or **Update**

### 5. Test API Access

After whitelisting, test your API connection:

```bash
# Test from your server
curl -X GET "https://httpapi.com/api/domains/available.json?auth-userid=YOUR_RESELLER_ID&api-key=YOUR_API_KEY&domain-name=test&tlds=com"
```

If successful, you'll get JSON response. If you see 403 errors, your IP is not whitelisted correctly.

## Finding Your Current IP

### Method 1: Check from Server
```bash
curl ifconfig.me
```

### Method 2: DNS Check
```bash
nslookup yourdomain.com
```

### Method 3: From ResellerClub Dashboard
Some ResellerClub control panels show "Your current IP is: X.X.X.X" at the top of the API settings page.

## Common Issues

### Issue: 403 Forbidden Errors
**Cause**: IP not whitelisted or incorrect IP entered  
**Solution**: Verify the IP making the request matches what's whitelisted

### Issue: Works Locally, Fails in Production
**Cause**: Production server has different IP than development  
**Solution**: Whitelist both development and production IPs

### Issue: Intermittent Failures on Vercel
**Cause**: Vercel's dynamic IPs changing  
**Solution**: Use one of the proxy solutions above

### Issue: Multiple IPs Need Whitelisting
**Cause**: Load balancers, multiple servers, or CDN  
**Solution**: Whitelist all outbound IPs or use IP range if supported

## Vercel Static IP Solutions

### Using QuotaGuard (Example)

1. Sign up at https://www.quotaguard.com/
2. Get your static proxy URL
3. Add environment variable to Vercel (use this name so the build doesn’t break):
   ```
   RESELLERCLUB_PROXY_URL=http://your-proxy-url
   ```
   Or if using Fixie integration: `FIXIE_URL` (same value). Do **not** set `HTTPS_PROXY`/`HTTP_PROXY` in Vercel – they break the build.
4. Whitelist QuotaGuard's static IP in ResellerClub
5. Update your ResellerClub API client to use proxy

### How the app uses the proxy
The ResellerClub client reads **`RESELLERCLUB_PROXY_URL`** or **`FIXIE_URL`** at runtime and routes API requests through that proxy (via undici). You only need to set one of these in Vercel; do not set `HTTPS_PROXY`/`HTTP_PROXY` or the Vercel build will fail.

## Security Best Practices

1. **Whitelist only necessary IPs** - Don't add IPs you don't control
2. **Review regularly** - Remove IPs from old servers you no longer use
3. **Use dedicated IPs** - Avoid shared IPs where possible
4. **Monitor API logs** - Watch for unauthorized access attempts
5. **Rotate API keys** - If you suspect compromise, regenerate keys

## Support Contact

If you need help with IP whitelisting:
- **ResellerClub Support**: support@resellerclub.com
- **Control Panel**: Settings > Support > Submit Ticket
- **Phone**: Check your control panel for regional phone numbers

## Next Steps After Whitelisting

1. ✅ IP whitelisted in ResellerClub control panel
2. ✅ Test API access from your production server
3. Configure Vercel cron: `/api/cron/resellerclub-sync` (daily 02:00 UTC)
4. Run initial pricing refresh: `POST /api/admin/pricing/refresh`
5. Test domain registration end-to-end with real payment
6. Update frontend UI for checkout redirect flow

---

**Need Help?** Check the main documentation files:
- `docs/RESELLERCLUB-IMPLEMENTATION-SUMMARY.md` - Complete implementation guide
- `docs/RESELLERCLUB-QUICK-REFERENCE.md` - Quick developer reference
- `docs/RESELLERCLUB-UI-CHANGES.md` - Frontend integration guide
