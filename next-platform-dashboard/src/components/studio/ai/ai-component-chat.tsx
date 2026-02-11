/**
 * AI Component Chat Panel
 * 
 * Slide-in chat panel for AI-assisted component editing.
 * Phase STUDIO-11: AI Component Chat
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Send, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Trash2,
} from "lucide-react";
import { useAIStore } from "@/lib/studio/store/ai-store";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { useComponent } from "@/lib/studio/registry/hooks";
import { ChatMessage } from "./chat-message";
import { ChangePreview } from "./change-preview";
import type { AIComponentContext, AIComponentRequest } from "@/lib/studio/ai/types";

export function AIComponentChat() {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Store hooks
  const { 
    isOpen, 
    activeComponentId,
    chatHistory,
    pendingChanges,
    pendingExplanation,
    isLoading,
    error,
    initialMessage,
    closeChat,
    addMessage,
    updateLastMessage,
    setPendingChanges,
    setLoading,
    setError,
    clearHistory,
    clearInitialMessage,
  } = useAIStore();
  
  const data = useEditorStore((s) => s.data);
  const updateComponentProps = useEditorStore((s) => s.updateComponentProps);
  
  // Get component data
  const component = activeComponentId 
    ? data.components[activeComponentId] 
    : null;
  
  const definition = useComponent(component?.type || "");
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Handle initial message from suggestions
  useEffect(() => {
    if (isOpen && initialMessage && !isLoading && component) {
      setInputValue(initialMessage);
      clearInitialMessage();
      // Optionally auto-send - for now just populate the input
      // User can review and send
    }
  }, [isOpen, initialMessage, isLoading, component, clearInitialMessage]);
  
  // Build AI context
  const buildContext = useCallback((): AIComponentContext | null => {
    if (!component || !definition) return null;
    
    // Gather other component types for context
    const otherComponentTypes = Object.values(data.components)
      .filter(c => c.id !== component.id)
      .map(c => c.type)
      .filter((v, i, a) => a.indexOf(v) === i); // unique
    
    return {
      componentType: component.type,
      componentLabel: definition.label,
      componentDescription: definition.description,
      currentProps: component.props as Record<string, unknown>,
      fields: definition.fields,
      aiContext: definition.ai,
      pageContext: {
        title: data.root.props.title,
        description: data.root.props.description,
        otherComponentTypes,
      },
    };
  }, [component, definition, data]);
  
  // Send message to AI
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !component) return;
    
    const userMessage = inputValue.trim();
    setInputValue("");
    
    // Add user message
    addMessage({
      role: "user",
      content: userMessage,
    });
    
    // Add loading placeholder for AI
    addMessage({
      role: "assistant",
      content: "",
      isLoading: true,
    });
    
    setLoading(true);
    setError(null);
    
    try {
      const context = buildContext();
      if (!context) {
        throw new Error("Could not build component context");
      }
      
      // Build conversation history for API
      const conversationHistory = chatHistory
        .filter(m => m.role !== "system" && !m.isLoading)
        .map(m => ({
          role: m.role as "user" | "assistant",
          content: m.proposedChanges 
            ? JSON.stringify({ changes: m.proposedChanges, explanation: m.explanation || "" })
            : m.content,
        }));
      
      const request: AIComponentRequest = {
        context,
        userMessage,
        conversationHistory,
      };
      
      const response = await fetch("/api/studio/ai/component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "AI request failed");
      }
      
      // Update the loading message with response
      updateLastMessage({
        content: result.explanation || "Here are my suggested changes:",
        proposedChanges: result.changes,
        explanation: result.explanation,
        isLoading: false,
      });
      
      // Set pending changes for preview
      if (result.changes && Object.keys(result.changes).length > 0) {
        setPendingChanges(result.changes, result.explanation);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      updateLastMessage({
        content: "",
        error: errorMessage,
        isLoading: false,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply pending changes
  const handleApplyChanges = () => {
    if (!pendingChanges || !activeComponentId) return;
    
    updateComponentProps(activeComponentId, pendingChanges);
    
    addMessage({
      role: "system",
      content: "Changes applied successfully!",
    });
    
    setPendingChanges(null);
  };
  
  // Reject changes
  const handleRejectChanges = () => {
    addMessage({
      role: "system",
      content: "Changes rejected",
    });
    
    setPendingChanges(null);
  };
  
  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={cn(
      "fixed right-0 top-0 bottom-0 w-[400px] bg-background border-l shadow-lg z-50",
      "flex flex-col animate-in slide-in-from-right duration-200"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              Editing: {definition?.label || component?.type || "Component"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearHistory}
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={closeChat}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {chatHistory.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h4 className="font-medium mb-2">How can I help?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Ask me to modify this component. Try:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Make it blue", "Add an emoji", "Make it shorter"].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputValue(suggestion);
                    inputRef.current?.focus();
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Pending Changes Preview */}
      {pendingChanges && component && (
        <div className="border-t p-4 space-y-3 bg-muted/20">
          <ChangePreview
            currentProps={component.props as Record<string, unknown>}
            proposedChanges={pendingChanges}
            explanation={pendingExplanation || undefined}
          />
          
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleApplyChanges}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply Changes
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRejectChanges}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to change..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
