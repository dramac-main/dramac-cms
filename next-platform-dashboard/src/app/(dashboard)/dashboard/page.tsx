import { Metadata } from "next";
import { getDashboardData } from "@/lib/actions/dashboard";
import { PLATFORM } from "@/lib/constants/platform";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: `Dashboard | ${PLATFORM.name}`,
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return <DashboardClient data={data} />;
}
