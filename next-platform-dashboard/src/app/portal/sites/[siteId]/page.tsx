import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalSiteDetail } from "@/components/portal/portal-site-detail";

interface PortalSiteDetailPageProps {
  params: Promise<{ siteId: string }>;
}

export async function generateMetadata({ params }: PortalSiteDetailPageProps): Promise<Metadata> {
  const { siteId } = await params;
  const supabase = await createClient();
  
  const { data: site } = await supabase
    .from("sites")
    .select("name")
    .eq("id", siteId)
    .single();

  return {
    title: site ? `${site.name} | Client Portal` : "Site Not Found",
  };
}

export default async function PortalSiteDetailPage({ params }: PortalSiteDetailPageProps) {
  const { siteId } = await params;
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;
  
  if (!impersonatingClientId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  
  // Get the client being impersonated
  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", impersonatingClientId)
    .single();

  if (!client) {
    redirect("/dashboard");
  }

  // Get the site (must belong to the client)
  const { data: site, error } = await supabase
    .from("sites")
    .select(`
      *,
      pages(id, name, slug, is_homepage)
    `)
    .eq("id", siteId)
    .eq("client_id", client.id)
    .single();

  if (error || !site) {
    notFound();
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
        <PortalSiteDetail site={site} />
      </main>
    </div>
  );
}
