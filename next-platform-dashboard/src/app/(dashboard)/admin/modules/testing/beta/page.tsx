import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import {
  getBetaEnrollments,
  getAvailableAgenciesForBeta,
  getBetaTiers,
} from "@/lib/modules/beta-program";
import { BetaProgramManagement } from "@/components/admin/modules/beta-program-management";

export const metadata = {
  title: "Beta Program | Module Testing",
  description: "Manage beta program enrollments",
};

export default async function BetaProgramPage() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const [enrollments, availableAgencies, betaTiers] = await Promise.all([
    getBetaEnrollments(),
    getAvailableAgenciesForBeta(),
    getBetaTiers(),
  ]);

  return (
    <BetaProgramManagement
      enrollments={enrollments}
      availableAgencies={availableAgencies}
      betaTiers={betaTiers}
    />
  );
}
