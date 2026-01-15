import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/actions/sites";
import { AIBuilderWizard } from "@/components/ai-builder/ai-builder-wizard";

interface BuilderPageProps {
  params: Promise<{ siteId: string }>;
}

export const metadata: Metadata = {
  title: "AI Website Builder | DRAMAC",
  description: "Generate your website with AI",
};

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { siteId } = await params;
  const site = await getSite(siteId);

  if (!site) {
    notFound();
  }

  // If site already has content, redirect to editor
  // User can regenerate from there if needed
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <AIBuilderWizard site={site} />
    </div>
  );
}
