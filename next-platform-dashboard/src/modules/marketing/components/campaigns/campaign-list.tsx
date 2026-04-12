/**
 * Campaign List Component
 * Phase MKT-02: Email Campaign Engine (UI)
 *
 * Server component that fetches campaigns and renders them in a filterable list.
 */
import { getCampaigns } from "../../actions/campaign-actions";
import { CampaignListClient } from "./campaign-list-client";
import type { CampaignStatus } from "../../types";

interface CampaignListProps {
  siteId: string;
  filters: {
    status?: string;
    search?: string;
    page?: string;
  };
}

export async function CampaignList({ siteId, filters }: CampaignListProps) {
  const page = parseInt(filters.page || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const { campaigns, total } = await getCampaigns(siteId, {
    status: (filters.status as CampaignStatus) || undefined,
    search: filters.search || undefined,
    limit,
    offset,
  });

  return (
    <CampaignListClient
      siteId={siteId}
      campaigns={campaigns}
      total={total}
      currentPage={page}
      pageSize={limit}
      currentStatus={filters.status}
      currentSearch={filters.search}
    />
  );
}
