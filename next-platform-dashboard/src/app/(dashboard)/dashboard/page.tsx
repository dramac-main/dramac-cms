import { Metadata } from "next";
import { getDashboardData } from "@/lib/actions/dashboard";
import { PLATFORM } from "@/lib/constants/platform";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: `Dashboard | ${PLATFORM.name}`,
};

interface DashboardPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const range = params.range || "30d";
  const data = await getDashboardData(range);

  return <DashboardClient data={data} />;
}
