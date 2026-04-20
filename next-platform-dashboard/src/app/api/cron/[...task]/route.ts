/**
 * Catch-all dispatcher for cron sub-routes.
 *
 * Consolidates 9 individual cron route files into a single catch-all
 * to reduce the Vercel route count (each route file counts toward
 * the 2048 route limit). All original URLs continue to work.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteHandler = {
  GET: (req: NextRequest) => Promise<Response>;
};

const handlers: Record<string, () => Promise<RouteHandler>> = {
  "abandoned-carts": () => import("../abandoned-carts/handler"),
  "auto-close-chats": () => import("../auto-close-chats/handler"),
  chat: () => import("../chat/handler"),
  "domain-auto-renew": () => import("../domain-auto-renew/handler"),
  "domain-expiry-notifications": () =>
    import("../domain-expiry-notifications/handler"),
  "domain-health": () => import("../domain-health/handler"),
  domains: () => import("../domains/handler"),
  "email-auto-renew": () => import("../email-auto-renew/handler"),
  "email-expiry-notifications": () =>
    import("../email-expiry-notifications/handler"),
  "marketing-scheduler": () => import("../marketing-scheduler/handler"),
  "resellerclub-sync": () => import("../resellerclub-sync/handler"),
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ task: string[] }> },
) {
  const { task } = await params;
  const key = task.join("/");

  const loader = handlers[key];
  if (!loader) {
    return NextResponse.json(
      { error: `Unknown cron task: ${key}` },
      { status: 404 },
    );
  }

  const mod = await loader();
  return mod.GET(request);
}
