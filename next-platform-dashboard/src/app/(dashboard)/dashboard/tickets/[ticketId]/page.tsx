import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TicketDetailView } from "@/components/support/ticket-detail-view";
import { getAgencyTicket } from "@/lib/support/ticket-service";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Ticket Detail | ${PLATFORM.name}`,
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const ticketDetail = await getAgencyTicket(ticketId);

  if (!ticketDetail) {
    notFound();
  }

  return (
    <DashboardShell>
      <TicketDetailView ticketDetail={ticketDetail} />
    </DashboardShell>
  );
}
