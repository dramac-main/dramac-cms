/**
 * New Sequence Page - Sequence Builder
 * Phase MKT-04: Drip Sequences
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
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
        <SequenceBuilder siteId={siteId} />
      </div>
    </div>
  );
}
