/**
 * Overage Summary Component
 *
 * Phase BIL-08: Overage Billing Engine
 *
 * Displays per-metric overage breakdown with costs for the current billing period.
 * Shows historical overage charges and "added to next invoice" notice.
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Mail,
  Zap,
  HardDrive,
  ChevronDown,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { formatPrice } from "@/lib/paddle/client";
import { getOverageHistoryPaddle } from "@/lib/paddle/billing-actions";

// ============================================================================
// Types
// ============================================================================

interface OverageSummaryProps {
  agencyId: string;
  overageAutomationRuns: number;
  overageAiActions: number;
  overageEmailSends: number;
  overageFileStorageMb: number;
  overageCostCents: number;
  periodEnd?: string;
}

interface OverageHistoryItem {
  id: string;
  periodStart: string;
  periodEnd: string;
  aiActionsOverage: number;
  aiActionsCostCents: number;
  emailSendsOverage: number;
  emailSendsCostCents: number;
  automationRunsOverage: number;
  automationRunsCostCents: number;
  fileStorageOverageMb: number;
  fileStorageCostCents: number;
  totalCostCents: number;
  reportedToPaddle: boolean;
  createdAt: string;
}

// ============================================================================
// Component
// ============================================================================

export function OverageSummary({
  agencyId,
  overageAutomationRuns,
  overageAiActions,
  overageEmailSends,
  overageFileStorageMb,
  overageCostCents,
  periodEnd,
}: OverageSummaryProps) {
  const [history, setHistory] = useState<OverageHistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const hasOverage = overageCostCents > 0;

  // Current period metrics
  const metrics = [
    {
      label: "AI Actions",
      icon: Bot,
      overage: overageAiActions,
      cost: Math.round(
        overageCostCents > 0 && overageAiActions > 0
          ? (overageAiActions /
              (overageAutomationRuns +
                overageAiActions +
                overageEmailSends +
                overageFileStorageMb || 1)) *
              overageCostCents
          : 0,
      ),
    },
    {
      label: "Automation Runs",
      icon: Zap,
      overage: overageAutomationRuns,
      cost: Math.round(
        overageCostCents > 0 && overageAutomationRuns > 0
          ? (overageAutomationRuns /
              (overageAutomationRuns +
                overageAiActions +
                overageEmailSends +
                overageFileStorageMb || 1)) *
              overageCostCents
          : 0,
      ),
    },
    {
      label: "Email Sends",
      icon: Mail,
      overage: overageEmailSends,
      cost: Math.round(
        overageCostCents > 0 && overageEmailSends > 0
          ? (overageEmailSends /
              (overageAutomationRuns +
                overageAiActions +
                overageEmailSends +
                overageFileStorageMb || 1)) *
              overageCostCents
          : 0,
      ),
    },
    {
      label: "File Storage",
      icon: HardDrive,
      overage: overageFileStorageMb,
      cost: Math.round(
        overageCostCents > 0 && overageFileStorageMb > 0
          ? (overageFileStorageMb /
              (overageAutomationRuns +
                overageAiActions +
                overageEmailSends +
                overageFileStorageMb || 1)) *
              overageCostCents
          : 0,
      ),
      unit: "MB",
    },
  ].filter((m) => m.overage > 0);

  async function loadHistory() {
    if (history.length > 0) return; // Already loaded
    setLoadingHistory(true);
    const result = await getOverageHistoryPaddle(agencyId, 6);
    if (result.success && result.data) {
      setHistory(result.data);
    }
    setLoadingHistory(false);
  }

  if (!hasOverage) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Overage Charges</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="border-amber-300 text-amber-700 dark:text-amber-400"
          >
            {formatPrice(overageCostCents)}
          </Badge>
        </div>
        <CardDescription>
          Current billing period — added to your next invoice
          {periodEnd && <> (due {new Date(periodEnd).toLocaleDateString()})</>}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Per-metric breakdown */}
        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center justify-between rounded-md border border-amber-200 bg-white p-3 dark:border-amber-800 dark:bg-amber-950/30"
            >
              <div className="flex items-center gap-2">
                <metric.icon className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {metric.overage.toLocaleString()} {metric.unit ?? "extra"}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {formatPrice(metric.cost)}
              </span>
            </div>
          ))}
        </div>

        {/* Overage history collapsible */}
        <Collapsible
          open={historyOpen}
          onOpenChange={(open) => {
            setHistoryOpen(open);
            if (open) loadHistory();
          }}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Past Overage Charges
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${historyOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            {loadingHistory ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            ) : history.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No past overage charges
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {new Date(item.periodStart).toLocaleDateString()} –{" "}
                        {new Date(item.periodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatPrice(item.totalCostCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            item.reportedToPaddle ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {item.reportedToPaddle ? "Invoiced" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
