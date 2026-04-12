/**
 * Landing Page List - Server Component
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import { getLandingPages } from "../../actions/landing-page-actions";
import { LandingPageListClient } from "./landing-page-list-client";
import type { LandingPageStatus } from "../../types";

interface LandingPageListProps {
  siteId: string;
  filters: {
    status?: string;
    search?: string;
    page?: string;
  };
  basePath?: string;
}

export async function LandingPageList({
  siteId,
  filters,
  basePath,
}: LandingPageListProps) {
  const page = parseInt(filters.page || "1", 10);
  const pageSize = 20;

  const { landingPages, total } = await getLandingPages(siteId, {
    status: (filters.status as LandingPageStatus) || undefined,
    search: filters.search || undefined,
    page,
    pageSize,
  });

  return (
    <LandingPageListClient
      siteId={siteId}
      landingPages={landingPages}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      currentStatus={filters.status}
      currentSearch={filters.search}
      basePath={basePath}
    />
  );
}
