/**
 * Sequences List Page
 * Phase MKT-04: Drip Sequences
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
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
    <div className="flex-1 p-6">
      <Suspense fallback={<SequenceListSkeleton />}>
        <SequenceList siteId={siteId} filters={filters} />
      </Suspense>
    </div>
  );
}
