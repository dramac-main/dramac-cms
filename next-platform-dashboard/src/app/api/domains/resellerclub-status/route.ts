// GET /api/domains/resellerclub-status
// Diagnostic: check if ResellerClub API is configured and reachable (e.g. after IP whitelist).

import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/resellerclub/config';
import { isClientAvailable, getResellerClubClient } from '@/lib/resellerclub/client';

export async function GET() {
  try {
    const configured = isConfigured();
    if (!configured) {
      return NextResponse.json({
        configured: false,
        reachable: false,
        message: 'ResellerClub is not configured. Set RESELLERCLUB_RESELLER_ID and RESELLERCLUB_API_KEY.',
      });
    }
    if (!isClientAvailable()) {
      return NextResponse.json({
        configured: true,
        reachable: false,
        message: 'Client not available.',
      });
    }
    const client = getResellerClubClient();
    const ok = await client.healthCheck();
    if (ok) {
      return NextResponse.json({
        configured: true,
        reachable: true,
        message: 'ResellerClub API is reachable. Domain search will use live availability.',
      });
    }
    return NextResponse.json({
      configured: true,
      reachable: false,
      message: 'Health check failed. Ensure your server IP is whitelisted in ResellerClub → Settings → API.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        configured: isConfigured(),
        reachable: false,
        message: `ResellerClub request failed: ${message}. Check IP whitelist and credentials.`,
      },
      { status: 200 }
    );
  }
}
