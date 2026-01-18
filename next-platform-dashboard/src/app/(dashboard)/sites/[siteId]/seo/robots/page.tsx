import { redirect } from "next/navigation";
import { use } from "react";

interface RobotsPageProps {
  params: Promise<{ siteId: string }>;
}

export default function RobotsPage({ params }: RobotsPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/seo/robots`);
}
