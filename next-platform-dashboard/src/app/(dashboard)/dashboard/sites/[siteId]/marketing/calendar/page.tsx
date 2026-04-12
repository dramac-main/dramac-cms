/**
 * Content Calendar Page
 *
 * Phase MKT-12: Social Media Integration
 *
 * Unified marketing calendar showing campaigns, social posts,
 * sequences, and blog posts in a month view.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}/marketing`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Marketing Hub
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        <ContentCalendar siteId={siteId} />
      </div>
    </div>
  );
}
