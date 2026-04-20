"use client";

import { useState, useEffect } from "react";
import type { ThreeWayMatchLine, MatchStatus } from "../types";
import { getThreeWayMatchData } from "../actions/purchase-order-actions";
import { AmountDisplay } from "./amount-display";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompareArrows, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ThreeWayMatchProps {
  siteId: string;
  billId: string;
  currency: string;
  trigger?: React.ReactNode;
}

function getMatchBadge(status: MatchStatus) {
  switch (status) {
    case "full_match":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Match
        </Badge>
      );
    case "partial_match":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Partial
        </Badge>
      );
    case "unmatched":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="h-3 w-3 mr-1" />
          Mismatch
        </Badge>
      );
  }
}

function getOverallStatus(lines: ThreeWayMatchLine[]): {
  status: MatchStatus;
  label: string;
} {
  if (lines.length === 0) return { status: "unmatched", label: "No data" };
  const allMatch = lines.every((l) => l.matchStatus === "full_match");
  const anyMismatch = lines.some((l) => l.matchStatus === "unmatched");
  if (allMatch) return { status: "full_match", label: "Full Match" };
  if (anyMismatch) return { status: "unmatched", label: "Discrepancies Found" };
  return { status: "partial_match", label: "Partial Match" };
}

export function ThreeWayMatch({
  siteId,
  billId,
  currency,
  trigger,
}: ThreeWayMatchProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchLines, setMatchLines] = useState<ThreeWayMatchLine[]>([]);
  const [poNumber, setPoNumber] = useState("");
  const [billNumber, setBillNumber] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getThreeWayMatchData(siteId, billId);
      if (!data) {
        toast.error("This bill is not linked to a purchase order");
        setOpen(false);
        return;
      }

      setPoNumber(data.poNumber);
      setBillNumber(data.billNumber);

      // Build match lines from PO line items (source of truth for line count)
      const lines: ThreeWayMatchLine[] = data.poLineItems.map((poLine, idx) => {
        const billLine = data.billLineItems[idx];
        const orderedQty = poLine.quantity;
        const billedQty = billLine?.quantity || 0;
        const receivedQty = data.receivedByLine[idx] || 0;

        // Determine match status
        let matchStatus: MatchStatus;
        if (
          orderedQty === billedQty &&
          orderedQty === receivedQty
        ) {
          matchStatus = "full_match";
        } else if (
          billedQty > 0 &&
          receivedQty > 0 &&
          (billedQty !== orderedQty || receivedQty !== orderedQty)
        ) {
          matchStatus = "partial_match";
        } else {
          matchStatus = "unmatched";
        }

        return {
          lineIndex: idx,
          itemName: poLine.name,
          orderedQty,
          billedQty,
          receivedQty,
          matchStatus,
          variance: orderedQty - receivedQty,
        };
      });

      // Check for extra bill lines not in PO
      if (data.billLineItems.length > data.poLineItems.length) {
        for (let i = data.poLineItems.length; i < data.billLineItems.length; i++) {
          lines.push({
            lineIndex: i,
            itemName: data.billLineItems[i].name + " (extra)",
            orderedQty: 0,
            billedQty: data.billLineItems[i].quantity,
            receivedQty: 0,
            matchStatus: "unmatched",
            variance: -data.billLineItems[i].quantity,
          });
        }
      }

      setMatchLines(lines);
    } catch (err: any) {
      toast.error(err.message || "Failed to load match data");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadData();
  }, [open]);

  const overall = getOverallStatus(matchLines);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <GitCompareArrows className="h-4 w-4 mr-1.5" />
            Match with PO
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Three-Way Match</DialogTitle>
          <DialogDescription>
            Comparing Purchase Order ↔ Bill ↔ Goods Receipt
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">PO</div>
                  <div className="font-mono text-sm font-medium">{poNumber}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Bill</div>
                  <div className="font-mono text-sm font-medium">{billNumber}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-0.5">{getMatchBadge(overall.status)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Match table */}
            <div className="max-h-[350px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchLines.map((line) => (
                    <TableRow
                      key={line.lineIndex}
                      className={
                        line.matchStatus === "unmatched"
                          ? "bg-red-50 dark:bg-red-950/20"
                          : line.matchStatus === "partial_match"
                            ? "bg-yellow-50 dark:bg-yellow-950/20"
                            : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {line.itemName}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.orderedQty}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.billedQty}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.receivedQty}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {line.variance !== 0 ? (
                          <span
                            className={
                              line.variance > 0
                                ? "text-amber-600"
                                : "text-red-600"
                            }
                          >
                            {line.variance > 0
                              ? `+${line.variance}`
                              : line.variance}
                          </span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {getMatchBadge(line.matchStatus)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {matchLines.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No line items to compare
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Resolution hints */}
            {overall.status !== "full_match" && matchLines.length > 0 && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <strong>Discrepancies detected.</strong> Review the variances
                above. Positive variance means under-received; negative means
                over-billed. You can accept variances, create a credit note, or
                flag for review.
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
