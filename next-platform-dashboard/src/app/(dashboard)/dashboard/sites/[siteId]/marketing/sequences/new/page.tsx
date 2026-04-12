/**
 * New Sequence Page - Sequence Builder
 * Phase MKT-04: Drip Sequences
 */
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { SequenceBuilder } from "@/modules/marketing/components/sequences/sequence-builder";

export const metadata: Metadata = {
  title: `New Sequence | ${PLATFORM.name}`,
  description: "Create a new drip sequence",
};

interface NewSequencePageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewSequencePage({
  params,
}: NewSequencePageProps) {
  const { siteId } = await params;

  return (
    <div className="flex-1 p-6">
      <SequenceBuilder siteId={siteId} />
    </div>
  );
}
