/**
 * Sequence Detail Page
 * Phase MKT-04: Drip Sequences
 */
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import {
  getSequence,
  getSequenceEnrollments,
} from "@/modules/marketing/actions/sequence-actions";
import { SequenceDetail } from "@/modules/marketing/components/sequences/sequence-detail";
import { SequenceDetailSkeleton } from "@/modules/marketing/components/sequences/sequence-detail-skeleton";

export const metadata: Metadata = {
  title: `Sequence | ${PLATFORM.name}`,
  description: "Sequence details and enrollment stats",
};

interface SequenceDetailPageProps {
  params: Promise<{ siteId: string; sequenceId: string }>;
}

export default async function SequenceDetailPage({
  params,
}: SequenceDetailPageProps) {
  const { siteId, sequenceId } = await params;

  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<SequenceDetailSkeleton />}>
        <SequenceDetailLoader siteId={siteId} sequenceId={sequenceId} />
      </Suspense>
    </div>
  );
}

async function SequenceDetailLoader({
  siteId,
  sequenceId,
}: {
  siteId: string;
  sequenceId: string;
}) {
  const [sequence, { enrollments, total: enrollmentTotal }] = await Promise.all(
    [
      getSequence(siteId, sequenceId),
      getSequenceEnrollments(sequenceId, { limit: 20 }),
    ],
  );
  if (!sequence) notFound();

  return (
    <SequenceDetail
      siteId={siteId}
      sequence={sequence}
      enrollments={enrollments}
      enrollmentTotal={enrollmentTotal}
    />
  );
}
