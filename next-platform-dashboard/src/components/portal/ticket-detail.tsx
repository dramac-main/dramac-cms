"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Send, User, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { addTicketMessage } from "@/lib/portal/support-service";
import { format, formatDistanceToNow } from "date-fns";
import type { PortalUser } from "@/lib/portal/portal-auth";
import type { SupportTicket, TicketMessage } from "@/lib/portal/support-service";

interface TicketDetailProps {
  user: PortalUser;
  ticket: SupportTicket;
  messages: TicketMessage[];
}

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
    open: { variant: "default", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    in_progress: { variant: "default", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
    resolved: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
    closed: { variant: "secondary", className: "" },
  };

  const config = variants[status] || variants.open;

  return (
    <Badge variant={config.variant} className={config.className}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function getPriorityBadge(priority: string) {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    normal: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };

  return (
    <Badge variant="outline" className={colors[priority] || colors.normal}>
      {priority}
    </Badge>
  );
}

export function TicketDetail({ user, ticket, messages }: TicketDetailProps) {
  const router = useRouter();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (ticket.status === "closed") {
      toast.error("Cannot reply to a closed ticket");
      return;
    }

    setIsSending(true);

    const result = await addTicketMessage(
      ticket.id,
      user.clientId,
      newMessage.trim(),
      {
        senderId: user.userId || user.clientId,
        senderName: user.fullName,
        senderType: "client",
      }
    );

    setIsSending(false);

    if (result.success) {
      setNewMessage("");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to send message");
    }
  };

  const canReply = ticket.status !== "closed";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portal/support">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Support
          </Link>
        </Button>
      </div>

      {/* Ticket Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span>{ticket.ticketNumber}</span>
            <span>•</span>
            <span>{ticket.category}</span>
            {ticket.siteName && (
              <>
                <span>•</span>
                <span>{ticket.siteName}</span>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
          </p>
        </div>

        {ticket.assignedToName && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10">
                  <Headphones className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Assigned to</p>
                <p className="text-sm text-muted-foreground">{ticket.assignedToName}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length > 0 ? (
            <>
              {messages.map((message, index) => {
                const isClient = message.senderType === "client";
                const initials = message.senderName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div key={message.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className={`flex gap-4 ${isClient ? "" : "flex-row-reverse"}`}>
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className={isClient ? "bg-primary/10" : "bg-blue-100"}>
                          {isClient ? (
                            initials
                          ) : (
                            <Headphones className="h-5 w-5 text-blue-600" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${isClient ? "" : "text-right"}`}>
                        <div className={`flex items-center gap-2 ${isClient ? "" : "justify-end"}`}>
                          <span className="font-medium text-sm">
                            {message.senderName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <div className={`mt-2 p-3 rounded-lg ${
                          isClient 
                            ? "bg-muted text-foreground" 
                            : "bg-primary/5 text-foreground"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No messages yet
            </p>
          )}

          {/* Reply Form */}
          {canReply && (
            <>
              <Separator className="my-4" />
              <form onSubmit={handleSendMessage} className="space-y-4">
                <Textarea
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  disabled={isSending}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSending || !newMessage.trim()}>
                    {isSending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Reply
                  </Button>
                </div>
              </form>
            </>
          )}

          {!canReply && (
            <div className="text-center p-4 bg-muted rounded-lg mt-4">
              <p className="text-sm text-muted-foreground">
                This ticket is closed. Please create a new ticket if you need further assistance.
              </p>
              <Button className="mt-2" asChild>
                <Link href="/portal/support/new">Create New Ticket</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
