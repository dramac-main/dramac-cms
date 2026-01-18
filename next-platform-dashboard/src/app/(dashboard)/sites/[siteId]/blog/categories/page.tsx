import { redirect } from "next/navigation";
import { use } from "react";

interface CategoriesPageProps {
  params: Promise<{ siteId: string }>;
}

export default function CategoriesPage({ params }: CategoriesPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/blog/categories`);
}
