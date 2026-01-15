import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalSitesList } from "@/components/portal/portal-sites-list";

export const metadata: Metadata = {
  title: "Client Portal | DRAMAC",
  description: "View your websites and manage your account",
};

export default async function PortalPage() {
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;
  
  if (!impersonatingClientId) {
    // If not impersonating, redirect to dashboard
    // In the future, this would check for actual client portal authentication
    redirect("/dashboard");
  }

  const supabase = await createClient();
  
  // Get the client being impersonated
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(`
      *,
      sites(*)
    `)
    .eq("id", impersonatingClientId)
    .single();

  if (clientError || !client) {
    redirect("/dashboard");
  }

  // Get the impersonating user's info
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader 
        clientName={client.name} 
        isImpersonating={true}
        impersonatorEmail={user?.email}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {client.name}</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your websites
            </p>
          </div>

          <PortalSitesList sites={client.sites || []} />
        </div>
      </main>
    </div>
  );
}
