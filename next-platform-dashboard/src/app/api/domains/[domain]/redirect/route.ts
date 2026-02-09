/**
 * Domain Redirect API Route
 *
 * Phase DM-01: Domain Management Overhaul
 * HEAD /api/domains/[domain]/redirect — Check if a domain has an active 301 redirect
 * GET  /api/domains/[domain]/redirect — Return redirect destination
 *
 * Used by proxy.ts to serve 301 redirects for old/changed domains.
 * This route uses the admin client (no user session in proxy context).
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);

  try {
    const supabase = createAdminClient();

    // domain_redirects table is not in generated types yet
    const { data: redirect } = await (supabase as any)
      .from("domain_redirects")
      .select("to_domain, redirect_type, preserve_path")
      .eq("from_domain", decodedDomain)
      .eq("active", true)
      .single();

    if (!redirect) {
      return new NextResponse(null, { status: 404 });
    }

    // Update hit counter (fire-and-forget)
    (supabase as any)
      .from("domain_redirects")
      .update({
        hit_count: (redirect.hit_count ?? 0) + 1,
        last_hit_at: new Date().toISOString(),
      })
      .eq("from_domain", decodedDomain)
      .then(() => {});

    // Return 301 with Location header for proxy to read
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return new NextResponse(null, {
      status: 301,
      headers: {
        Location: `${protocol}://${redirect.to_domain}`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);

  try {
    const supabase = createAdminClient();

    const { data: redirect } = await (supabase as any)
      .from("domain_redirects")
      .select("to_domain, redirect_type, preserve_path, hit_count, created_at")
      .eq("from_domain", decodedDomain)
      .eq("active", true)
      .single();

    if (!redirect) {
      return NextResponse.json(
        { error: "No active redirect for this domain" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      from_domain: decodedDomain,
      to_domain: redirect.to_domain,
      redirect_type: redirect.redirect_type,
      preserve_path: redirect.preserve_path,
      hit_count: redirect.hit_count,
      created_at: redirect.created_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to lookup redirect" },
      { status: 500 }
    );
  }
}
