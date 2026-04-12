/**
 * Sequence Detail Page
 * Phase MKT-04: Drip Sequences
 */
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}/marketing/sequences`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sequences
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        <Suspense fallback={<SequenceDetailSkeleton />}>
          <SequenceDetailLoader siteId={siteId} sequenceId={sequenceId} />
        </Suspense>
      </div>
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
