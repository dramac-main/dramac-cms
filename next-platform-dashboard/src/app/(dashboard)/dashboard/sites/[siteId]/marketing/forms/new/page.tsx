/**
 * New Form Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
import { FormBuilder } from "@/modules/marketing/components/forms/form-builder";

export const metadata: Metadata = {
  title: `New Form | ${PLATFORM.name}`,
  description: "Create a new opt-in form",
};

interface NewFormPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewFormPage({ params }: NewFormPageProps) {
  const { siteId } = await params;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}/marketing/forms`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        <FormBuilder siteId={siteId} />
      </div>
    </div>
  );
}
