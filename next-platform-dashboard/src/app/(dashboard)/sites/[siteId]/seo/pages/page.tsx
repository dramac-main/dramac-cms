import { redirect } from "next/navigation";
import { use } from "react";

interface SeoPagesProp {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default function SeoPagesPage({ params, searchParams }: SeoPagesProp) {
  const { siteId } = use(params);
  const { page } = use(searchParams);
  const queryString = page ? `?page=${page}` : "";
  redirect(`/dashboard/sites/${siteId}/seo/pages${queryString}`);
}
