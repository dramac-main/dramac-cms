import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Redirecting... | ${PLATFORM.name}`,
};

interface SitesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    clientId?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function SitesPage({ searchParams }: SitesPageProps) {
  const params = await searchParams;
  
  // Build query string from search params
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.set("search", params.search);
  if (params.status) queryParams.set("status", params.status);
  if (params.clientId) queryParams.set("clientId", params.clientId);
  if (params.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.set("sortOrder", params.sortOrder);
  
  const queryString = queryParams.toString();
  const redirectUrl = `/dashboard/sites${queryString ? `?${queryString}` : ""}`;
  
  redirect(redirectUrl);
}
