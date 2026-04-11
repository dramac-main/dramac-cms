"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  replyToTicket,
  updateAgencyTicketStatus,
  type AgencyTicketDetail,
} from "@/lib/support/ticket-service";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface TicketDetailViewProps {
  ticketDetail: AgencyTicketDetail;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof Clock;
  }
> = {
  open: { label: "Open", variant: "destructive", icon: AlertCircle },
  in_progress: { label: "In Progress", variant: "default", icon: Clock },
  resolved: { label: "Resolved", variant: "secondary", icon: CheckCircle2 },
  closed: { label: "Closed", variant: "outline", icon: XCircle },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "text-muted-foreground" },
  normal: { label: "Normal", className: "" },
  high: { label: "High", className: "text-orange-600 dark:text-orange-400" },
  urgent: { label: "Urgent", className: "text-red-600 dark:text-red-400" },
};

export function TicketDetailView({ ticketDetail }: TicketDetailViewProps) {
  const { ticket, messages } = ticketDetail;
  const router = useRouter();
  const [replyText, setReplyText] = useState("");
  const [isReplying, startReply] = useTransition();
  const [isUpdating, startUpdate] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const statusInfo = statusConfig[ticket.status || "open"] || statusConfig.open;
  const priorityInfo =
    priorityConfig[ticket.priority || "normal"] || priorityConfig.normal;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleReply() {
    if (!replyText.trim()) return;

    startReply(async () => {
      const result = await replyToTicket(ticket.id, replyText.trim());
      if (result.success) {
        setReplyText("");
        toast.success("Reply sent to the client.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to send reply.");
      }
    });
  }

  function handleStatusChange(newStatus: string) {
    startUpdate(async () => {
      const result = await updateAgencyTicketStatus(
        ticket.id,
        newStatus as "open" | "in_progress" | "resolved" | "closed",
      );
      if (result.success) {
        toast.success(`Ticket marked as ${newStatus.replace("_", " ")}.`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status.");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link + Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/tickets"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tickets
          </Link>
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm font-mono text-muted-foreground">
              {ticket.ticketNumber}
            </span>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <span className={`text-sm ${priorityInfo.className}`}>
              {priorityInfo.label} Priority
            </span>
          </div>
        </div>
        <Select
          value={ticket.status || "open"}
          onValueChange={handleStatusChange}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground block">Client</span>
          <span className="font-medium">{ticket.clientName || "Unknown"}</span>
          {ticket.clientEmail && (
            <span className="block text-xs text-muted-foreground">
              {ticket.clientEmail}
            </span>
          )}
        </div>
        <div>
          <span className="text-muted-foreground block">Category</span>
          <span className="font-medium capitalize">
            {ticket.category || "General"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block">Site</span>
          <span className="font-medium">{ticket.siteName || "N/A"}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Created</span>
          <span className="font-medium">
            {ticket.createdAt
              ? format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")
              : "N/A"}
          </span>
        </div>
      </div>

      {/* Messages Thread */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
          {messages.map((msg) => {
            const isAgent = msg.senderType === "agent";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAgent ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isAgent
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isAgent ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`flex-1 max-w-[80%] ${isAgent ? "text-right" : ""}`}
                >
                  <div
                    className={`rounded-lg p-3 ${
                      isAgent
                        ? "bg-primary/5 border border-primary/20 ml-auto"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {msg.senderName}
                      </span>
                      <span>
                        {msg.createdAt
                          ? formatDistanceToNow(new Date(msg.createdAt), {
                              addSuffix: true,
                            })
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    {msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.attachments.map((a, i) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline"
                          >
                            {a.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Reply Form */}
      {ticket.status !== "closed" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                disabled={isReplying}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Press Ctrl+Enter to send. Client will be notified by email.
                </p>
                <Button
                  onClick={handleReply}
                  disabled={!replyText.trim() || isReplying}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isReplying ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
