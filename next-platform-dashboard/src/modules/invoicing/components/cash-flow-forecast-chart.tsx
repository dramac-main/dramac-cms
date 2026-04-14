"use client";

/**
 * Cash Flow Forecast Chart
 *
 * Phase INV-11: Line chart showing predicted income/expenses for future months
 * with confidence bands. Uses Recharts.
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getCashFlowForecast } from "../actions/ai-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { CashFlowForecast } from "../types/ai-types";

interface CashFlowForecastChartProps {
  currency?: string;
}

export function CashFlowForecastChart({
  currency = "ZMW",
}: CashFlowForecastChartProps) {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadForecast = () => {
    if (!siteId) return;
    setLoading(true);
    setError(null);
    getCashFlowForecast(siteId, 3)
      .then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          setForecast(result.data);
        }
      })
      .catch(() => setError("Failed to generate forecast"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const chartData = (forecast?.months || []).map((m) => ({
    month: m.month,
    Income: m.predictedIncome / 100,
    Expenses: m.predictedExpenses / 100,
    "Net Cash": m.predictedNetCash / 100,
    confidence: Math.round(m.confidence * 100),
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Cash Flow Forecast
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadForecast}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Generate"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !forecast && (
          <Skeleton className="h-[300px] w-full" />
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-2">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={loadForecast}>
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && !forecast && (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-2">
            <TrendingUp className="h-8 w-8" />
            <p className="text-sm">Click Generate to create a cash flow forecast</p>
          </div>
        )}

        {forecast && chartData.length > 0 && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis
                  className="text-xs"
                  tickFormatter={(v) =>
                    formatInvoiceAmount(Math.round(v * 100), currency)
                  }
                />
                <Tooltip
                  formatter={((value: number) =>
                    formatInvoiceAmount(Math.round(value * 100), currency)
                  ) as any}
                  labelFormatter={((label: string) => `Month: ${label}`) as any}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Income"
                  stroke="#22c55e"
                  fill="#22c55e40"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Expenses"
                  stroke="#ef4444"
                  fill="#ef444440"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Net Cash"
                  stroke="#3b82f6"
                  fill="#3b82f640"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Summary & Alerts */}
            {forecast.summary && (
              <p className="text-sm text-muted-foreground">{forecast.summary}</p>
            )}

            {forecast.alerts.length > 0 && (
              <div className="space-y-1">
                {forecast.alerts.map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400"
                  >
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Confidence indicators */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              {chartData.map((d) => (
                <span key={d.month}>
                  {d.month}: {d.confidence}% confidence
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
