import { Metadata } from "next";
import { Mail, ExternalLink, AlertCircle, Shield, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Business Email | Client Portal",
  description: "Manage your business email accounts",
};

async function getClientEmailAccounts(clientId: string) {
  const supabase = await createClient();
  
  // Get domains for this client
  const { data: domains } = await supabase
    .from('domains')
    .select('id')
    .eq('client_id', clientId);
  
  if (!domains || domains.length === 0) {
    return [];
  }
  
  const domainIds = domains.map(d => d.id);
  
  // Get email accounts for those domains
  const { data: accounts, error } = await supabase
    .from('domain_email_accounts')
    .select(`
      *,
      domain:domains(domain_name)
    `)
    .in('domain_id', domainIds)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching email accounts:', error);
    return [];
  }
  
  return accounts || [];
}

export default async function PortalEmailPage() {
  const user = await requirePortalAuth();
  const accounts = await getClientEmailAccounts(user.clientId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Email"
        description="Access and manage your professional email accounts"
      />

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No email accounts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Contact your agency to set up professional email for your domain
            </p>
            <Button asChild>
              <Link href="/portal/support/new">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick Access to Webmail */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Access Your Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Log in to your email inbox through Titan Mail webmail
              </p>
              <Button asChild>
                <a 
                  href="https://app.titan.email" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Open Webmail
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Email Accounts List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Email Accounts</h3>
            <div className="grid gap-4">
              {accounts.map((account: any) => (
                <Card key={account.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Mail className="h-4 w-4" />
                          {account.email_address}
                        </CardTitle>
                        {account.display_name && (
                          <CardDescription>{account.display_name}</CardDescription>
                        )}
                      </div>
                      <Badge>Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Domain</p>
                        <p className="font-medium">{account.domain?.domain_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Account Type</p>
                        <p className="font-medium capitalize">{account.account_type}</p>
                      </div>
                      {account.mailbox_size_gb && (
                        <>
                          <div>
                            <p className="text-muted-foreground mb-1">Storage</p>
                            <div className="flex items-center gap-1">
                              <Database className="h-3 w-3 text-muted-foreground" />
                              <p className="font-medium">
                                {account.mailbox_size_gb} GB
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Used</p>
                            <p className="font-medium">
                              {((account.storage_used_mb || 0) / 1024).toFixed(2)} GB
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {account.forward_to && account.forward_to.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">Forwarding To:</p>
                        <div className="space-y-1">
                          {account.forward_to.map((email: string, idx: number) => (
                            <p key={idx} className="text-sm text-muted-foreground">
                              → {email}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Setup & Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Email Client Setup</h4>
            <p className="text-sm text-muted-foreground">
              To configure your email in Outlook, Apple Mail, or other email clients:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Contact your agency for IMAP/SMTP settings</li>
              <li>Or use the webmail interface at app.titan.email</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Need Additional Email Accounts?</h4>
            <p className="text-sm text-muted-foreground">
              Contact your agency to add more email accounts, change passwords, or upgrade storage.
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/portal/support/new">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Security Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 dark:text-blue-100 space-y-2">
          <ul className="space-y-1 list-disc list-inside">
            <li>Never share your email password with anyone</li>
            <li>Use a strong, unique password for your email account</li>
            <li>Enable two-factor authentication if available</li>
            <li>Be cautious of phishing emails asking for personal information</li>
            <li>Contact your agency immediately if you notice suspicious activity</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
