import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSite } from "@/lib/actions/sites";
import { getPages } from "@/lib/actions/pages";
import { CreatePageForm } from "@/components/pages/create-page-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface NewPagePageProps {
  params: Promise<{ siteId: string }>;
}

export async function generateMetadata({ params }: NewPagePageProps): Promise<Metadata> {
  const { siteId } = await params;
  const site = await getSite(siteId).catch(() => null);
  return {
    title: site ? `New Page - ${site.name} | DRAMAC` : "New Page",
  };
}

export default async function NewPagePage({ params }: NewPagePageProps) {
  const { siteId } = await params;
  const site = await getSite(siteId).catch(() => null);

  if (!site) {
    notFound();
  }

  const pages = await getPages(siteId);
  const isFirstPage = pages.length === 0;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/dashboard/sites/${site.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {site.name}
          </Button>
        </Link>
      </div>

      <CreatePageForm siteId={site.id} isFirstPage={isFirstPage} />
    </div>
  );
}
