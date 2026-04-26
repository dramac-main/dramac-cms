"use client";

import { Bot, BotOff, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Session 2A/2B — Focus Area 4.4 portal AI transparency.
 *
 * Renders a small status banner above the chat composer that makes the
 * current AI state visible to the agent. Mirrors the `MessageBubble` AI
 * badge but at the conversation level.
 */
export interface AiStatusBannerProps {
  aiEnabled: boolean;
  lastAiConfidence?: number | null;
  aiHandoffRequested?: boolean;
  aiFallback?: boolean;
  className?: string;
}

export function AiStatusBanner({
  aiEnabled,
  lastAiConfidence,
  aiHandoffRequested,
  aiFallback,
  className,
}: AiStatusBannerProps) {
  if (aiFallback) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900",
          className,
        )}
      >
        <AlertTriangle className="h-4 w-4" />
        <span>
          Chiko is temporarily unavailable. This conversation is awaiting a
          human reply.
        </span>
      </div>
    );
  }

  if (aiHandoffRequested) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-900",
          className,
        )}
      >
        <Bot className="h-4 w-4" />
        <span>
          Chiko has requested a human handoff. Please take over this
          conversation.
        </span>
      </div>
    );
  }

  if (!aiEnabled) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground",
          className,
        )}
      >
        <BotOff className="h-4 w-4" />
        <span>Chiko auto-responses are disabled for this site.</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm",
        className,
      )}
    >
      <Badge variant="outline" className="gap-1">
        <Bot className="h-3 w-3" /> Chiko active
      </Badge>
      {typeof lastAiConfidence === "number" && (
        <span className="text-xs text-muted-foreground">
          last confidence: {Math.round(lastAiConfidence * 100)}%
        </span>
      )}
    </div>
  );
}
