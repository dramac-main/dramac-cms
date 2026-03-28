"use client";

/**
 * WidgetChat — Chat conversation view for the widget
 *
 * PHASE LC-04: Message list with auto-scroll, input, typing indicator
 */

import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import type { WidgetPublicSettings } from "./ChatWidget";
import { WidgetMessageBubble, type WidgetMessage } from "./WidgetMessageBubble";

interface WidgetChatProps {
  settings: WidgetPublicSettings;
  messages: WidgetMessage[];
  isLoading: boolean;
  typingAgent: string | null;
  visitorName?: string;
  agentInfo?: {
    name: string;
    avatar?: string;
  } | null;
  onSendMessage: (text: string) => void;
  onFileUpload?: (file: File) => Promise<void>;
  onEndChat: () => void;
  onBackToList?: () => void;
  onClose: () => void;
}

export function WidgetChat({
  settings,
  messages,
  isLoading,
  typingAgent,
  visitorName,
  agentInfo,
  onSendMessage,
  onFileUpload,
  onEndChat,
  onBackToList,
  onClose,
}: WidgetChatProps) {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingAgent]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInputText("");
    await onSendMessage(trimmed);
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onFileUpload) return;
    // Reset file input so the same file can be re-selected
    e.target.value = "";
    setIsUploading(true);
    try {
      await onFileUpload(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0 shadow-sm"
        style={{ backgroundColor: settings.primaryColor }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="p-1 rounded hover:opacity-80 transition-opacity shrink-0"
              aria-label="Back to conversations"
              title="Back to conversations"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={settings.textColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {agentInfo?.avatar ? (
            <img
              src={agentInfo.avatar}
              alt=""
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: settings.textColor,
              }}
            >
              {agentInfo?.name?.[0]?.toUpperCase() || (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
          )}
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold truncate"
              style={{ color: settings.textColor }}
            >
              {agentInfo?.name || settings.companyName || "Support"}
            </h3>
            <p
              className="text-xs truncate"
              style={{ color: settings.textColor, opacity: 0.8 }}
            >
              {typingAgent ? "Typing..." : "Online"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* End chat button */}
          <button
            type="button"
            onClick={onEndChat}
            className="p-1.5 rounded hover:opacity-80 transition-opacity"
            aria-label="End chat"
            title="End chat"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={settings.textColor}
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </button>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:opacity-80 transition-opacity"
            aria-label="Minimize"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={settings.textColor}
              strokeWidth="2"
            >
              <path d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
      >
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div
              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{
                borderColor: `${settings.primaryColor} transparent ${settings.primaryColor} ${settings.primaryColor}`,
              }}
            />
          </div>
        )}

        {/* System greeting */}
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-6">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: `${settings.primaryColor}15` }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={settings.primaryColor}
                strokeWidth="1.5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              {visitorName ? `Hi ${visitorName}! ` : ""}
              {settings.welcomeMessage || "How can we help you today?"}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <WidgetMessageBubble
            key={msg.id}
            message={msg}
            primaryColor={settings.primaryColor}
            textColor={settings.textColor}
            onSendMessage={onSendMessage}
            onTriggerUpload={() => fileInputRef.current?.click()}
          />
        ))}

        {/* Typing indicator */}
        {typingAgent && (
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="bg-gray-100 rounded-2xl px-4 py-2 inline-flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-2 border-t shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* File upload button */}
          {settings.enableFileUploads && onFileUpload && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                aria-label="Attach file"
                title="Attach file"
              >
                {isUploading ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="animate-spin"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          )}
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 max-h-20 overflow-y-auto"
            style={{
              // @ts-expect-error -- focus ring color
              "--tw-ring-color": settings.primaryColor,
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="shrink-0 p-2 rounded-lg transition-opacity disabled:opacity-40"
            style={{
              backgroundColor: settings.primaryColor,
              color: settings.textColor,
            }}
            aria-label="Send message"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="m22 2-11 11" />
            </svg>
          </button>
        </form>

        {/* Powered by */}
        <div className="text-center pt-1.5">
          <span className="text-[10px] text-gray-400">Powered by DRAMAC</span>
        </div>
      </div>
    </div>
  );
}
