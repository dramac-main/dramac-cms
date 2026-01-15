import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { getProfile } from "@/lib/actions/profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const impersonatingId = cookieStore.get("impersonating")?.value;
  
  let impersonatedUser = null;
  if (impersonatingId) {
    impersonatedUser = await getProfile(impersonatingId);
  }

  const isImpersonating = !!impersonatedUser;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        {isImpersonating && impersonatedUser && (
          <ImpersonationBanner
            userName={impersonatedUser.name || impersonatedUser.email || "User"}
            userEmail={impersonatedUser.email}
          />
        )}
        <Sidebar />
        <div className={`flex flex-1 flex-col ${isImpersonating ? "pt-10" : ""}`}>
          <Header />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
