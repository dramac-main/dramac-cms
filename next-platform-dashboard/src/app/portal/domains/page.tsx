import { Metadata } from "next";
import { Server, Globe, Calendar, Shield, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Domains | Client Portal",
  description: "View and manage your domains",
};

async function getClientDomains(clientId: string) {
  const supabase = await createClient();
  
  const { data: domains, error } = await supabase
    .from('domains')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching client domains:', error);
    return [];
  }
  
  return domains || [];
}

export default async function PortalDomainsPage() {
  const user = await requirePortalAuth();
  const domains = await getClientDomains(user.clientId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Domains"
        description="View your registered domains and their status"
      />

      {domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No domains yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Contact your agency to register a domain for your website
            </p>
            <Button asChild>
              <Link href="/portal/support/new">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain: any) => {
            const isExpiringSoon = domain.expiry_date && 
              new Date(domain.expiry_date).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
            const isExpired = domain.status === 'expired';

            return (
              <Card key={domain.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        {domain.domain_name}
                      </CardTitle>
                      <CardDescription>
                        Registered {formatDistanceToNow(new Date(domain.registration_date), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      domain.status === 'active' ? 'default' :
                      domain.status === 'pending' ? 'secondary' :
                      domain.status === 'expired' ? 'destructive' :
                      'outline'
                    }>
                      {domain.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          {new Date(domain.expiry_date).toLocaleDateString()}
                        </p>
                        {isExpiringSoon && !isExpired && (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Auto-Renew</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          {domain.auto_renew ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {domain.whois_privacy && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>WHOIS Privacy Protection enabled</span>
                    </div>
                  )}

                  {isExpiringSoon && !isExpired && (
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-amber-900 dark:text-amber-100">
                            Domain Expiring Soon
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            This domain expires in {Math.ceil((new Date(domain.expiry_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days.
                            {!domain.auto_renew && ' Auto-renew is disabled.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isExpired && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-destructive">Domain Expired</p>
                          <p className="text-sm text-destructive/80 mt-1">
                            This domain has expired. Contact your agency immediately to renew it.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need Help with Domains?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            For domain registration, transfers, renewals, or DNS changes, please contact your agency.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portal/support/new">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
