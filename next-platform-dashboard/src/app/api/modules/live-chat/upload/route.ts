/**
 * Live Chat File Upload API
 *
 * POST — Upload a file attachment for a chat conversation
 * Used by both the widget (visitors) and dashboard (agents)
 *
 * Validates:
 * - Visitor ownership of conversation (for visitor uploads)
 * - File size against widget settings (maxFileSizeMb)
 * - File type against widget settings (allowedFileTypes)
 * - Creates the file message automatically after upload
 */

import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapRecord } from "@/modules/live-chat/lib/map-db-record";
import { v4 as uuid } from "uuid";
import type { ChatMessage } from "@/modules/live-chat/types";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Default limits if widget settings are unavailable
const DEFAULT_MAX_FILE_SIZE_MB = 10;
const DEFAULT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function getContentType(
  mimeType: string,
): "image" | "file" | "audio" | "video" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const conversationId = formData.get("conversationId") as string | null;
    const visitorId = formData.get("visitorId") as string | null;
    const senderType = (formData.get("senderType") as string) || "visitor";
    const senderId = formData.get("senderId") as string | null;
    const senderName = formData.get("senderName") as string | null;

    if (!file || !conversationId) {
      return NextResponse.json(
        { error: "file and conversationId are required" },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createAdminClient();

    // Validate conversation exists and get site_id + metadata
    const { data: conv } = await (supabase as any)
      .from("mod_chat_conversations")
      .select("visitor_id, site_id, metadata")
      .eq("id", conversationId)
      .single();

    if (!conv) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    // For visitor uploads, validate ownership
    if (senderType === "visitor") {
      if (!visitorId || conv.visitor_id !== visitorId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403, headers: corsHeaders },
        );
      }
    }

    // Get widget settings for file restrictions
    const { data: widgetSettings } = await (supabase as any)
      .from("mod_chat_widget_settings")
      .select("enable_file_uploads, max_file_size_mb, allowed_file_types")
      .eq("site_id", conv.site_id)
      .single();

    // Check if file uploads are enabled
    if (widgetSettings && !widgetSettings.enable_file_uploads) {
      return NextResponse.json(
        { error: "File uploads are disabled for this site" },
        { status: 403, headers: corsHeaders },
      );
    }

    const maxSizeMb =
      widgetSettings?.max_file_size_mb || DEFAULT_MAX_FILE_SIZE_MB;
    const allowedTypes: string[] =
      widgetSettings?.allowed_file_types?.length > 0
        ? widgetSettings.allowed_file_types
        : DEFAULT_ALLOWED_TYPES;

    // Validate file size
    if (file.size > maxSizeMb * 1024 * 1024) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSizeMb}MB limit` },
        { status: 413, headers: corsHeaders },
      );
    }

    // Validate file type
    if (
      allowedTypes.length > 0 &&
      !allowedTypes.some(
        (type) =>
          file.type === type ||
          (type.endsWith("/*") && file.type.startsWith(type.slice(0, -1))),
      )
    ) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed` },
        { status: 415, headers: corsHeaders },
      );
    }

    // Upload to Supabase Storage
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${conv.site_id}/${conversationId}/${uuid()}_${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[LiveChat Upload] Storage error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500, headers: corsHeaders },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("chat-attachments").getPublicUrl(storagePath);

    // Determine content type for message
    const contentType = getContentType(file.type);

    // Get sender name if visitor
    let resolvedSenderName = senderName;
    if (senderType === "visitor" && !resolvedSenderName && visitorId) {
      const { data: visitorData } = await (supabase as any)
        .from("mod_chat_visitors")
        .select("name")
        .eq("id", visitorId)
        .single();
      resolvedSenderName = visitorData?.name || "Visitor";
    }

    // Create the file message
    const msgInsert: Record<string, unknown> = {
      conversation_id: conversationId,
      site_id: conv.site_id,
      sender_type: senderType,
      content: file.name,
      content_type: contentType,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      file_mime_type: file.type,
      status: "sent",
      is_internal_note: false,
    };

    if (senderId) msgInsert.sender_id = senderId;
    if (resolvedSenderName) msgInsert.sender_name = resolvedSenderName;

    const { data: msgData, error: msgError } = await (supabase as any)
      .from("mod_chat_messages")
      .insert(msgInsert)
      .select()
      .single();

    if (msgError) {
      console.error("[LiveChat Upload] Message error:", msgError);
      return NextResponse.json(
        { error: "File uploaded but failed to create message" },
        { status: 500, headers: corsHeaders },
      );
    }

    const message = mapRecord<ChatMessage>(msgData);

    // Update conversation last message
    const { data: currentConv } = await (supabase as any)
      .from("mod_chat_conversations")
      .select("unread_agent_count, unread_visitor_count, message_count")
      .eq("id", conversationId)
      .single();

    const isVisitor = senderType === "visitor";
    const unreadField = isVisitor
      ? "unread_agent_count"
      : "unread_visitor_count";
    const currentUnread =
      (isVisitor
        ? currentConv?.unread_agent_count
        : currentConv?.unread_visitor_count) || 0;

    await (supabase as any)
      .from("mod_chat_conversations")
      .update({
        last_message_text: `📎 ${file.name}`,
        last_message_at: new Date().toISOString(),
        last_message_by: senderType,
        [unreadField]: currentUnread + 1,
        message_count: (currentConv?.message_count || 0) + 1,
      })
      .eq("id", conversationId);

    // Bridge visitor image/PDF uploads to payment proof system if applicable.
    // We ONLY attempt this when the file type is plausibly a payment receipt
    // (image or PDF) and the sender is the visitor. The bridge function itself
    // applies a second layer of intent verification — it checks the conversation
    // history and filename before committing anything.
    if (
      senderType === "visitor" &&
      visitorId &&
      (contentType === "image" || file.type === "application/pdf")
    ) {
      // Read whether the AI has already flagged this conversation as payment-guidance
      // active. This context is passed into the bridge for its intent check.
      const convMeta = (conv.metadata || {}) as Record<string, unknown>;
      const isPaymentConvoActive = convMeta.payment_guidance_active === true;

      const capturedSiteId = conv.site_id;
      const capturedConvId = conversationId;
      const capturedVisitorId = visitorId;
      const capturedFileUrl = publicUrl;
      const capturedFileName = file.name;
      const capturedFileSize = file.size;
      const capturedFileMimeType = file.type;
      const capturedIsPaymentConvo = isPaymentConvoActive;

      after(async () => {
        try {
          const { bridgeChatImageAsPaymentProof } =
            await import("@/modules/live-chat/lib/chat-event-bridge");
          const bridged = await bridgeChatImageAsPaymentProof(
            capturedSiteId,
            capturedConvId,
            capturedVisitorId,
            capturedFileUrl,
            capturedFileName,
            capturedFileSize,
            capturedFileMimeType,
            capturedIsPaymentConvo,
          );
          if (bridged) {
            console.log(
              "[LiveChat Upload] Image bridged as payment proof for conversation:",
              capturedConvId,
            );
          }
        } catch (err) {
          console.error("[LiveChat Upload] Payment proof bridge error:", err);
        }
      });
    }

    return NextResponse.json(
      { message, fileUrl: publicUrl },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("[LiveChat Upload] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
