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
}

export async function POST(req: NextRequest) {
  try {
    const payload: ErrorLogPayload = await req.json();

    // Get user info if available
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
      user_id: user?.id,
      user_email: user?.email,
      timestamp: payload.timestamp,
      environment: process.env.NODE_ENV,
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
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

    // Optionally store in database for analysis
    // This can be enabled when an error_logs table is created
    /*
    await supabase.from('error_logs').insert({
      message: errorLog.message,
      stack: errorLog.stack,
      module_name: errorLog.module_name,
      site_id: errorLog.site_id,
      user_id: errorLog.user_id,
      url: errorLog.url,
      metadata: {
        component_stack: errorLog.component_stack,
        user_agent: errorLog.user_agent,
        app_version: errorLog.app_version,
      },
    });
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't fail if logging fails - this would cause recursive errors
    console.error('Error logging failed:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'error-logging' });
}
