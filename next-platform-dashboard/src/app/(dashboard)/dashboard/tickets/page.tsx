import { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TicketsDashboard } from "@/components/support/tickets-dashboard";
import {
  getAgencyTickets,
  getAgencyTicketStats,
} from "@/lib/support/ticket-service";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Support Tickets | ${PLATFORM.name}`,
  description: "Manage client support tickets",
};

export default async function TicketsPage() {
  const [{ tickets }, stats] = await Promise.all([
    getAgencyTickets({ limit: 50 }),
    getAgencyTicketStats(),
  ]);

  return (
    <DashboardShell>
      <TicketsDashboard initialTickets={tickets} stats={stats} />
    </DashboardShell>
  );
}
