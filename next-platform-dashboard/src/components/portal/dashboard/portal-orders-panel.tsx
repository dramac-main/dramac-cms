/**
 * PortalOrdersPanel — per-site orders summary.
 *
 * If the user lacks `canManageOrders` on the site, the DAL throws
 * `PortalAccessDeniedError`; the parent Suspense boundary renders the
 * empty/error variant. This component stays focused on the happy path.
 */

import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalEmptyState } from "@/components/portal/patterns";
import { formatCurrency } from "@/lib/locale-config";
import type { PortalDAL } from "@/lib/portal/data-access";

interface PortalOrdersPanelProps {
  dal: PortalDAL;
  siteId: string;
}

export async function PortalOrdersPanel({
  dal,
  siteId,
}: PortalOrdersPanelProps) {
  const summary = await dal.orders.summaryForSite(siteId);

  const revenue = formatCurrency(summary.totalRevenueCents / 100);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ShoppingCart className="h-4 w-4" aria-hidden />
          Orders
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {summary.totalOrders} total
        </span>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold">{summary.pendingOrders}</p>
          <p className="text-sm text-muted-foreground">pending</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-medium">{summary.paidOrders}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revenue</span>
            <span className="font-medium">{revenue}</span>
          </div>
        </div>

        {summary.recentOrders.length === 0 ? (
          <PortalEmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="When customers place orders on this site, they'll appear here."
            className="py-6"
          />
        ) : (
          <ul className="divide-y border-t pt-2">
            {summary.recentOrders.slice(0, 3).map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {order.customerName || order.customerEmail || "Guest"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.status}
                    {order.paymentStatus ? ` · ${order.paymentStatus}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {formatCurrency(order.totalCents / 100)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/portal/sites/${siteId}/orders`}>
            View all orders
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default PortalOrdersPanel;
