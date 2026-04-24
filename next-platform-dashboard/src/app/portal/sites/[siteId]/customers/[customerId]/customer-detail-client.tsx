"use client";

/**
 * Portal Customers — detail client (read-only).
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { PortalStatusPill } from "@/components/portal/patterns/portal-status-pill";
import type { PortalCustomerDetail } from "@/lib/portal/commerce-data-access";
import {
  formatPortalCurrency,
  formatPortalDate,
  formatPortalRelative,
} from "@/lib/portal/format";

export function CustomerDetailClient({
  siteId,
  customer,
}: {
  siteId: string;
  customer: PortalCustomerDetail;
}) {
  const fullName =
    `${customer.firstName} ${customer.lastName}`.trim() || customer.email;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/portal/sites/${siteId}/customers`}>
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> Back to customers
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">{fullName}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {customer.email}
            {customer.phone ? ` · ${customer.phone}` : ""}
          </div>
          <div className="mt-2">
            <PortalStatusPill status={customer.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent orders</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Placed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.recentOrders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link
                            href={`/portal/sites/${siteId}/orders/${o.id}`}
                            className="font-mono text-xs underline-offset-4 hover:underline"
                          >
                            {o.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <PortalStatusPill status={o.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPortalCurrency(o.totalCents, o.currency)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {o.createdAt
                            ? formatPortalRelative(o.createdAt)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lifetime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Orders" value={String(customer.ordersCount)} />
              <Row
                label="Total spent"
                value={formatPortalCurrency(customer.totalSpentCents, "USD")}
              />
              <Row
                label="Average order"
                value={formatPortalCurrency(
                  customer.averageOrderValueCents,
                  "USD",
                )}
              />
              <Row
                label="Created"
                value={
                  customer.createdAt
                    ? formatPortalDate(customer.createdAt)
                    : "—"
                }
              />
              <Row
                label="Last order"
                value={
                  customer.lastOrderAt
                    ? formatPortalDate(customer.lastOrderAt)
                    : "—"
                }
              />
              <Row
                label="Marketing opt-in"
                value={customer.acceptsMarketing ? "Yes" : "No"}
              />
            </CardContent>
          </Card>

          {customer.tags.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {customer.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
