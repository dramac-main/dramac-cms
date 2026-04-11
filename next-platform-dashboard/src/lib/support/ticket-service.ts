"use server";

import { createClient } from "@/lib/supabase/server";
import { sendBrandedEmail } from "@/lib/email/send-branded-email";
import type { Json } from "@/types/database";

export interface AgencyTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string | null;
  priority: string | null;
  status: string | null;
  clientId: string;
  clientName: string | null;
  clientEmail: string | null;
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

export interface AgencyTicketDetail {
  ticket: AgencyTicket;
  messages: TicketMessage[];
}

async function getAgencyContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) return null;

  return {
    userId: user.id,
    email: user.email || "",
    agencyId: profile.agency_id,
    fullName: profile.full_name || "Agent",
  };
}

/**
 * Get all tickets for an agency (tickets from agency's clients)
 */
export async function getAgencyTickets(options?: {
  status?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  limit?: number;
}): Promise<{ tickets: AgencyTicket[]; total: number }> {
  const ctx = await getAgencyContext();
  if (!ctx) return { tickets: [], total: 0 };

  const supabase = await createClient();

  // Get all clients belonging to this agency
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("agency_id", ctx.agencyId);

  if (!clients?.length) return { tickets: [], total: 0 };

  const clientIds = clients.map((c) => c.id);
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  let query = supabase
    .from("support_tickets")
    .select(
      `
      *,
      site:sites(name),
      assigned:profiles(full_name)
    `,
      { count: "exact" }
    )
    .in("client_id", clientIds)
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options?.priority && options.priority !== "all") {
    query = query.eq("priority", options.priority);
  }
  if (options?.assignedTo) {
    query = query.eq("assigned_to", options.assignedTo);
  }
  if (options?.search) {
    query = query.or(
      `subject.ilike.%${options.search}%,ticket_number.ilike.%${options.search}%`
    );
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    console.error("Error fetching agency tickets:", error);
    return { tickets: [], total: 0 };
  }

  // Get message counts
  const ticketIds = data.map((t) => t.id);
  const { data: messageCounts } = await supabase
    .from("ticket_messages")
    .select("ticket_id")
    .in("ticket_id", ticketIds);

  const messageCountMap = new Map<string, number>();
  messageCounts?.forEach((m) => {
    messageCountMap.set(
      m.ticket_id,
      (messageCountMap.get(m.ticket_id) || 0) + 1
    );
  });

  return {
    tickets: data.map((t) => {
      const client = clientMap.get(t.client_id);
      return {
        id: t.id,
        ticketNumber: t.ticket_number,
        subject: t.subject,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        clientId: t.client_id,
        clientName: client?.name || null,
        clientEmail: client?.email || null,
        siteId: t.site_id,
        siteName: (t.site as { name: string } | null)?.name || null,
        assignedTo: t.assigned_to,
        assignedToName:
          (t.assigned as { full_name: string } | null)?.full_name || null,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        resolvedAt: t.resolved_at,
        messageCount: messageCountMap.get(t.id) || 0,
      };
    }),
    total: count || 0,
  };
}

/**
 * Get a specific ticket with messages (agency side — no client_id filter)
 */
export async function getAgencyTicket(
  ticketId: string
): Promise<AgencyTicketDetail | null> {
  const ctx = await getAgencyContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select(
      `
      *,
      site:sites(name),
      assigned:profiles(full_name)
    `
    )
    .eq("id", ticketId)
    .single();

  if (error || !ticket) return null;

  // Verify this ticket belongs to a client of this agency
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("id", ticket.client_id)
    .eq("agency_id", ctx.agencyId)
    .single();

  if (!client) return null;

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
      clientId: ticket.client_id,
      clientName: client.name,
      clientEmail: client.email,
      siteId: ticket.site_id,
      siteName: (ticket.site as { name: string } | null)?.name || null,
      assignedTo: ticket.assigned_to,
      assignedToName:
        (ticket.assigned as { full_name: string } | null)?.full_name || null,
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
      attachments:
        (m.attachments as { url: string; name: string; type: string }[]) || [],
      createdAt: m.created_at,
    })),
  };
}

/**
 * Reply to a ticket as an agency agent
 */
export async function replyToTicket(
  ticketId: string,
  message: string,
  attachments?: { url: string; name: string; type: string }[]
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getAgencyContext();
  if (!ctx) return { success: false, error: "Not authenticated" };

  const supabase = await createClient();

  // Verify ticket belongs to agency's client
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, client_id, subject, ticket_number")
    .eq("id", ticketId)
    .single();

  if (!ticket) return { success: false, error: "Ticket not found" };

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("id", ticket.client_id)
    .eq("agency_id", ctx.agencyId)
    .single();

  if (!client) return { success: false, error: "Unauthorized" };

  // Insert the message
  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_type: "agent",
    sender_id: ctx.userId,
    sender_name: ctx.fullName,
    message,
    attachments: (attachments || []) as unknown as Json,
  });

  if (error) {
    console.error("Error replying to ticket:", error);
    return { success: false, error: "Failed to send reply" };
  }

  // Update ticket to in_progress if it was open
  await supabase
    .from("support_tickets")
    .update({
      status: "in_progress",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .eq("status", "open");

  // Send email notification to client
  if (client.email) {
    try {
      await sendBrandedEmail(ctx.agencyId, {
        to: { email: client.email, name: client.name || undefined },
        emailType: "support_ticket_replied",
        data: {
          clientName: client.name || "there",
          ticketNumber: ticket.ticket_number,
          ticketSubject: ticket.subject,
          agentName: ctx.fullName,
          replyMessage: message,
        },
      });
    } catch (err) {
      console.error("Error sending ticket reply email:", err);
    }
  }

  return { success: true };
}

/**
 * Update ticket status (agency side)
 */
export async function updateAgencyTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "resolved" | "closed"
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getAgencyContext();
  if (!ctx) return { success: false, error: "Not authenticated" };

  const supabase = await createClient();

  // Verify ticket belongs to agency's client
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, client_id, subject, ticket_number")
    .eq("id", ticketId)
    .single();

  if (!ticket) return { success: false, error: "Ticket not found" };

  const { data: client } = await supabase
    .from("clients")
    .select("id, email, name")
    .eq("id", ticket.client_id)
    .eq("agency_id", ctx.agencyId)
    .single();

  if (!client) return { success: false, error: "Unauthorized" };

  const updateData: Record<string, string | null> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "resolved" || status === "closed") {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("support_tickets")
    .update(updateData)
    .eq("id", ticketId);

  if (error) {
    console.error("Error updating ticket status:", error);
    return { success: false, error: "Failed to update status" };
  }

  // Notify client of status change
  if (client.email && (status === "resolved" || status === "closed")) {
    try {
      await sendBrandedEmail(ctx.agencyId, {
        to: { email: client.email, name: client.name || undefined },
        emailType: "support_ticket_closed",
        data: {
          clientName: client.name || "there",
          ticketNumber: ticket.ticket_number,
          ticketSubject: ticket.subject,
          status: status === "resolved" ? "Resolved" : "Closed",
        },
      });
    } catch (err) {
      console.error("Error sending ticket status email:", err);
    }
  }

  return { success: true };
}

/**
 * Assign a ticket to a team member
 */
export async function assignTicket(
  ticketId: string,
  assignToUserId: string | null
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getAgencyContext();
  if (!ctx) return { success: false, error: "Not authenticated" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("support_tickets")
    .update({
      assigned_to: assignToUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) {
    console.error("Error assigning ticket:", error);
    return { success: false, error: "Failed to assign ticket" };
  }

  return { success: true };
}

/**
 * Get ticket stats for the agency dashboard
 */
export async function getAgencyTicketStats(): Promise<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}> {
  const ctx = await getAgencyContext();
  if (!ctx)
    return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };

  const supabase = await createClient();

  // Get agency's client IDs
  const { data: clients } = await supabase
    .from("clients")
    .select("id")
    .eq("agency_id", ctx.agencyId);

  if (!clients?.length)
    return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };

  const clientIds = clients.map((c) => c.id);

  const { data } = await supabase
    .from("support_tickets")
    .select("status")
    .in("client_id", clientIds);

  if (!data)
    return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };

  return {
    total: data.length,
    open: data.filter((t) => t.status === "open").length,
    inProgress: data.filter((t) => t.status === "in_progress").length,
    resolved: data.filter((t) => t.status === "resolved").length,
    closed: data.filter((t) => t.status === "closed").length,
  };
}
