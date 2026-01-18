import { redirect } from "next/navigation";
import { use } from "react";

interface SubmissionsPageProps {
  params: Promise<{ siteId: string }>;
}

export default function SubmissionsPage({ params }: SubmissionsPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/submissions`);
}
