// src/app/api/developer/statements/[payoutId]/route.ts
// Phase EM-43: Revenue Sharing Dashboard - Statement API

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revenueService, payoutService } from "@/lib/revenue";
import { DEFAULT_LOCALE } from "@/lib/locale-config";

interface RouteParams {
  params: Promise<{ payoutId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get developer profile
    const developerProfile = await revenueService.getDeveloperProfile(user.id);

    if (!developerProfile) {
      return NextResponse.json(
        { error: "Developer profile not found" },
        { status: 404 }
      );
    }

    const { payoutId } = await params;

    // Get payout details
    const payout = await payoutService.getPayoutDetails(payoutId);

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    // Verify ownership
    if (payout.developer_id !== developerProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate statement HTML (could be PDF in production)
    const statementHtml = generateStatementHtml(payout);

    return new NextResponse(statementHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Statement API error:", error);
    return NextResponse.json(
      { error: "Failed to generate statement" },
      { status: 500 }
    );
  }
}

function generateStatementHtml(
  payout: Awaited<ReturnType<typeof payoutService.getPayoutDetails>>
): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency: payout.currency,
    }).format(amount);

  const lineItemsHtml = payout.line_items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.amount)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Earnings Statement - ${payout.id}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #333;
        }
        h1 { color: #111; margin-bottom: 8px; }
        .subtitle { color: #666; margin-bottom: 32px; }
        .summary-card {
          background: #f9fafb;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 32px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .summary-row.total {
          border-top: 2px solid #333;
          margin-top: 16px;
          padding-top: 16px;
          font-weight: bold;
          font-size: 1.2em;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #333; }
        .print-btn {
          background: #333;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 24px;
        }
        @media print {
          .print-btn { display: none; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Print Statement</button>
      
      <h1>Earnings Statement</h1>
      <p class="subtitle">
        Period: ${new Date(payout.period_start).toLocaleDateString()} - ${new Date(payout.period_end).toLocaleDateString()}
      </p>
      
      <div class="summary-card">
        <div class="summary-row">
          <span>Gross Earnings</span>
          <span>${formatCurrency(payout.gross_earnings)}</span>
        </div>
        <div class="summary-row">
          <span>Platform Fees</span>
          <span>-${formatCurrency(payout.platform_fees)}</span>
        </div>
        <div class="summary-row">
          <span>Refunds</span>
          <span>-${formatCurrency(payout.refunds)}</span>
        </div>
        ${
          payout.adjustments
            ? `
        <div class="summary-row">
          <span>Adjustments</span>
          <span>${formatCurrency(payout.adjustments)}</span>
        </div>
        `
            : ""
        }
        <div class="summary-row total">
          <span>Net Payout</span>
          <span>${formatCurrency(payout.payout_amount)}</span>
        </div>
      </div>
      
      <h2>Transaction Details</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml || '<tr><td colspan="2" style="padding: 16px; text-align: center; color: #666;">No line items</td></tr>'}
        </tbody>
      </table>
      
      <p style="margin-top: 48px; color: #666; font-size: 0.9em;">
        Statement ID: ${payout.id}<br>
        Generated: ${new Date().toLocaleString()}<br>
        Status: ${payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
        ${payout.processed_at ? `<br>Processed: ${new Date(payout.processed_at).toLocaleString()}` : ""}
      </p>
    </body>
    </html>
  `;
}
