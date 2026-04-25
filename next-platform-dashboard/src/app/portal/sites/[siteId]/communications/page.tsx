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
  searchParams?: Promise<{
    channel?: string;
    state?: string;
    event?: string;
  }>;
}

interface CommsFilter {
  channel?: string;
  state?: string;
  event?: string;
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

export default async function PortalCommunicationsPage({
  params,
  searchParams,
}: PageProps) {
  const { siteId } = await params;
  const sp = (await searchParams) ?? {};
  const filter: CommsFilter = {
    channel: sp.channel,
    state: sp.state,
    event: sp.event,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        description="Delivery log for automated and manual messages sent on this site"
      />
      <Suspense fallback={<LogSkeleton />}>
        <LogLoader siteId={siteId} filter={filter} />
      </Suspense>
    </div>
  );
}

async function LogLoader({
  siteId,
  filter,
}: {
  siteId: string;
  filter: CommsFilter;
}) {
  const user = await requirePortalAuth();
  const session = await getPortalSession();
  const dal = createPortalDAL({
    user,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
  });

  const [entries, stats] = await Promise.all([
    dal.communications.sendLog.list(siteId, {
      limit: 100,
      channel: (filter.channel as any) || undefined,
      deliveryState: (filter.state as any) || undefined,
      eventType: filter.event || undefined,
    }),
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
          <CommsFilterBar siteId={siteId} filter={filter} stats={stats} />
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
                        {e.eventType ? (
                          <a
                            href={`/portal/sites/${siteId}/communications?event=${encodeURIComponent(e.eventType)}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {e.eventType}
                          </a>
                        ) : (
                          "—"
                        )}
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

/**
 * Filter bar for the communications log. Renders a row of small links —
 * an "all" reset link plus one chip per known channel and per known state,
 * each with its current count from the stats roll-up. Click a chip to
 * filter; click "All" to reset.
 */
function CommsFilterBar({
  siteId,
  filter,
  stats,
}: {
  siteId: string;
  filter: CommsFilter;
  stats: { byChannel: Record<string, number>; byState: Record<string, number> };
}) {
  const base = `/portal/sites/${siteId}/communications`;
  const params = (next: Partial<CommsFilter>) => {
    const merged = { ...filter, ...next };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const channels = Object.entries(stats.byChannel).sort((a, b) => b[1] - a[1]);
  const states = Object.entries(stats.byState).sort((a, b) => b[1] - a[1]);

  const hasFilter = !!(filter.channel || filter.state || filter.event);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-3 text-xs">
      <span className="font-medium text-muted-foreground">Filter:</span>
      <a
        href={base}
        className={`rounded-full border px-2 py-0.5 ${
          !hasFilter ? "bg-foreground text-background" : "hover:bg-muted"
        }`}
      >
        All
      </a>
      {channels.length > 0 && (
        <>
          <span className="ml-2 text-muted-foreground">Channel:</span>
          {channels.map(([ch, n]) => {
            const active = filter.channel === ch;
            return (
              <a
                key={ch}
                href={params({ channel: active ? undefined : ch })}
                className={`rounded-full border px-2 py-0.5 capitalize ${
                  active ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                {ch.replace(/_/g, " ")}{" "}
                <span className="tabular-nums opacity-70">({n})</span>
              </a>
            );
          })}
        </>
      )}
      {states.length > 0 && (
        <>
          <span className="ml-2 text-muted-foreground">State:</span>
          {states.map(([st, n]) => {
            const active = filter.state === st;
            return (
              <a
                key={st}
                href={params({ state: active ? undefined : st })}
                className={`rounded-full border px-2 py-0.5 capitalize ${
                  active ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                {st.replace(/_/g, " ")}{" "}
                <span className="tabular-nums opacity-70">({n})</span>
              </a>
            );
          })}
        </>
      )}
      {filter.event && (
        <a
          href={params({ event: undefined })}
          className="rounded-full border bg-foreground px-2 py-0.5 text-background"
          title="Clear event filter"
        >
          event: <span className="font-mono">{filter.event}</span> ✕
        </a>
      )}
    </div>
  );
}
