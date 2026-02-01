// src/app/api/log-error/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ErrorLogPayload {
  message: string;
  stack?: string;
  componentStack?: string;
  module?: string;
  moduleSlug?: string;
  siteId?: string;
  url: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface BatchErrorLogPayload {
  errors: ErrorLogPayload[];
}

function isValidPayload(payload: unknown): payload is ErrorLogPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof (payload as ErrorLogPayload).message === 'string'
  );
}

function isBatchPayload(payload: unknown): payload is BatchErrorLogPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'errors' in payload &&
    Array.isArray((payload as BatchErrorLogPayload).errors)
  );
}

async function processErrorLog(
  payload: ErrorLogPayload,
  userId?: string,
  userEmail?: string
) {
  // Log structure
  const errorLog = {
    message: payload.message,
    stack: payload.stack?.slice(0, 5000), // Limit stack trace size
    component_stack: payload.componentStack?.slice(0, 2000),
    module_name: payload.module,
    module_slug: payload.moduleSlug,
    site_id: payload.siteId,
    url: payload.url,
    user_agent: payload.userAgent,
    user_id: userId,
    user_email: userEmail,
    timestamp: payload.timestamp,
    environment: process.env.NODE_ENV,
    app_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    metadata: payload.metadata,
  };

  // In production, send to monitoring service (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with monitoring service
    // await sentry.captureException(errorLog);
    
    // For now, log to console which goes to Vercel logs
    console.error('[CLIENT_ERROR]', JSON.stringify(errorLog));
  } else {
    // In development, just log to console
    console.error('[CLIENT_ERROR]', errorLog);
  }

  return errorLog;
}

export async function POST(req: NextRequest) {
  try {
    const rawPayload = await req.json();

    // Get user info if available
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Handle batch payload
    if (isBatchPayload(rawPayload)) {
      const results = await Promise.all(
        rawPayload.errors
          .filter(isValidPayload)
          .slice(0, 50) // Limit batch size
          .map(payload => processErrorLog(payload, user?.id, user?.email))
      );

      return NextResponse.json({ 
        success: true, 
        processed: results.length,
        total: rawPayload.errors.length,
      });
    }

    // Handle single payload
    if (isValidPayload(rawPayload)) {
      await processErrorLog(rawPayload, user?.id, user?.email);
      return NextResponse.json({ success: true });
    }

    // Invalid payload
    return NextResponse.json(
      { success: false, error: 'Invalid payload format' },
      { status: 400 }
    );
  } catch (error) {
    // Don't fail if logging fails - this would cause recursive errors
    console.error('Error logging failed:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'error-logging',
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  });
}
