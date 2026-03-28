"use client";

/**
 * WidgetConversationList — Shows a list of the visitor's chat conversations
 *
 * Each order gets its own conversation thread. General support is separate.
 * Customer can switch between conversations or start a new one.
 */

import type { WidgetPublicSettings } from "./ChatWidget";

export interface ConversationListItem {
  id: string;
  status: string;
  subject: string | null;
  orderNumber: string | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  messageCount: number;
  createdAt: string;
  agentName: string | null;
}

interface WidgetConversationListProps {
  settings: WidgetPublicSettings;
  conversations: ConversationListItem[];
  isLoading: boolean;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  onClose: () => void;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
    case "open":
      return "#22c55e";
    case "pending":
    case "waiting":
      return "#f59e0b";
    case "resolved":
      return "#6b7280";
    case "closed":
      return "#9ca3af";
    default:
      return "#6b7280";
  }
}

function getConversationTitle(item: ConversationListItem): string {
  if (item.orderNumber) return `Order ${item.orderNumber}`;
  if (item.subject) return item.subject;
  return "General Support";
}

export function WidgetConversationList({
  settings,
  conversations,
  isLoading,
  onSelectConversation,
  onNewChat,
  onClose,
}: WidgetConversationListProps) {
  const primaryColor = settings.primaryColor || "#0F172A";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          backgroundColor: primaryColor,
          color: settings.textColor || "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {settings.companyName || "Chat"}
          </h2>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "12px",
              opacity: 0.85,
            }}
          >
            Your conversations
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "none",
            border: "none",
            color: settings.textColor || "#ffffff",
            cursor: "pointer",
            padding: "4px",
            opacity: 0.8,
            lineHeight: 1,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <div style={{ padding: "12px 16px 8px", flexShrink: 0 }}>
        <button
          onClick={onNewChat}
          style={{
            width: "100%",
            padding: "10px 16px",
            backgroundColor: primaryColor,
            color: settings.textColor || "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
          </svg>
          New Conversation
        </button>
      </div>

      {/* Conversation List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 0",
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 16px",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "2px solid #e5e7eb",
                borderTopColor: primaryColor,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: "0 auto 12px" }}
            >
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
            </svg>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>
              No conversations yet
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
              Start a new conversation to get help
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const title = getConversationTitle(conv);
            const statusColor = getStatusColor(conv.status);
            const isFinished =
              conv.status === "resolved" || conv.status === "closed";

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                style={{
                  display: "flex",
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: "1px solid #f3f4f6",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: "12px",
                  alignItems: "flex-start",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9fafb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
                onFocus={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9fafb")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {/* Status dot */}
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: statusColor,
                    flexShrink: 0,
                    marginTop: "5px",
                  }}
                />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: conv.unreadCount > 0 ? 600 : 500,
                        color: isFinished ? "#9ca3af" : "#111827",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {title}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        flexShrink: 0,
                      }}
                    >
                      {formatTimeAgo(conv.lastMessageAt)}
                    </span>
                  </div>

                  {/* Last message preview */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        color: conv.unreadCount > 0 ? "#374151" : "#6b7280",
                        fontWeight: conv.unreadCount > 0 ? 500 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "200px",
                      }}
                    >
                      {conv.lastMessageText || "No messages yet"}
                    </span>

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "20px",
                          height: "20px",
                          borderRadius: "10px",
                          backgroundColor: primaryColor,
                          color: settings.textColor || "#ffffff",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "0 6px",
                          flexShrink: 0,
                        }}
                      >
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Agent & status */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    {conv.agentName && (
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                        {conv.agentName}
                      </span>
                    )}
                    {isFinished && (
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {conv.status}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
