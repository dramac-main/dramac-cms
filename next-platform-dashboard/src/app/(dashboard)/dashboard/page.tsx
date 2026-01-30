import { Metadata } from "next";
import { getDashboardData } from "@/lib/actions/dashboard";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard | DRAMAC",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return <DashboardClient data={data} />;
}
