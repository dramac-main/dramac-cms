/**
 * Portal Communications Page — Session 4D
 *
 * Read-only view over `portal_send_log` showing delivery outcomes
 * for every message the platform has sent on this site to the client.
 *
 * Permission: `canViewAnalytics` (observability surface).
 * Supplier-brand columns are stripped by the DAL before reaching this page.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { createPortalDAL } from "@/lib/portal/data-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Communications | Client Portal",
  description: "Delivery log for messages sent on this site",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
}

function stateVariant(
  state: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (state) {
    case "delivered":
    case "sent":
      return "default";
    case "failed":
    case "bounced":
    case "complained":
    case "dropped":
      return "destructive";
    case "queued":
    case "retried":
      return "secondary";
    default:
      return "outline";
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default async function PortalCommunicationsPage({ params }: PageProps) {
  const { siteId } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        description="Delivery log for automated and manual messages sent on this site"
      />
      <Suspense fallback={<LogSkeleton />}>
        <LogLoader siteId={siteId} />
      </Suspense>
    </div>
  );
}

async function LogLoader({ siteId }: { siteId: string }) {
  const user = await requirePortalAuth();
  const session = await getPortalSession();
  const dal = createPortalDAL({
    user,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
  });

  const [entries, stats] = await Promise.all([
    dal.communications.sendLog.list(siteId, { limit: 100 }),
    dal.communications.sendLog.stats(siteId),
  ]);

  const byChannel = Object.entries(stats.byChannel).sort((a, b) => b[1] - a[1]);
  const byState = Object.entries(stats.byState).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total (last 5000)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              By channel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {byChannel.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data</div>
            ) : (
              byChannel.map(([ch, n]) => (
                <div
                  key={ch}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize">{ch.replace(/_/g, " ")}</span>
                  <span className="font-medium tabular-nums">{n}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              By delivery state
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {byState.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data</div>
            ) : (
              byState.map(([st, n]) => (
                <div
                  key={st}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize">{st.replace(/_/g, " ")}</span>
                  <span className="font-medium tabular-nums">{n}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent sends</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No messages have been sent on this site yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead className="text-right">Latency</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(e.createdAt)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {e.eventType || "—"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {e.channel.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={stateVariant(e.deliveryState)}
                          className="capitalize"
                        >
                          {e.deliveryState.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {e.recipientClass ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">
                        {e.latencyMs === null ? "—" : `${e.latencyMs}ms`}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                        {e.errorCode ? (
                          <span title={e.errorMessage ?? undefined}>
                            {e.errorCode}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
