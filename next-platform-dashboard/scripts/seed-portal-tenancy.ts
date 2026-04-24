#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Portal tenancy seed — deterministic fixtures for Session 1.
 *
 * Creates 2 agencies × 2 clients/agency × 2 sites/client so the portal
 * foundation can be exercised with realistic cross-tenant data. Idempotent:
 * re-running will upsert against the deterministic UUIDs defined below.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/seed-portal-tenancy.ts
 *
 * The script intentionally avoids Supabase Auth (invite emails etc.) —
 * it only populates application tables. Auth users for the seeded
 * clients should be linked via `clients.portal_user_id` in a later step.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// --- Deterministic IDs --------------------------------------------------
// Using a readable prefix makes these easy to spot in Supabase.

const AGENCY_A = "aaaaaaa1-0000-0000-0000-000000000001";
const AGENCY_B = "aaaaaaa2-0000-0000-0000-000000000002";

const CLIENTS = [
  { id: "c1111111-0000-0000-0000-000000000001", agency: AGENCY_A, name: "Acme Ltd" },
  { id: "c1111111-0000-0000-0000-000000000002", agency: AGENCY_A, name: "Beta Co" },
  { id: "c2222222-0000-0000-0000-000000000001", agency: AGENCY_B, name: "Gamma Inc" },
  { id: "c2222222-0000-0000-0000-000000000002", agency: AGENCY_B, name: "Delta Corp" },
];

const SITES = CLIENTS.flatMap((c, i) => [
  {
    id: `${c.id.slice(0, 8)}-aaaa-4aaa-8aaa-${String(i * 2 + 1).padStart(12, "0")}`,
    client_id: c.id,
    agency_id: c.agency,
    name: `${c.name} — Primary`,
    subdomain: `${c.name.toLowerCase().replace(/[^a-z]/g, "")}-primary`,
    published: true,
  },
  {
    id: `${c.id.slice(0, 8)}-bbbb-4bbb-8bbb-${String(i * 2 + 2).padStart(12, "0")}`,`
    client_id: c.id,
    agency_id: c.agency,
    name: `${c.name} — Secondary`,
    subdomain: `${c.name.toLowerCase().replace(/[^a-z]/g, "")}-secondary`,
    published: false,
  },
]);

async function seed() {
  console.log("Seeding portal tenancy fixtures…");

  // Agencies
  // NOTE: owner_id is NOT NULL in the agencies table — set to the admin user.
  // Replace this with the actual agency owner's auth.users id in production.
  const AGENCY_OWNER_ID = process.env.SUPABASE_AGENCY_OWNER_ID ?? "e9270737-2278-4693-8cbf-b84a44ea736e";

  const { error: agencyErr } = await admin.from("agencies").upsert(
    [
      { id: AGENCY_A, name: "Agency Alpha", slug: "agency-alpha", owner_id: AGENCY_OWNER_ID },
      { id: AGENCY_B, name: "Agency Beta",  slug: "agency-beta",  owner_id: AGENCY_OWNER_ID },
    ],
    { onConflict: "id" },
  );
  if (agencyErr) throw agencyErr;
  console.log("  ✓ agencies");

  // Clients — permissions default to true so the dashboard renders all panels.
  const clientRows = CLIENTS.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.name,
    email: `${c.name.toLowerCase().replace(/[^a-z]/g, "")}@example.test`,
    agency_id: c.agency,
    has_portal_access: true,
    can_view_analytics: true,
    can_view_invoices: true,
    can_manage_live_chat: true,
    can_manage_orders: true,
    can_manage_products: true,
    can_manage_bookings: true,
    can_manage_crm: true,
    can_manage_automation: true,
    can_manage_quotes: true,
    can_manage_agents: true,
    can_manage_customers: true,
    can_manage_marketing: true,
    can_manage_invoices: true,
  }));
  const { error: clientErr } = await admin
    .from("clients")
    .upsert(clientRows, { onConflict: "id" });
  if (clientErr) throw clientErr;
  console.log(`  ✓ clients (${clientRows.length})`);

  // Sites
  const { error: siteErr } = await admin
    .from("sites")
    .upsert(SITES, { onConflict: "id" });
  if (siteErr) throw siteErr;
  console.log(`  ✓ sites (${SITES.length})`);

  console.log(
    "\nDone. Fixtures:\n" +
      `  Agency A: ${AGENCY_A}\n` +
      `  Agency B: ${AGENCY_B}\n` +
      `  Clients : ${CLIENTS.map((c) => c.id).join(", ")}\n` +
      `  Sites   : ${SITES.length} total`,
  );
  console.log(
    "\nNext steps: link each client's `portal_user_id` to a Supabase auth user to enable sign-in.",
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
