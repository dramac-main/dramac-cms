"use client";

/**
 * InsightsHub — AI Financial Intelligence page
 *
 * Phase INV-11: Composes AI components into a full insights page.
 * - Cash Flow Forecast chart
 * - AI Insights panel
 * - Invoice Suggestions
 * - Financial Chatbox
 */

import { AiInsightsPanel } from "./ai-insights-panel";
import { CashFlowForecastChart } from "./cash-flow-forecast-chart";
import { InvoiceSuggestions } from "./invoice-suggestions";
import { FinancialChatbox } from "./financial-chatbox";

export function InsightsHub() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          AI Financial Insights
        </h2>
        <p className="text-muted-foreground">
          Predictions, smart suggestions, and financial intelligence powered by
          AI.
        </p>
      </div>

      {/* Row 1: Forecast + Insights panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashFlowForecastChart />
        </div>
        <div className="lg:col-span-1">
          <AiInsightsPanel />
        </div>
      </div>

      {/* Row 2: Suggestions */}
      <InvoiceSuggestions />

      {/* Row 3: Financial Chatbox */}
      <FinancialChatbox />
    </div>
  );
}
