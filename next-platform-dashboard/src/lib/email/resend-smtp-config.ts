/**
 * Resend SMTP Configuration for Supabase Auth
 * 
 * Supabase auth emails (signup confirmation, password reset, magic links)
 * are configured through the Supabase Dashboard, NOT through code.
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to Supabase Dashboard → Project Settings → Authentication → SMTP Settings
 * 
 * 2. Enable "Custom SMTP" and enter these Resend SMTP credentials:
 *    - Host: smtp.resend.com
 *    - Port: 465
 *    - Username: resend
 *    - Password: <your RESEND_API_KEY>
 *    - Sender email: noreply@dramac.app (must be verified in Resend)
 *    - Sender name: Dramac
 *    - Minimum interval: 60 seconds
 * 
 * 3. Verify your domain in Resend Dashboard:
 *    - Go to https://resend.com/domains
 *    - Add domain: dramac.app
 *    - Add the DNS records (SPF, DKIM, DMARC) to your DNS provider
 * 
 * 4. Customize email templates in Supabase Dashboard → Authentication → Email Templates:
 *    - Confirm signup
 *    - Invite user
 *    - Magic Link
 *    - Change Email Address
 *    - Reset Password
 * 
 * ENVIRONMENT VARIABLES NEEDED:
 *   RESEND_API_KEY=re_xxxxxxxxxxxxx  (already configured)
 *   EMAIL_FROM=Dramac <noreply@dramac.app>
 *   EMAIL_REPLY_TO=support@dramac.app
 * 
 * IMPORTANT NOTES:
 * - The RESEND_API_KEY used for SMTP password is the same key used for 
 *   transactional emails in the app
 * - Supabase free tier uses their built-in SMTP which has rate limits
 * - Using Resend SMTP removes those rate limits
 * - Ensure dramac.app domain is verified in Resend before switching
 */

// This file is documentation-only. Auth SMTP is configured in Supabase Dashboard.
export const RESEND_SMTP_CONFIG = {
  host: 'smtp.resend.com',
  port: 465,
  username: 'resend',
  // password: process.env.RESEND_API_KEY (set in Supabase Dashboard)
  senderEmail: 'noreply@dramac.app',
  senderName: 'Dramac',
} as const
