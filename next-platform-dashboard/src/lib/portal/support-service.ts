"use server";

import { createClient } from "@/lib/supabase/server";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  siteId: string | null;
  siteName: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
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
  senderInfo: {
    senderId: string;
    senderName: string;
  }
): Promise<{ success: boolean; ticketId?: string; ticketNumber?: string; error?: string }> {
  const supabase = await createClient();

  // Create the ticket
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      client_id: clientId,
      site_id: ticket.siteId || null,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category || "general",
      priority: ticket.priority || "normal",
    })
    .select("id, ticket_number")
    .single();

  if (error || !data) {
    console.error("Error creating ticket:", error);
    return { success: false, error: "Failed to create ticket" };
  }

  // Add the initial message
  await supabase.from("ticket_messages").insert({
    ticket_id: data.id,
    sender_type: "client",
    sender_id: senderInfo.senderId,
    sender_name: senderInfo.senderName,
    message: ticket.description,
  });

  return {
    success: true,
    ticketId: data.id,
    ticketNumber: data.ticket_number,
  };
}

/**
 * Add a message to a ticket
 */
export async function addTicketMessage(
  ticketId: string,
  clientId: string,
  message: string,
  senderInfo: {
    senderId: string;
    senderName: string;
    senderType: "client" | "agent";
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const supabase = await createClient();

  // Verify ticket belongs to client (for client messages)
  if (senderInfo.senderType === "client") {
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("id, status")
      .eq("id", ticketId)
      .eq("client_id", clientId)
      .single();

    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    if (ticket.status === "closed") {
      return { success: false, error: "Cannot reply to a closed ticket" };
    }
  }

  // Add the message
  const { data, error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: ticketId,
      sender_type: senderInfo.senderType,
      sender_id: senderInfo.senderId,
      sender_name: senderInfo.senderName,
      message,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error adding message:", error);
    return { success: false, error: "Failed to send message" };
  }

  // Update ticket timestamp and status if client replied to a resolved ticket
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  
  if (senderInfo.senderType === "client") {
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("status")
      .eq("id", ticketId)
      .single();

    if (ticket?.status === "resolved") {
      updates.status = "open";
      updates.resolved_at = null;
    }
  }

  await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", ticketId);

  return { success: true, messageId: data.id };
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "resolved" || status === "closed") {
    updates.resolved_at = new Date().toISOString();
  } else {
    updates.resolved_at = null;
  }

  const { error } = await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", ticketId);

  if (error) {
    return { success: false, error: "Failed to update ticket status" };
  }

  return { success: true };
}

/**
 * Get ticket statistics for a client
 */
export async function getTicketStats(clientId: string): Promise<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .select("status")
    .eq("client_id", clientId);

  if (error || !data) {
    return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
  }

  const stats = {
    total: data.length,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  };

  data.forEach(t => {
    switch (t.status) {
      case "open": stats.open++; break;
      case "in_progress": stats.inProgress++; break;
      case "resolved": stats.resolved++; break;
      case "closed": stats.closed++; break;
    }
  });

  return stats;
}
