"use server";

import { createClient } from "@/lib/supabase/server";
import { Json } from "@/types/database";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string | null;
  priority: string | null;
  status: string | null;
  siteId: string | null;
  siteName: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  resolvedAt: string | null;
  messageCount: number;
}

export interface TicketMessage {
  id: string;
  senderType: "client" | "agent";
  senderId: string;
  senderName: string;
  message: string;
  attachments: { url: string; name: string; type: string }[];
  createdAt: string | null;
}

export interface TicketDetail {
  ticket: SupportTicket;
  messages: TicketMessage[];
}

export type TicketCategory = "general" | "bug" | "feature" | "billing" | "content";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

/**
 * Get all tickets for a client
 */
export async function getClientTickets(
  clientId: string,
  options?: {
    status?: TicketStatus | "all";
    limit?: number;
  }
): Promise<SupportTicket[]> {
  const supabase = await createClient();

  let query = supabase
    .from("support_tickets")
    .select(`
      *,
      site:sites(name),
      assigned:profiles(full_name)
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  // Get message counts for all tickets
  const ticketIds = data.map(t => t.id);
  const { data: messageCounts } = await supabase
    .from("ticket_messages")
    .select("ticket_id")
    .in("ticket_id", ticketIds);

  const messageCountMap = new Map<string, number>();
  messageCounts?.forEach(m => {
    messageCountMap.set(m.ticket_id, (messageCountMap.get(m.ticket_id) || 0) + 1);
  });

  return data.map((t) => ({
    id: t.id,
    ticketNumber: t.ticket_number,
    subject: t.subject,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    siteId: t.site_id,
    siteName: (t.site as { name: string } | null)?.name || null,
    assignedTo: t.assigned_to,
    assignedToName: (t.assigned as { full_name: string } | null)?.full_name || null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    resolvedAt: t.resolved_at,
    messageCount: messageCountMap.get(t.id) || 0,
  }));
}

/**
 * Get a specific ticket with its messages
 */
export async function getTicket(
  ticketId: string,
  clientId: string
): Promise<TicketDetail | null> {
  const supabase = await createClient();

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select(`
      *,
      site:sites(name),
      assigned:profiles(full_name)
    `)
    .eq("id", ticketId)
    .eq("client_id", clientId)
    .single();

  if (error || !ticket) {
    return null;
  }

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  return {
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      siteId: ticket.site_id,
      siteName: (ticket.site as { name: string } | null)?.name || null,
      assignedTo: ticket.assigned_to,
      assignedToName: (ticket.assigned as { full_name: string } | null)?.full_name || null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      resolvedAt: ticket.resolved_at,
      messageCount: messages?.length || 0,
    },
    messages: (messages || []).map((m) => ({
      id: m.id,
      senderType: m.sender_type as "client" | "agent",
      senderId: m.sender_id,
      senderName: m.sender_name,
      message: m.message,
      attachments: (m.attachments as { url: string; name: string; type: string }[]) || [],
      createdAt: m.created_at,
    })),
  };
}

/**
 * Create a new support ticket
 */
export async function createTicket(
  clientId: string,
  ticket: {
    subject: string;
    description: string;
    category?: TicketCategory;
    priority?: TicketPriority;
    siteId?: string;
  },
  clientName: string
): Promise<{ success: boolean; ticketId?: string; error?: string }> {
  const supabase = await createClient();

  // Create the ticket
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      client_id: clientId,
      ticket_number: "", // Will be auto-generated by trigger
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category || "general",
      priority: ticket.priority || "normal",
      site_id: ticket.siteId || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error creating ticket:", error);
    return { success: false, error: "Failed to create ticket" };
  }

  // Add the initial message (the description)
  await supabase.from("ticket_messages").insert({
    ticket_id: data.id,
    sender_type: "client",
    sender_id: clientId,
    sender_name: clientName,
    message: ticket.description,
  });

  return { success: true, ticketId: data.id };
}

/**
 * Add a message to a ticket
 */
export async function addTicketMessage(
  ticketId: string,
  message: {
    senderType: "client" | "agent";
    senderId: string;
    senderName: string;
    message: string;
    attachments?: { url: string; name: string; type: string }[];
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: ticketId,
      sender_type: message.senderType,
      sender_id: message.senderId,
      sender_name: message.senderName,
      message: message.message,
      attachments: (message.attachments || []) as unknown as Json,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error adding message:", error);
    return { success: false, error: "Failed to add message" };
  }

  // Update ticket updated_at (trigger should handle this, but ensure it)
  await supabase
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  return { success: true, messageId: data.id };
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  clientId: string,
  status: TicketStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateData: Record<string, string | null> = { status };
  if (status === "resolved") {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("support_tickets")
    .update(updateData)
    .eq("id", ticketId)
    .eq("client_id", clientId);

  if (error) {
    console.error("Error updating ticket status:", error);
    return { success: false, error: "Failed to update ticket status" };
  }

  return { success: true };
}

/**
 * Get ticket stats for a client
 */
export async function getTicketStats(clientId: string): Promise<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .select("status")
    .eq("client_id", clientId);

  if (error || !data) {
    return { total: 0, open: 0, inProgress: 0, resolved: 0 };
  }

  return {
    total: data.length,
    open: data.filter((t) => t.status === "open").length,
    inProgress: data.filter((t) => t.status === "in_progress").length,
    resolved: data.filter((t) => t.status === "resolved" || t.status === "closed").length,
  };
}
