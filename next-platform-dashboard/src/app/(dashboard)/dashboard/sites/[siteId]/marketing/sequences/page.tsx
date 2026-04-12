/**
 * Sequences List Page
 * Phase MKT-04: Drip Sequences
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
import { SequenceList } from "@/modules/marketing/components/sequences/sequence-list";
import { SequenceListSkeleton } from "@/modules/marketing/components/sequences/sequence-list-skeleton";

export const metadata: Metadata = {
  title: `Sequences | ${PLATFORM.name}`,
  description: "Manage drip sequences and automation flows",
};

interface SequencesPageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function SequencesPage({
  params,
  searchParams,
}: SequencesPageProps) {
  const { siteId } = await params;
  const filters = await searchParams;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <Link href={`/dashboard/sites/${siteId}/marketing`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Marketing Hub
          </Button>
        </Link>
        <Link href={`/dashboard/sites/${siteId}/marketing/sequences/new`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Sequence
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        <Suspense fallback={<SequenceListSkeleton />}>
          <SequenceList siteId={siteId} filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
