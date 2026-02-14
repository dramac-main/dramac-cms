// GET /api/debug/outbound-ip
// Shows what IP external services see from this server (for ResellerClub whitelist)

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch from multiple IP-echo services
    const checks = await Promise.allSettled([
      fetch('https://api.ipify.org?format=json').then(r => r.json()),
      fetch('https://ifconfig.me/all.json').then(r => r.json()),
      fetch('https://icanhazip.com').then(r => r.text()),
    ]);
    
    const results: Record<string, unknown> = {};
    
    if (checks[0].status === 'fulfilled') {
      results.ipify = checks[0].value;
    }
    if (checks[1].status === 'fulfilled') {
      results.ifconfig = checks[1].value;
    }
    if (checks[2].status === 'fulfilled') {
      results.icanhazip = (checks[2].value as string).trim();
    }
    
    return NextResponse.json({
      message: 'These are the IPs external services see from this server. Whitelist them in ResellerClub → Settings → API.',
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch outbound IP' },
      { status: 500 }
    );
  }
}
