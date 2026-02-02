/**
 * Chat Message Component
 * 
 * Displays a single message in the AI chat.
 * Phase STUDIO-11: AI Component Chat
 */

"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/studio/store/ai-store";
import { Sparkles, User, AlertCircle, Loader2 } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  
  if (isSystem) {
    return (
      <div className="text-center text-xs text-muted-foreground py-2">
        {message.content}
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex gap-3 p-3 rounded-lg",
      isUser 
        ? "bg-primary/10 ml-8" 
        : "bg-muted mr-8"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {isUser ? "You" : "AI Assistant"}
        </div>
        
        {message.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        ) : message.error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {message.error}
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        )}
        
        {/* Timestamp */}
        <div className="text-[10px] text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit" 
          })}
        </div>
      </div>
    </div>
  );
}
