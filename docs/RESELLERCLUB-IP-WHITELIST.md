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

#### Option 1: Use a Proxy Service (Recommended)
Use a service that provides static IP for your API requests:
- **QuotaGuard** (https://www.quotaguard.com/) - Static IP proxy for Vercel
- **Axiom** (https://axiom.co/) - API gateway with static IPs
- **Cloudflare Argo Tunnel** - Tunnel with static IPs

#### Option 2: Deploy to Infrastructure with Static IP
- **AWS EC2** with Elastic IP
- **DigitalOcean Droplet** with reserved IP
- **Azure VM** with static public IP
- **Google Cloud Compute** with static external IP

#### Option 3: Contact ResellerClub Support
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
3. Add environment variable to Vercel:
   ```
   HTTP_PROXY=http://your-proxy-url
   HTTPS_PROXY=http://your-proxy-url
   ```
4. Whitelist QuotaGuard's static IP in ResellerClub
5. Update your ResellerClub API client to use proxy

### Code Example with Proxy
```typescript
// In your ResellerClub client
const httpsAgent = process.env.HTTPS_PROXY 
  ? new HttpsProxyAgent(process.env.HTTPS_PROXY)
  : undefined;

const response = await fetch('https://httpapi.com/api/...', {
  agent: httpsAgent,
  // ... other options
});
```

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
