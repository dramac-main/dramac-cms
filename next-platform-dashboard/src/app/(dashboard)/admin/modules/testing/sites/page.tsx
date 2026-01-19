import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import {
  getTestSites,
  getAvailableSitesForTesting,
  getTestFeatures,
} from "@/lib/modules/test-site-manager";
import { TestSitesManagement } from "@/components/admin/modules/test-sites-management";

export const metadata = {
  title: "Test Sites | Module Testing",
  description: "Manage test sites for module testing",
};

export default async function TestSitesPage() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const [testSites, availableSites, testFeatures] = await Promise.all([
    getTestSites(),
    getAvailableSitesForTesting(),
    getTestFeatures(),
  ]);

  return (
    <TestSitesManagement
      testSites={testSites}
      availableSites={availableSites}
      testFeatures={testFeatures}
    />
  );
}
