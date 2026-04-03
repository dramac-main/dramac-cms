"use client";

/**
 * ChatQuotePanel — In-chat quote management for store owners
 *
 * Displayed in the conversation sidebar when a conversation has an
 * associated quote (via metadata.quote_number). Allows the store
 * owner to view quote details, update status, and manage the quote
 * without leaving the chat.
 */

import { useState, useEffect, useCallback, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  RefreshCw,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Send,
  ArrowRightCircle,
  Clock,
  Eye,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatQuoteCurrency,
  QUOTE_STATUS_CONFIG,
  getAllowedTransitions,
  calculateDaysUntilExpiry,
  isQuoteExpired,
} from "@/modules/ecommerce/lib/quote-utils";
import {
  getQuoteContextForChat,
  type ChatQuoteContext,
} from "@/modules/live-chat/actions/chat-quote-actions";
import { updateQuoteStatus } from "@/modules/ecommerce/actions/quote-actions";
import {
  sendQuote,
  convertQuoteToOrder,
} from "@/modules/ecommerce/actions/quote-workflow-actions";
import { QuoteDetailDialog } from "@/modules/ecommerce/components/quotes/quote-detail-dialog";
import type { QuoteStatus } from "@/modules/ecommerce/types/ecommerce-types";

function getQuoteStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "accepted":
    case "converted":
      return "default";
    case "sent":
    case "viewed":
    case "pending_approval":
      return "secondary";
    case "rejected":
    case "expired":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

interface ChatQuotePanelProps {
  siteId: string;
  quoteNumber: string;
  userId: string;
  userName: string;
}

export function ChatQuotePanel({
  siteId,
  quoteNumber,
  userId,
  userName,
}: ChatQuotePanelProps) {
  const [quote, setQuote] = useState<ChatQuoteContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showFullQuote, setShowFullQuote] = useState(false);

  const fetchQuote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getQuoteContextForChat(siteId, quoteNumber);
      if (!data) {
        setError("Quote not found");
      }
      setQuote(data);
    } catch {
      setError("Failed to load quote");
    } finally {
      setLoading(false);
    }
  }, [siteId, quoteNumber]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      if (!quote) return;
      startTransition(async () => {
        // "sent" must go through sendQuote() which handles email + chat notification
        if (newStatus === "sent") {
          const result = await sendQuote({
            quote_id: quote.id,
            site_id: siteId,
          });
          if (result.success) {
            toast.success("Quote sent to customer via email");
            fetchQuote();
          } else {
            toast.error(result.error || "Failed to send quote");
          }
          return;
        }

        const result = await updateQuoteStatus(
          siteId,
          quote.id,
          newStatus as QuoteStatus,
          userId,
          userName,
        );
        if (result.success) {
          const label =
            QUOTE_STATUS_CONFIG[newStatus as QuoteStatus]?.label || newStatus;
          toast.success(`Quote status updated to ${label}`);
          fetchQuote();
        } else {
          toast.error(result.error || "Failed to update status");
        }
      });
    },
    [quote, siteId, userId, userName, fetchQuote],
  );

  const handleCopyLink = useCallback(() => {
    if (!quote?.accessToken) return;
    const portalUrl = `${window.location.origin}/quote/${quote.accessToken}`;
    navigator.clipboard.writeText(portalUrl);
    toast.success("Quote portal link copied to clipboard");
  }, [quote]);

  // Send quote to customer (from dialog or prominent button)
  const handleSendQuote = useCallback(() => {
    if (!quote) return;
    startTransition(async () => {
      const result = await sendQuote({
        quote_id: quote.id,
        site_id: siteId,
      });
      if (result.success) {
        toast.success("Quote sent to customer via email");
        fetchQuote();
        setShowFullQuote(false);
      } else {
        toast.error(result.error || "Failed to send quote");
      }
    });
  }, [quote, siteId, fetchQuote]);

  // Convert accepted quote to order
  const handleConvertToOrder = useCallback(() => {
    if (!quote) return;
    startTransition(async () => {
      const result = await convertQuoteToOrder({
        quote_id: quote.id,
        site_id: siteId,
        user_id: userId,
        user_name: userName,
      });
      if (result.success) {
        toast.success(
          `Quote converted to order ${result.order?.order_number || ""}`,
        );
        fetchQuote();
        setShowFullQuote(false);
      } else {
        toast.error(result.error || "Failed to convert quote");
      }
    });
  }, [quote, siteId, userId, userName, fetchQuote]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Quote Context
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground ml-2">
            Loading quote...
          </span>
        </CardContent>
      </Card>
    );
  }

  // Error / not found state
  if (error || !quote) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Quote Context
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4 space-y-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {error || "Quote not found"}
          </p>
          <p className="text-xs text-muted-foreground">Ref: {quoteNumber}</p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = QUOTE_STATUS_CONFIG[quote.status as QuoteStatus];
  const allowedTransitions = getAllowedTransitions(quote.status as QuoteStatus);
  const daysUntilExpiry = calculateDaysUntilExpiry(quote.validUntil);
  const expired = isQuoteExpired(quote.validUntil);

  return (
    <Card className="border-primary/20 bg-primary/2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Quote {quote.quoteNumber}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchQuote}
            disabled={isPending}
          >
            <RefreshCw
              className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status badge */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={getQuoteStatusVariant(quote.status)}
            className="text-[10px]"
          >
            {statusConfig?.label || quote.status}
          </Badge>
          {quote.viewCount > 0 && (
            <Badge variant="outline" className="text-[10px]">
              <Eye className="h-2.5 w-2.5 mr-0.5" />
              Viewed {quote.viewCount}x
            </Badge>
          )}
        </div>

        {/* Total + date + expiry */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">
              {formatQuoteCurrency(quote.total, quote.currency)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Date</span>
            <span className="text-muted-foreground">
              {new Date(quote.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          {quote.validUntil && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {expired ? "Expired" : "Valid Until"}
              </span>
              <span
                className={
                  expired
                    ? "text-destructive"
                    : daysUntilExpiry !== null && daysUntilExpiry <= 3
                      ? "text-amber-600"
                      : "text-muted-foreground"
                }
              >
                {new Date(quote.validUntil).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {!expired &&
                  daysUntilExpiry !== null &&
                  ` (${daysUntilExpiry}d)`}
              </span>
            </div>
          )}
          {quote.convertedOrderNumber && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <ArrowRightCircle className="h-2.5 w-2.5" />
                Converted
              </span>
              <span className="text-emerald-600 font-medium">
                {quote.convertedOrderNumber}
              </span>
            </div>
          )}
        </div>

        {/* Items summary */}
        {quote.items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Items ({quote.items.length})
              </p>
              {quote.items.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="truncate max-w-40">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-muted-foreground shrink-0 ml-1">
                    {formatQuoteCurrency(item.lineTotal, quote.currency)}
                  </span>
                </div>
              ))}
              {quote.items.length > 3 && (
                <p className="text-[10px] text-muted-foreground">
                  +{quote.items.length - 3} more items
                </p>
              )}
            </div>
          </>
        )}

        {/* Status Change */}
        {allowedTransitions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Update Status
              </p>
              <Select onValueChange={handleStatusChange} disabled={isPending}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {QUOTE_STATUS_CONFIG[s]?.label || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Primary Action: Send to Customer */}
        {["draft", "pending_approval"].includes(quote.status) && (
          <>
            <Separator />
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleSendQuote}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              Send to Customer
            </Button>
          </>
        )}

        {/* Convert to Order */}
        {quote.status === "accepted" && (
          <>
            <Separator />
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleConvertToOrder}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <ArrowRightCircle className="h-3 w-3 mr-1" />
              )}
              Convert to Order
            </Button>
          </>
        )}

        {/* Quick Actions */}
        <Separator />
        <div className="space-y-1.5">
          {quote.accessToken && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={handleCopyLink}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Customer Link
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => setShowFullQuote(true)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Full Quote
          </Button>
        </div>

        {/* Inline QuoteDetailDialog */}
        {quote && (
          <QuoteDetailDialog
            open={showFullQuote}
            onOpenChange={setShowFullQuote}
            quoteId={quote.id}
            siteId={siteId}
            onSend={handleSendQuote}
            onConvert={handleConvertToOrder}
            onQuoteChange={fetchQuote}
          />
        )}
      </CardContent>
    </Card>
  );
}
