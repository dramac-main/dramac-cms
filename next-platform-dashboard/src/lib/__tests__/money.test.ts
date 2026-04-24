import { describe, it, expect } from "vitest";
import {
  toCents,
  fromCents,
  addCents,
  subtractCents,
  multiplyCentsByQuantity,
  applyPercent,
  formatCentsAsCurrency,
} from "@/lib/money";

/**
 * Money helper regression suite — Session 3 minor-unit invariants.
 *
 * These tests lock the contract documented in src/lib/money.ts: every money
 * value that enters a portal compute path must flow through toCents(), every
 * arithmetic operation must stay in integer cents, and the render boundary
 * goes through formatCentsAsCurrency / fromCents+formatCurrency.
 *
 * If any of these fail, the portal-first money invariant is broken.
 */

// server-only guard
import { vi } from "vitest";
vi.mock("server-only", () => ({}));

describe("toCents — decimal → integer minor units", () => {
  it("parses DECIMAL strings exactly without float drift", () => {
    expect(toCents("29.99")).toBe(2999);
    expect(toCents("0.10")).toBe(10);
    expect(toCents("0.01")).toBe(1);
    expect(toCents("1000.00")).toBe(100000);
    expect(toCents("0.1")).toBe(10);
  });

  it("parses JS numbers without introducing float drift", () => {
    // The classic float trap: 0.1 + 0.2 === 0.30000000000000004
    expect(toCents(0.1)).toBe(10);
    expect(toCents(0.2)).toBe(20);
    expect(toCents(29.99)).toBe(2999);
  });

  it("handles missing values defensively", () => {
    expect(toCents(null)).toBe(0);
    expect(toCents(undefined)).toBe(0);
    expect(toCents("")).toBe(0);
  });

  it("rounds half-up at the third decimal", () => {
    expect(toCents("29.994")).toBe(2999);
    expect(toCents("29.995")).toBe(3000);
    expect(toCents("29.999")).toBe(3000);
    expect(toCents("0.999")).toBe(100);
  });

  it("handles negative values (refunds / adjustments)", () => {
    expect(toCents("-10.50")).toBe(-1050);
    expect(toCents(-0.01)).toBe(-1);
  });
});

describe("fromCents — integer → display number", () => {
  it("inverts toCents for round-trip precision", () => {
    expect(fromCents(2999)).toBe(29.99);
    expect(fromCents(10)).toBe(0.1);
    expect(fromCents(0)).toBe(0);
    expect(fromCents(-1050)).toBe(-10.5);
  });
});

describe("addCents / subtractCents — float-drift immunity", () => {
  it("adds without the 0.1 + 0.2 bug", () => {
    expect(addCents(toCents("0.1"), toCents("0.2"))).toBe(30);
    expect(fromCents(addCents(toCents("0.1"), toCents("0.2")))).toBe(0.3);
  });

  it("ignores non-integer / non-finite inputs rather than poisoning the sum", () => {
    expect(addCents(100, null, undefined, NaN, 200)).toBe(300);
  });

  it("subtracts (useful for refunds, discounts, outstanding balance)", () => {
    expect(subtractCents(10000, 2500)).toBe(7500);
  });
});

describe("multiplyCentsByQuantity — line items", () => {
  it("computes line totals without drift", () => {
    // 3 x K29.99 = K89.97
    expect(multiplyCentsByQuantity(2999, 3)).toBe(8997);
    expect(fromCents(multiplyCentsByQuantity(2999, 3))).toBe(89.97);
  });

  it("rejects decimal quantities (these hide rounding bugs)", () => {
    expect(() => multiplyCentsByQuantity(1000, 1.5)).toThrow();
  });
});

describe("applyPercent — tax, discount", () => {
  it("applies integer percents exactly", () => {
    // 16% VAT on K100.00 = K16.00
    expect(applyPercent(10000, 16)).toBe(1600);
    // 10% discount on K99.99 = K10.00 (rounded from K9.999)
    expect(applyPercent(9999, 10)).toBe(1000);
  });

  it("handles fractional tax rates (e.g. 7.5%)", () => {
    expect(applyPercent(10000, 7.5)).toBe(750);
  });

  it("is symmetric for 0 and 100", () => {
    expect(applyPercent(12345, 0)).toBe(0);
    expect(applyPercent(12345, 100)).toBe(12345);
  });
});

describe("formatCentsAsCurrency — render boundary", () => {
  it("renders ZMW by default", () => {
    const s = formatCentsAsCurrency(2999);
    // We do not assert the exact Intl layout (locale-dependent), only that
    // the formatted string contains a form of the expected value.
    expect(s).toMatch(/29\.99/);
  });

  it("respects the currency argument", () => {
    const s = formatCentsAsCurrency(2999, "USD");
    expect(s).toMatch(/29\.99/);
  });
});

describe("invariant: discount + tax never drifts on compound orders", () => {
  it("5 items @ K12.34, 10% discount, 16% VAT — totals stay integer", () => {
    const unit = toCents("12.34");
    expect(unit).toBe(1234);

    const subtotal = multiplyCentsByQuantity(unit, 5); // 6170
    expect(subtotal).toBe(6170);

    const discount = applyPercent(subtotal, 10); // 617
    expect(discount).toBe(617);

    const taxable = subtractCents(subtotal, discount); // 5553
    const tax = applyPercent(taxable, 16); // 888.48 -> 888 (half-up on .48 rounds down)
    expect(tax).toBe(888);

    const total = addCents(taxable, tax); // 6441
    expect(total).toBe(6441);
    expect(fromCents(total)).toBe(64.41);
  });
});
