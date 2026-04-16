/**
 * Chiko Chat Component
 *
 * Phase BIL-10: Chiko AI Business Assistant
 *
 * Chat interface with:
 * - Message history
 * - Quick action buttons
 * - Loading state
 * - Auto-scroll
 * - Conversation persistence
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  SendHorizontal,
  Loader2,
  BarChart3,
  Calendar,
  FileText,
  ShoppingBag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  category?: string;
  timestamp: string;
}

interface QuickAction {
  label: string;
  question: string;
  icon: typeof BarChart3;
}

// ============================================================================
// Quick Actions
// ============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Revenue Summary",
    question: "Give me a summary of my revenue this month",
    icon: BarChart3,
  },
  {
    label: "This Week's Bookings",
    question: "What bookings do I have this week?",
    icon: Calendar,
  },
  {
    label: "Outstanding Invoices",
    question: "Show me outstanding invoices",
    icon: FileText,
  },
  {
    label: "Top Products",
    question: "What are my top selling products?",
    icon: ShoppingBag,
  },
  {
    label: "Client Overview",
    question: "Give me an overview of my clients",
    icon: Users,
  },
];

// ============================================================================
// Component
// ============================================================================

export function ChikoChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: question.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/chiko", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.trim(),
            conversationId,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Error: ${res.status}`);
        }

        const data = await res.json();

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.answer,
          category: data.category,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send message";
        setError(message);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [conversationId, loading],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)]">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Chiko</CardTitle>
            <p className="text-xs text-muted-foreground">
              AI Business Assistant
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <EmptyState onQuickAction={sendMessage} />
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Chiko is thinking...</span>
                </div>
              )}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  {error}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Quick Actions (only when conversation started) */}
        {messages.length > 0 && !loading && (
          <div className="flex-shrink-0 px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_ACTIONS.slice(0, 3).map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs whitespace-nowrap"
                  onClick={() => sendMessage(action.question)}
                >
                  <action.icon className="h-3 w-3 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Chiko about your business..."
              disabled={loading}
              maxLength={1000}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function EmptyState({
  onQuickAction,
}: {
  onQuickAction: (question: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Hi! I&apos;m Chiko</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Your AI business assistant. Ask me anything about your revenue,
        bookings, clients, orders, or marketing.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="justify-start text-sm h-auto py-3"
            onClick={() => onQuickAction(action.question)}
          >
            <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {!isUser && message.category && (
          <Badge variant="secondary" className="text-[10px] mb-1">
            {message.category}
          </Badge>
        )}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <p
          className={cn(
            "text-[10px] mt-1",
            isUser ? "text-primary-foreground/60" : "text-muted-foreground",
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
