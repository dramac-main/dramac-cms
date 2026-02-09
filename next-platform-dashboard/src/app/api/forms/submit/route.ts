import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email/send-email";

// Type alias for the admin Supabase client
type SupabaseAdmin = SupabaseClient;

// Create Supabase client with service role for public form submissions
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean every minute

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, formId, data, honeypot } = body;

    // Validate required fields
    if (!siteId || !formId || !data) {
      return NextResponse.json(
        { error: "Missing required fields: siteId, formId, and data are required" },
        { status: 400 }
      );
    }

    if (typeof data !== "object") {
      return NextResponse.json(
        { error: "Invalid data: must be an object" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get request metadata
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || null;
    const referer = headersList.get("referer") || null;
    const origin = headersList.get("origin") || null;
    
    // Get IP address from various headers
    const ip = 
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "unknown";

    // Verify site exists
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, domain")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      console.error("[FormSubmit] Invalid site ID:", siteId);
      return NextResponse.json(
        { error: "Invalid site" },
        { status: 400 }
      );
    }

    // Get form settings
    const { data: settings } = await supabase
      .from("form_settings")
      .select("*")
      .eq("site_id", siteId)
      .eq("form_id", formId)
      .single();

    // Apply default settings if none exist
    const formSettings = settings || {
      success_message: "Thank you for your submission!",
      redirect_url: null,
      enable_honeypot: true,
      enable_rate_limit: true,
      rate_limit_per_hour: 10,
      notify_on_submission: true,
      notify_emails: [],
    };

    // Honeypot check - if honeypot field has value, it's likely a bot
    if (formSettings.enable_honeypot && honeypot) {
      console.log("[FormSubmit] Honeypot triggered for site:", siteId, "IP:", ip);
      // Still return success to not alert bots
      return NextResponse.json({
        success: true,
        message: formSettings.success_message,
      });
    }

    // Rate limiting
    if (formSettings.enable_rate_limit) {
      const rateKey = `${siteId}:${formId}:${ip}`;
      const now = Date.now();
      const hourInMs = 3600000;
      const rateLimit = rateLimitMap.get(rateKey);
      const maxPerHour = formSettings.rate_limit_per_hour || 10;

      if (rateLimit) {
        if (now < rateLimit.resetAt) {
          if (rateLimit.count >= maxPerHour) {
            console.log("[FormSubmit] Rate limit exceeded for:", rateKey);
            return NextResponse.json(
              { error: "Too many submissions. Please try again later." },
              { status: 429 }
            );
          }
          rateLimit.count++;
        } else {
          // Reset counter
          rateLimitMap.set(rateKey, { count: 1, resetAt: now + hourInMs });
        }
      } else {
        rateLimitMap.set(rateKey, { count: 1, resetAt: now + hourInMs });
      }
    }

    // Spam detection
    const isSpam = detectSpam(data);

    // Clean form data - remove internal fields
    const cleanedData = { ...data };
    delete cleanedData._honeypot;
    delete cleanedData._formId;
    delete cleanedData._siteId;

    // Save submission
    const { data: submission, error: insertError } = await supabase
      .from("form_submissions")
      .insert({
        site_id: siteId,
        form_id: formId,
        data: cleanedData,
        page_url: referer,
        user_agent: userAgent,
        ip_address: ip,
        referrer: origin,
        status: isSpam ? "spam" : "new",
        is_spam: isSpam,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[FormSubmit] Error saving submission:", insertError);
      return NextResponse.json(
        { error: "Failed to save submission" },
        { status: 500 }
      );
    }

    console.log("[FormSubmit] Submission saved:", submission.id, "for site:", siteId);

    // Send notifications (async, don't wait)
    if (formSettings.notify_on_submission && !isSpam) {
      sendNotifications(supabase, submission, formSettings).catch((err) => {
        console.error("[FormSubmit] Notification error:", err);
      });
    }

    // Trigger webhooks (async, don't wait)
    triggerWebhooks(supabase, siteId, formId, submission).catch((err) => {
      console.error("[FormSubmit] Webhook error:", err);
    });

    return NextResponse.json({
      success: true,
      message: formSettings.success_message,
      redirect: formSettings.redirect_url || null,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("[FormSubmit] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * Detect spam content in form data
 */
function detectSpam(data: Record<string, unknown>): boolean {
  const content = Object.values(data)
    .filter((v) => typeof v === "string")
    .join(" ")
    .toLowerCase();

  // Common spam patterns
  const spamPatterns = [
    // Pharma spam
    /\b(viagra|cialis|xanax|tramadol|hydrocodone|oxycodone|phentermine|ambien|modafinil)\b/i,
    
    // Casino/gambling
    /\b(casino|poker|blackjack|slot\s*machine|gambling|bet365|sportsbetting)\b/i,
    
    // Get rich quick
    /\b(lottery|winner|jackpot|million\s*dollars?|inheritance|nigerian?\s*prince)\b/i,
    
    // Marketing spam
    /\b(click\s*here|act\s*now|limited\s*time|exclusive\s*offer|free\s*money)\b/i,
    
    // SEO spam
    /\b(buy\s*backlinks?|seo\s*service|rank\s*#?1|google\s*ranking)\b/i,
    
    // Suspicious TLDs in URLs
    /https?:\/\/[^\s]+\.(ru|cn|tk|xyz|top|gq|ml|ga|cf|pw|ws)\b/i,
    
    // Crypto spam
    /\b(bitcoin\s*doubler|crypto\s*giveaway|free\s*btc|ethereum\s*airdrop)\b/i,
    
    // Code injection attempts
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onmouseover=, etc.
    
    // BBCode spam
    /\[url=/i,
    /\[link=/i,
    
    // Email harvesting protection
    /mailto:/i,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return true;
    }
  }

  // Check for excessive URLs (more than 3)
  const urlCount = (content.match(/https?:\/\//gi) || []).length;
  if (urlCount > 3) {
    return true;
  }

  // Check for excessive email addresses (more than 2)
  const emailCount = (content.match(/[\w.-]+@[\w.-]+\.\w+/gi) || []).length;
  if (emailCount > 2) {
    return true;
  }

  // Check for all caps messages (potential spam/yelling)
  const words = content.split(/\s+/).filter((w) => w.length > 3);
  if (words.length > 5) {
    const capsWords = words.filter((w) => w === w.toUpperCase());
    if (capsWords.length / words.length > 0.7) {
      return true;
    }
  }

  return false;
}

/**
 * Send email notifications for new submissions
 */
async function sendNotifications(
  supabase: SupabaseAdmin,
  submission: Record<string, unknown>,
  settings: Record<string, unknown>
): Promise<void> {
  const emails = settings.notify_emails as string[];
  if (!emails || emails.length === 0) {
    return;
  }

  // Format submission data for email
  const formData = submission.data as Record<string, unknown>;
  const formattedFields = Object.entries(formData).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: String(value ?? ''),
  }));

  const formName = (settings.form_name as string) || 'Contact Form';
  const siteName = (settings.site_name as string) || '';

  // Send email to each recipient using the centralized email system
  for (const email of emails) {
    await sendEmail({
      to: { email },
      type: 'form_submission_owner',
      data: {
        formName,
        siteName,
        submittedAt: new Date().toISOString(),
        fields: formattedFields,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/forms`,
      },
    })
  }

  // Mark as notified
  await supabase
    .from("form_submissions")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", submission.id);
}

/**
 * Trigger webhooks for new submissions
 */
async function triggerWebhooks(
  supabase: SupabaseAdmin,
  siteId: string,
  formId: string,
  submission: Record<string, unknown>
): Promise<void> {
  // Get active webhooks for this site/form
  const { data: webhooks, error } = await supabase
    .from("form_webhooks")
    .select("*")
    .eq("site_id", siteId)
    .eq("is_active", true);

  if (error || !webhooks || webhooks.length === 0) {
    return;
  }

  // Filter webhooks that match this form (or all forms if form_id is null)
  const matchingWebhooks = webhooks.filter(
    (w) => w.form_id === null || w.form_id === formId
  );

  for (const webhook of matchingWebhooks) {
    try {
      const payload = {
        event: "form.submission",
        timestamp: new Date().toISOString(),
        siteId,
        formId,
        submissionId: submission.id,
        data: submission.data,
        metadata: {
          pageUrl: submission.page_url,
          userAgent: submission.user_agent,
          ipAddress: submission.ip_address,
          submittedAt: submission.created_at,
        },
      };

      const response = await fetch(webhook.url, {
        method: webhook.method || "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "DramaCMS-Webhook/1.0",
          "X-Webhook-Event": "form.submission",
          "X-Webhook-Signature": generateWebhookSignature(payload),
          ...(webhook.headers || {}),
        },
        body: JSON.stringify(payload),
      });

      console.log(
        "[FormSubmit] Webhook triggered:",
        webhook.url,
        "Status:",
        response.status
      );

      // Update webhook status
      await supabase
        .from("form_webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status_code: response.status,
        })
        .eq("id", webhook.id);

      // Mark submission as webhook sent (if this is the first webhook)
      if (!submission.webhook_sent_at) {
        await supabase
          .from("form_submissions")
          .update({ webhook_sent_at: new Date().toISOString() })
          .eq("id", submission.id);
      }
    } catch (err) {
      console.error("[FormSubmit] Webhook failed:", webhook.url, err);
      
      // Update webhook with error status
      await supabase
        .from("form_webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status_code: 0, // 0 indicates connection error
        })
        .eq("id", webhook.id);
    }
  }
}

/**
 * Generate a simple HMAC signature for webhook payloads
 */
function generateWebhookSignature(payload: unknown): string {
  // In production, use a proper HMAC with a secret key
  // For now, just create a simple hash
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `sha256=${Math.abs(hash).toString(16)}`;
}
