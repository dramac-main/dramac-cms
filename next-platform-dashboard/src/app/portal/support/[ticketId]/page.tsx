import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getTicket } from "@/lib/portal/support-service";
import { TicketDetail } from "@/components/portal/ticket-detail";

interface TicketDetailPageProps {
  params: Promise<{ ticketId: string }>;
}

export async function generateMetadata({ params }: TicketDetailPageProps): Promise<Metadata> {
  const { ticketId: _ticketId } = await params;
  
  return {
    title: `Ticket | Support | Client Portal`,
    description: "View support ticket details",
  };
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { ticketId } = await params;
  const user = await requirePortalAuth();
  
  const result = await getTicket(ticketId, user.clientId);
  
  if (!result) {
    notFound();
  }

  return (
    <TicketDetail 
      user={user} 
      ticket={result.ticket} 
      messages={result.messages} 
    />
  );
}
