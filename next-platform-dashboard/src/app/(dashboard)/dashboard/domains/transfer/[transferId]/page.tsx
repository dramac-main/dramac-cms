// src/app/(dashboard)/dashboard/domains/transfer/[transferId]/page.tsx
// Transfer details page

import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TransferStatusTracker } from "@/components/domains/transfer";
import { getTransferById } from "@/lib/actions/transfers";
import { PLATFORM } from "@/lib/constants/platform";

interface TransferDetailPageProps {
  params: Promise<{ transferId: string }>;
}

export async function generateMetadata({ params }: TransferDetailPageProps) {
  const { transferId } = await params;
  const result = await getTransferById(transferId);

  if (!result.success || !result.data) {
    return { title: `Transfer Not Found | ${PLATFORM.name}` };
  }

  return {
    title: `Transfer: ${result.data.domain_name} | ${PLATFORM.name}`,
    description: `Domain transfer details for ${result.data.domain_name}`,
  };
}

export default async function TransferDetailPage({ params }: TransferDetailPageProps) {
  const { transferId } = await params;
  const result = await getTransferById(transferId);

  if (!result.success || !result.data) {
    notFound();
  }

  const transfer = result.data;

  return (
    <div className="container py-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/domains/transfer">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-mono">{transfer.domain_name}</h1>
          <p className="text-muted-foreground">
            Transfer {transfer.transfer_type === 'in' ? 'In' : 'Out'} Details
          </p>
        </div>
      </div>

      {/* Transfer Status Tracker */}
      <TransferStatusTracker
        status={transfer.status}
        domainName={transfer.domain_name}
        transferType={transfer.transfer_type}
        currentStep={transfer.current_step}
        totalSteps={transfer.total_steps}
        initiatedAt={transfer.initiated_at}
        completedAt={transfer.completed_at}
        failureReason={transfer.failure_reason}
      />

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/domains/transfer">
            Back to Transfers
          </Link>
        </Button>
        {transfer.status === 'completed' && transfer.transfer_type === 'in' && (
          <Button asChild>
            <Link href={`/dashboard/domains`}>
              View Domain
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
