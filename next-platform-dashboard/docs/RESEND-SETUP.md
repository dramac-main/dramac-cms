# Resend Email Setup Guide

## Current Status ✅

- ✅ Resend account created
- ✅ API key configured
- ✅ Email system tested and working
- ⚠️ Domain not yet verified (using test mode)

## Test Mode Limitations

With `onboarding@resend.dev`:
- ✅ Can send emails
- ⚠️ Can ONLY send to: `info@dramacagency.com` (your registered email)
- ⚠️ Cannot send to other recipients until domain is verified

## How to Test Now

Send a test email to yourself:

```powershell
cd F:\dramac-cms\next-platform-dashboard
npx tsx scripts/test-email.ts info@dramacagency.com
```

Check your inbox at `info@dramacagency.com` - you should receive a welcome email!

## Next Steps: Verify Your Domain

To send emails to anyone (not just yourself):

### 1. Add Domain in Resend

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `dramacagency.com`

### 2. Add DNS Records

Resend will give you DNS records to add. You'll need to add these to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

**DKIM Records (2 records):**
```
Type: TXT
Name: resend._domainkey
Value: (provided by Resend)

Type: TXT
Name: resend2._domainkey
Value: (provided by Resend)
```

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:your-email@dramacagency.com
```

### 3. Verify Domain

After adding DNS records (can take 5-60 minutes):
1. Click "Verify" in Resend dashboard
2. Wait for green checkmark

### 4. Update Environment Variables

Once verified, update `.env.local`:

```env
EMAIL_FROM=Dramac <noreply@dramacagency.com>
EMAIL_REPLY_TO=info@dramacagency.com
```

## Email Types Available

All these work once domain is verified:

```typescript
// Auth
sendWelcomeEmail(email, name)
sendPasswordResetEmail(email, resetUrl)
sendEmailChangedNotification(oldEmail, newEmail)

// Team
sendTeamInvitationEmail(email, inviterName, agencyName, inviteToken)
sendTeamMemberJoinedEmail(teamEmails[], memberName, agencyName)

// Sites
sendSitePublishedEmail(email, siteName, siteUrl)
sendDomainConnectedEmail(email, domain, siteName)

// Billing
sendSubscriptionCreatedEmail(email, planName)
sendPaymentFailedEmail(email, updatePaymentUrl?)
sendTrialEndingEmail(email, daysLeft)
```

## Testing Commands

```powershell
# Test single email
npx tsx scripts/test-email.ts your-email@example.com

# Preview all templates
npx tsx scripts/preview-all-emails.ts
```

## Troubleshooting

**"Domain not verified" error:**
- You're trying to send from a domain you don't own
- Solution: Use `onboarding@resend.dev` for testing, or verify your domain

**"Can only send to your own email" error:**
- Using test domain but sending to someone else
- Solution: Send to `info@dramacagency.com` or verify your domain

**No emails arriving:**
- Check spam folder
- Verify API key is correct
- Make sure `.env.local` is loaded

## Production Checklist

Before launching:
- [ ] Domain verified in Resend
- [ ] DNS records properly configured
- [ ] SPF/DKIM/DMARC all green in Resend
- [ ] Updated `EMAIL_FROM` to use your domain
- [ ] Tested all email types
- [ ] Checked emails don't go to spam
