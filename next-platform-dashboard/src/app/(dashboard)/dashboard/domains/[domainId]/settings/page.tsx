import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDomain } from "@/lib/actions/domains";
import { getHealthCheck, getExpiryNotifications } from "@/lib/actions/automation";
import { createClient } from "@/lib/supabase/server";
import { DomainSettingsForm } from "./settings-form-client";
import { DomainHealthCheck, AutoRenewToggle, ExpiryNotifications } from "@/components/domains/automation";

interface SettingsPageProps {
  params: Promise<{ domainId: string }>;
}

export async function generateMetadata({ params }: SettingsPageProps): Promise<Metadata> {
  const { domainId } = await params;
  const response = await getDomain(domainId);
  
  return {
    title: response.data?.domain_name 
      ? `Settings - ${response.data.domain_name} | DRAMAC CMS`
      : 'Domain Settings | DRAMAC CMS',
  };
}

// Build contact data from the authenticated user's profile
async function getContactFromProfile() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, agency_id')
      .eq('id', user.id)
      .single();
    
    let agencyName = '';
    if (profile?.agency_id) {
      const { data: agency } = await supabase
        .from('agencies')
        .select('name')
        .eq('id', profile.agency_id)
        .single();
      agencyName = agency?.name || '';
    }
    
    return {
      name: profile?.full_name || user.user_metadata?.full_name || '',
      organization: agencyName,
      email: profile?.email || user.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'ZM',
      zipcode: '',
    };
  } catch {
    return null;
  }
}

// Fallback contact when profile lookup fails
const EMPTY_CONTACT = {
  name: '',
  organization: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: 'ZM',
  zipcode: '',
};

async function SettingsContent({ domainId }: { domainId: string }) {
  const response = await getDomain(domainId);
  
  if (!response.success || !response.data) {
    notFound();
  }
  
  const domain = response.data;
  
  // Fetch health check, notification data, and contact in parallel
  const [healthResult, notificationsResult, profileContact] = await Promise.all([
    getHealthCheck(domainId),
    getExpiryNotifications(domainId),
    getContactFromProfile(),
  ]);

  const contact = profileContact || EMPTY_CONTACT;

  // Cast health data to expected type
  const healthData = healthResult.data as {
    dns_healthy: boolean;
    ssl_healthy: boolean;
    nameservers_correct: boolean;
    whois_accessible: boolean;
    dns_issues: string[];
    ssl_issues: string[];
    last_checked_at: string;
  } | null | undefined;

  // Cast notifications data to expected type  
  const notificationSettings = notificationsResult.data as {
    notify_30_days?: boolean;
    notify_14_days?: boolean;
    notify_7_days?: boolean;
    notify_1_day?: boolean;
  } | undefined;

  // Get health status from domain (cast from unknown)
  const domainRecord = domain as unknown as { health_status?: string };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Domain Settings</h1>
        <p className="text-muted-foreground">
          Advanced settings for {domain.domain_name}
        </p>
      </div>
      
      {/* Domain Health Check */}
      <DomainHealthCheck 
        domainId={domainId}
        healthData={healthData}
        healthStatus={domainRecord.health_status}
      />
      
      {/* Auto-Renewal */}
      {domain.expiry_date && (
        <AutoRenewToggle
          domainId={domainId}
          enabled={domain.auto_renew ?? true}
          expiryDate={domain.expiry_date}
        />
      )}
      
      {/* Expiry Notifications */}
      <ExpiryNotifications 
        domainId={domainId} 
        settings={notificationSettings}
      />
      
      <DomainSettingsForm
        domainId={domain.id}
        domainName={domain.domain_name}
        transferLock={domain.transfer_lock}
        whoisPrivacy={domain.whois_privacy}
        autoRenew={domain.auto_renew}
        contact={contact}
      />
    </div>
  );
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { domainId } = await params;
  
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/domains/${domainId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Domain
        </Link>
      </Button>
      
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent domainId={domainId} />
      </Suspense>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
