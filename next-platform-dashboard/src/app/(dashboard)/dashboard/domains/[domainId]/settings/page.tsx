import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDomain } from "@/lib/actions/domains";
import { getHealthCheck, getExpiryNotifications } from "@/lib/actions/automation";
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

// Mock contact data for UI testing
const MOCK_CONTACT = {
  name: 'John Doe',
  organization: 'Acme Corporation',
  email: 'john@acme.com',
  phone: '+1 555 123 4567',
  address: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  country: 'US',
  zipcode: '94102',
};

async function SettingsContent({ domainId }: { domainId: string }) {
  const response = await getDomain(domainId);
  
  if (!response.success || !response.data) {
    notFound();
  }
  
  const domain = response.data;
  
  // Fetch health check and notification data
  const [healthResult, notificationsResult] = await Promise.all([
    getHealthCheck(domainId),
    getExpiryNotifications(domainId),
  ]);

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
        contact={MOCK_CONTACT}
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
