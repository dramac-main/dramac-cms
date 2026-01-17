import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DomainSettings } from "@/components/publishing/domain-settings";

interface DomainSettingsPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function DomainSettingsPage({ params }: DomainSettingsPageProps) {
  const { siteId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get site - only select fields that are guaranteed to exist
  const { data: site, error } = await supabase
    .from("sites")
    .select(`
      id,
      name,
      subdomain,
      custom_domain
    `)
    .eq("id", siteId)
    .single();

  if (error || !site) {
    notFound();
  }

  return (
    <div className="container max-w-3xl py-8">
      <Link
        href={`/sites/${siteId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Site
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Domain Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your site&apos;s domain and SSL settings
        </p>
      </div>

      <DomainSettings siteId={siteId} subdomain={site.subdomain} />
    </div>
  );
}
