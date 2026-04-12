/**
 * Content Calendar Page
 *
 * Phase MKT-12: Social Media Integration
 *
 * Unified marketing calendar showing campaigns, social posts,
 * sequences, and blog posts in a month view.
 */
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { ContentCalendar } from "@/modules/marketing/components/social/content-calendar";

export const metadata: Metadata = {
  title: `Content Calendar | ${PLATFORM.name}`,
  description: "Unified marketing content calendar",
};

interface CalendarPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { siteId } = await params;

  return (
    <div className="flex-1 p-6">
      <ContentCalendar siteId={siteId} />
    </div>
  );
}
