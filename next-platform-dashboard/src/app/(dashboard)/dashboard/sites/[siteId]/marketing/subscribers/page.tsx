/**
 * Subscribers Page
 * Phase MKT-02: Email Campaign Engine (UI)
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { getSubscribers } from "@/modules/marketing/actions/subscriber-actions";
import { getMailingLists } from "@/modules/marketing/actions/audience-actions";
import { SubscriberManager } from "@/modules/marketing/components/subscribers/subscriber-manager";
import { SubscriberManagerSkeleton } from "@/modules/marketing/components/subscribers/subscriber-manager-skeleton";

export const metadata: Metadata = {
  title: `Subscribers | ${PLATFORM.name}`,
  description: "Manage email subscribers and mailing lists",
};

interface SubscribersPageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function SubscribersPage({
  params,
  searchParams,
}: SubscribersPageProps) {
  const { siteId } = await params;
  const filters = await searchParams;

  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<SubscriberManagerSkeleton />}>
        <SubscriberManagerLoader siteId={siteId} filters={filters} />
      </Suspense>
    </div>
  );
}

async function SubscriberManagerLoader({
  siteId,
  filters,
}: {
  siteId: string;
  filters: { status?: string; search?: string; page?: string };
}) {
  const page = parseInt(filters.page || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const [{ subscribers, total }, mailingLists] = await Promise.all([
    getSubscribers(siteId, {
      status: filters.status as any,
      search: filters.search || undefined,
      limit,
      offset,
    }),
    getMailingLists(siteId),
  ]);

  return (
    <SubscriberManager
      siteId={siteId}
      subscribers={subscribers}
      subscriberTotal={total}
      mailingLists={mailingLists}
      page={page}
      limit={limit}
    />
  );
}
