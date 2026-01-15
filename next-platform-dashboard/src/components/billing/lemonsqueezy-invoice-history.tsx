"use client";

import { format } from "date-fns";
import { Download, ExternalLink, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Invoice } from "@/types/payments";

interface LemonSqueezyInvoiceHistoryProps {
  invoices: Invoice[];
}

const statusConfig = {
  paid: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
  pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-100" },
  refunded: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-100" },
};

export function LemonSqueezyInvoiceHistory({ invoices }: LemonSqueezyInvoiceHistoryProps) {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No invoices yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices will appear here after your first payment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const status = statusConfig[invoice.status] || statusConfig.paid;
              const StatusIcon = status.icon;

              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium font-mono text-sm">
                    #{invoice.lemonsqueezy_order_id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${status.bg} ${status.color} border-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {invoice.invoice_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.invoice_url, "_blank")}
                          title="View Invoice"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {invoice.receipt_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.receipt_url, "_blank")}
                          title="Download Receipt"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
