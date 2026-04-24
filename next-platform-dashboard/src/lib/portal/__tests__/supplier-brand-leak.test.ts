/**
 * Session 6C — Supplier-brand leak audit.
 *
 * Asserts that every documented supplier-brand token is stripped by
 * the portal supplier-brand scrubber, both at the column level and
 * the text level. Regressions here would mean a portal client can see
 * upstream vendor identity, which is an explicit platform invariant.
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  isBrandedColumn,
  stripSupplierBrandDeep,
  stripSupplierBrandRow,
  stripSupplierBrandText,
} from "../supplier-brand";

const TOKEN_COLUMNS = [
  "resellerclub_order_id",
  "reseller_club_ref",
  "titan_mailbox",
  "titanmail_id",
  "titan_mail_domain",
  "resend_message_id",
  "sendgrid_message_id",
  "mailgun_id",
  "postmark_message_id",
  "twilio_sid",
  "cloudflare_zone_id",
  "rcpl_reference",
  "logicboxes_order",
];

const PREFIX_COLUMNS = [
  "provider_id",
  "provider_message_id",
  "rc_order_id",
  "rc_customer_id",
  "tm_order_id",
  "tm_status",
];

describe("supplier-brand scrubber - token coverage", () => {
  for (const col of [...TOKEN_COLUMNS, ...PREFIX_COLUMNS]) {
    it(`flags "${col}" as a branded column`, () => {
      expect(isBrandedColumn(col)).toBe(true);
    });
  }

  it("preserves neutral columns", () => {
    expect(isBrandedColumn("id")).toBe(false);
    expect(isBrandedColumn("name")).toBe(false);
    expect(isBrandedColumn("total_cents")).toBe(false);
    expect(isBrandedColumn("created_at")).toBe(false);
    expect(isBrandedColumn("customer_email")).toBe(false);
  });
});

describe("stripSupplierBrandRow", () => {
  it("removes every branded column and keeps neutral ones", () => {
    const row = {
      id: "row1",
      name: "Order #1",
      total_cents: 1234,
      provider_id: "abc",
      provider_message_id: "msg-x",
      rc_customer_id: "rcid",
      titan_mailbox_id: "mx-1",
      resellerclub_order_id: "rco-1",
      cloudflare_zone_id: "cf-1",
      twilio_sid: "tw",
    };
    const cleaned = stripSupplierBrandRow(row)!;
    expect(cleaned.id).toBe("row1");
    expect(cleaned.name).toBe("Order #1");
    expect(cleaned.total_cents).toBe(1234);
    for (const k of [
      "provider_id",
      "provider_message_id",
      "rc_customer_id",
      "titan_mailbox_id",
      "resellerclub_order_id",
      "cloudflare_zone_id",
      "twilio_sid",
    ]) {
      expect(cleaned).not.toHaveProperty(k);
    }
  });

  it("returns null for null/undefined inputs", () => {
    expect(stripSupplierBrandRow(null)).toBeNull();
    expect(stripSupplierBrandRow(undefined)).toBeNull();
  });
});

describe("stripSupplierBrandText", () => {
  it.each([
    ["ResellerClub error: invalid auth", "reseller"],
    ["Reseller Club timed out", "reseller"],
    ["TitanMail returned 500", "titan"],
    ["titan mail mailbox full", "titan"],
    ["Twilio webhook failed", "twilio"],
    ["Sent via SendGrid", "sendgrid"],
    ["Mailgun bounce", "mailgun"],
    ["Postmark rejected", "postmark"],
    ["Resend message not found", "resend"],
    ["logicboxes ticket closed", "logicboxes"],
    ["rcpl order canceled", "rcpl"],
  ])("scrubs \"%s\"", (source, token) => {
    const out = stripSupplierBrandText(source).toLowerCase();
    expect(out).not.toContain(token);
  });

  it("returns empty string for null/undefined", () => {
    expect(stripSupplierBrandText(null)).toBe("");
    expect(stripSupplierBrandText(undefined)).toBe("");
  });
});

describe("stripSupplierBrandDeep", () => {
  it("applies both column strip and text strip", () => {
    const row = {
      id: "r1",
      last_error_message: "ResellerClub returned 500",
      provider_id: "abc",
      note: "Delivered by SendGrid",
    };
    const cleaned = stripSupplierBrandDeep(row)!;
    expect(cleaned).not.toHaveProperty("provider_id");
    expect(String(cleaned.last_error_message).toLowerCase()).not.toContain(
      "reseller",
    );
    expect(String(cleaned.note).toLowerCase()).not.toContain("sendgrid");
    expect(cleaned.id).toBe("r1");
  });
});
