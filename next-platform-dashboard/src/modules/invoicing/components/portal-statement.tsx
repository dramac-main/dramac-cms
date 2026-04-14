"use client";

/**
 * Portal Statement Component — INV-09
 *
 * Statement of account — transaction table with running balance,
 * date range selector.
 */

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Loader2 } from "lucide-react";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import {
  getClientStatement,
  type ClientStatement,
} from "../actions/statement-actions";

interface PortalStatementProps {
  siteId: string;
  clientId: string;
  currency?: string;
}

export function PortalStatement({
  siteId,
  clientId,
  currency = "ZMW",
}: PortalStatementProps) {
  const [isPending, startTransition] = useTransition();
  const [statement, setStatement] = useState<ClientStatement | null>(null);

  // Default range: last 12 months
  const today = new Date();
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const [startDate, setStartDate] = useState(
    yearAgo.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await getClientStatement(siteId, clientId, {
          start: startDate,
          end: endDate,
        });
        setStatement(result);
      } catch {
        // Silent fail
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statement of Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>From</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>To</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Statement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statement Results */}
      {statement && (
        <>
          {/* Client info + Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{statement.client.name}</h3>
                  {statement.client.email && (
                    <p className="text-sm text-muted-foreground">
                      {statement.client.email}
                    </p>
                  )}
                  {statement.client.address && (
                    <p className="text-sm text-muted-foreground">
                      {statement.client.address}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Period: {statement.period.start} to {statement.period.end}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Opening Balance</p>
                  <p className="font-semibold">
                    {formatInvoiceAmount(statement.openingBalance, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Invoiced</p>
                  <p className="font-semibold">
                    {formatInvoiceAmount(statement.totalInvoiced, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Paid</p>
                  <p className="font-semibold text-green-600">
                    {formatInvoiceAmount(statement.totalPaid, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Closing Balance</p>
                  <p className="font-semibold text-lg">
                    {formatInvoiceAmount(statement.closingBalance, currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {statement.transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3" />
                  <p className="text-sm">No transactions in this period</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Opening balance row */}
                      <TableRow className="bg-muted/50">
                        <TableCell>{statement.period.start}</TableCell>
                        <TableCell colSpan={3}>
                          <strong>Opening Balance</strong>
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell className="text-right font-medium">
                          {formatInvoiceAmount(
                            statement.openingBalance,
                            currency,
                          )}
                        </TableCell>
                      </TableRow>

                      {statement.transactions.map((tx, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{tx.date}</TableCell>
                          <TableCell>
                            <TypeBadge type={tx.type} />
                          </TableCell>
                          <TableCell className="font-medium">
                            {tx.reference}
                          </TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell className="text-right">
                            {tx.debit > 0
                              ? formatInvoiceAmount(tx.debit, currency)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {tx.credit > 0
                              ? formatInvoiceAmount(tx.credit, currency)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatInvoiceAmount(tx.balance, currency)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Closing balance row */}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>{statement.period.end}</TableCell>
                        <TableCell colSpan={3}>
                          <strong>Closing Balance</strong>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatInvoiceAmount(
                            statement.totalInvoiced,
                            currency,
                          )}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatInvoiceAmount(
                            statement.totalPaid + statement.totalCredits,
                            currency,
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatInvoiceAmount(
                            statement.closingBalance,
                            currency,
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: "invoice" | "payment" | "credit" }) {
  const config: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" }
  > = {
    invoice: { label: "Invoice", variant: "outline" },
    payment: { label: "Payment", variant: "default" },
    credit: { label: "Credit", variant: "secondary" },
  };
  const c = config[type] || config.invoice;
  return (
    <Badge variant={c.variant} className="text-xs">
      {c.label}
    </Badge>
  );
}
