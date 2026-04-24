/**
 * PortalLiveChatPanel — per-site conversations summary.
 *
 * Gated on `canManageLiveChat`. See sibling orders panel for the same pattern.
 */

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortalEmptyState } from "@/components/portal/patterns";
import type { PortalDAL } from "@/lib/portal/data-access";

interface PortalLiveChatPanelProps {
  dal: PortalDAL;
  siteId: string;
}

export async function PortalLiveChatPanel({
  dal,
  siteId,
}: PortalLiveChatPanelProps) {
  const summary = await dal.conversations.summaryForSite(siteId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MessageCircle className="h-4 w-4" aria-hidden />
          Live chat
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {summary.totalConversations} total
        </span>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold">{summary.activeConversations}</p>
          <p className="text-sm text-muted-foreground">active</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending</span>
            <span className="font-medium">{summary.pendingConversations}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Closed</span>
            <span className="font-medium">{summary.closedConversations}</span>
          </div>
        </div>

        {summary.recentConversations.length === 0 ? (
          <PortalEmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="When visitors start chats on this site, they'll appear here."
            className="py-6"
          />
        ) : (
          <ul className="divide-y border-t pt-2">
            {summary.recentConversations.slice(0, 3).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {c.channel || "chat"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.messageCount} messages
                  </p>
                </div>
                {c.status ? (
                  <Badge
                    variant="secondary"
                    className="h-5 text-[10px] uppercase"
                  >
                    {c.status}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/portal/sites/${siteId}/live-chat`}>
            Open inbox
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default PortalLiveChatPanel;
