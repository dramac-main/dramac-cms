# Vercel Redeploy Required

After adding the Fixie integration to Vercel, a **redeploy is required** for the `FIXIE_URL` environment variable to take effect.

## Why This File Exists

This file was created to trigger a Vercel redeploy after adding the Fixie integration for ResellerClub IP whitelisting.

## What Was Done

1. ✅ Fixie integration installed on Vercel (provides static IPs: 54.217.142.99, 54.195.3.54)
2. ✅ Both IPs whitelisted in ResellerClub → Settings → API
3. ✅ Code already configured to use `FIXIE_URL` (in `src/lib/resellerclub/client.ts`)
4. ⏳ **This commit triggers redeploy to activate FIXIE_URL**

## After Redeploy

Verify ResellerClub API is reachable:

1. **Status check:** https://app.dramacagency.com/api/domains/resellerclub-status  
   Should show: `"reachable": true`

2. **Domain search:** https://app.dramacagency.com/dashboard/domains/search  
   Should show: **(Live from ResellerClub)** and no amber warning

3. **Outbound IP check:** https://app.dramacagency.com/api/debug/outbound-ip  
   Should show one of the Fixie IPs (54.217.142.99 or 54.195.3.54)

## If Still Not Working

- Verify Fixie integration in Vercel: https://vercel.com/integrations/fixie
- Check Vercel env vars: `FIXIE_URL` should be present
- Check Fixie dashboard: https://usefixie.com/dashboard (verify IPs match ResellerClub whitelist)
- Check ResellerClub: Both IPs must be whitelisted

---

**Created:** February 14, 2026  
**Commit:** Trigger redeploy for Fixie integration activation
