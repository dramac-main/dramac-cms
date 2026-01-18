import { redirect } from "next/navigation";
import { use } from "react";

interface BuilderPageProps {
  params: Promise<{ siteId: string }>;
}

export default function BuilderPage({ params }: BuilderPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/builder`);
}
