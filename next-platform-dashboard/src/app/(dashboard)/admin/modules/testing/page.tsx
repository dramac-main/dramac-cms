import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { getTestSites, getTestSiteStats } from "@/lib/modules/test-site-manager";
import { getBetaEnrollments, getBetaProgramStats } from "@/lib/modules/beta-program";
import { getRecentTestRuns, getTestStats } from "@/lib/modules/module-testing";
import { TestingDashboard } from "@/components/admin/modules/testing-dashboard";

export const metadata = {
  title: "Module Testing | Admin",
  description: "Manage module testing, test sites, and beta programs",
};

export default async function ModuleTestingPage() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const [
    testSites,
    testSiteStats,
    betaEnrollments,
    betaStats,
    recentTestRuns,
    testStats,
  ] = await Promise.all([
    getTestSites(),
    getTestSiteStats(),
    getBetaEnrollments(),
    getBetaProgramStats(),
    getRecentTestRuns(10),
    getTestStats(),
  ]);

  return (
    <TestingDashboard
      testSites={testSites}
      testSiteStats={testSiteStats}
      betaEnrollments={betaEnrollments}
      betaStats={betaStats}
      recentTestRuns={recentTestRuns}
      testStats={testStats}
    />
  );
}
