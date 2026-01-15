import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalSupport } from "@/components/portal/portal-support";

export const metadata: Metadata = {
  title: "Support | Client Portal",
  description: "Get help with your websites",
};

export default async function PortalSupportPage() {
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;
  
  if (!impersonatingClientId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  
  // Get the client being impersonated
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("id", impersonatingClientId)
    .single();

  if (!client) {
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
        <PortalSupport clientEmail={client.email} />
      </main>
    </div>
  );
}
