/**
 * Catch-all dispatcher for billing/paddle sub-routes.
 *
 * Consolidates 11 individual paddle route files into a single catch-all
 * to reduce the Vercel route count (each route file counts toward
 * the 2048 route limit). All original URLs continue to work.
 *
 * Note: The main /api/billing/paddle/route.ts (webhook handler) is NOT
 * affected — it remains as a separate route file.
 */

import { NextRequest, NextResponse } from "next/server";

type RouteModule = {
  GET?: (req: NextRequest | Request) => Promise<Response>;
  POST?: (req: NextRequest | Request) => Promise<Response>;
};

const handlers: Record<string, () => Promise<RouteModule>> = {
  checkout: () => import("../checkout/handler"),
  invoices: () => import("../invoices/handler"),
  products: () => import("../products/handler"),
  subscription: () => import("../subscription/handler"),
  "subscription/cancel": () => import("../subscription/cancel/handler"),
  "subscription/pause": () => import("../subscription/pause/handler"),
  "subscription/reactivate": () => import("../subscription/reactivate/handler"),
  "subscription/resume": () => import("../subscription/resume/handler"),
  "subscription/update-payment": () =>
    import("../subscription/update-payment/handler"),
  usage: () => import("../usage/handler"),
  "verify-price": () => import("../verify-price/handler"),
};

const notFound = NextResponse.json({ error: "Not found" }, { status: 404 });
const methodNotAllowed = NextResponse.json(
  { error: "Method not allowed" },
  { status: 405 },
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const key = path.join("/");

  const loader = handlers[key];
  if (!loader) return notFound;

  const mod = await loader();
  if (!mod.GET) return methodNotAllowed;
  return mod.GET(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const key = path.join("/");

  const loader = handlers[key];
  if (!loader) return notFound;

  const mod = await loader();
  if (!mod.POST) return methodNotAllowed;
  return mod.POST(request);
}
