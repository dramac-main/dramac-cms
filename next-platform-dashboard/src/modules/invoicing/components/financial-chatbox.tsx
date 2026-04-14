"use client";

/**
 * Financial Chatbox
 *
 * Phase INV-11: Text input for natural language financial queries.
 * Shows AI-generated answer with optional chart data.
 */

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { MessageCircle, Send, Loader2, Bot, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { askFinancialQuestion } from "../actions/ai-actions";
import type { FinancialAnswer } from "../types/ai-types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: FinancialAnswer["data"];
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What was my revenue last month?",
  "How many invoices are overdue?",
  "What is my net profit this year?",
  "Which clients owe me the most?",
];

export function FinancialChatbox() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendQuestion = async (question: string) => {
    if (!siteId || !question.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await askFinancialQuestion(siteId, question.trim());

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: result.error || result.data?.answer || "No answer available.",
        data: result.data?.data || undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Financial Q&A
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-3">
        {/* Messages */}
        <ScrollArea className="h-[300px] pr-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3 py-8">
              <Bot className="h-8 w-8" />
              <p className="text-sm">Ask me anything about your finances</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1"
                    onClick={() => sendQuestion(q)}
                    disabled={loading}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Bot className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Render chart hint if data present */}
                  {msg.data && msg.data.type === "metric" && msg.data.labels && (
                    <div className="mt-2 pt-2 border-t text-xs">
                      {msg.data.labels.map((label, i) => (
                        <div key={label} className="flex justify-between">
                          <span>{label}:</span>
                          <span className="font-mono">
                            {msg.data!.values?.[i]?.toLocaleString() ?? "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.data && msg.data.type === "table" && msg.data.rows && (
                    <div className="mt-2 pt-2 border-t text-xs overflow-x-auto">
                      <table className="w-full">
                        <tbody>
                          {msg.data.rows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b last:border-0">
                              {Object.entries(row).map(([k, v]) => (
                                <td key={k} className="py-1 pr-2">
                                  {String(v)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <Bot className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a financial question..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
