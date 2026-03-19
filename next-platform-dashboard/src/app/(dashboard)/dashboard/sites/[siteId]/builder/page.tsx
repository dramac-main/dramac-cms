import { Metadata } from "next";
import { redirect } from "next/navigation";
import { PLATFORM } from "@/lib/constants/platform";

interface BuilderPageProps {
  params: Promise<{ siteId: string }>;
}

export const metadata: Metadata = {
  title: `AI Website Builder | ${PLATFORM.name}`,
  description: "Generate your website with AI",
};

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { siteId } = await params;

  // Legacy builder page — redirect to the modern AI Designer
  redirect(`/dashboard/sites/${siteId}/ai-designer`);
}
