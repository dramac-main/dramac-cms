import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Mail, 
  Plus, 
  User,
  Settings,
  ExternalLink,
  Inbox,
  Send,
  Archive,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { getDomain } from "@/lib/actions/domains";

interface EmailPageProps {
  params: Promise<{ domainId: string }>;
}

export async function generateMetadata({ params }: EmailPageProps): Promise<Metadata> {
  const { domainId } = await params;
  const response = await getDomain(domainId);
  
  return {
    title: response.data?.domain_name 
      ? `Email - ${response.data.domain_name} | DRAMAC CMS`
      : 'Email Accounts | DRAMAC CMS',
  };
}

// Mock email accounts for UI testing
const MOCK_EMAIL_ACCOUNTS = [
  { 
    id: '1', 
    email: 'info@example.com', 
    name: 'Info', 
    status: 'active',
    storageUsed: 2.4,
    storageLimit: 10,
    lastLogin: '2026-01-31T10:30:00Z'
  },
  { 
    id: '2', 
    email: 'support@example.com', 
    name: 'Support Team', 
    status: 'active',
    storageUsed: 5.8,
    storageLimit: 10,
    lastLogin: '2026-02-01T08:15:00Z'
  },
  { 
    id: '3', 
    email: 'sales@example.com', 
    name: 'Sales', 
    status: 'pending',
    storageUsed: 0,
    storageLimit: 10,
    lastLogin: null
  },
];

async function EmailContent({ domainId }: { domainId: string }) {
  const response = await getDomain(domainId);
  
  if (!response.success || !response.data) {
    notFound();
  }
  
  const domain = response.data;
  const emailAccounts = MOCK_EMAIL_ACCOUNTS.map(a => ({
    ...a,
    email: a.email.replace('example.com', domain.domain_name)
  }));
  const hasEmailSetup = emailAccounts.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Accounts</h1>
          <p className="text-muted-foreground">
            Manage email accounts for {domain.domain_name}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Mailbox
        </Button>
      </div>
      
      {/* Email Provider Status */}
      <Card className="border-blue-200 bg-blue-500/5">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Titan Email (via ResellerClub)</p>
                <p className="text-sm text-muted-foreground">
                  Professional email hosting with 10GB storage per mailbox
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <a href="https://app.titan.email" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Webmail
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Inbox className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{emailAccounts.length}</p>
                <p className="text-sm text-muted-foreground">Mailboxes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {emailAccounts.filter(a => a.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Archive className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {emailAccounts.reduce((acc, a) => acc + a.storageUsed, 0).toFixed(1)} GB
                </p>
                <p className="text-sm text-muted-foreground">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Email Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Mailboxes</CardTitle>
          <CardDescription>
            All email accounts for this domain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailAccounts.map((account, index) => (
            <div key={account.id}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {account.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{account.email}</p>
                      {account.status === 'active' ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{account.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Storage */}
                  <div className="hidden sm:block w-32">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Storage</span>
                      <span>{account.storageUsed}/{account.storageLimit} GB</span>
                    </div>
                    <Progress 
                      value={(account.storageUsed / account.storageLimit) * 100} 
                      className="h-1.5"
                    />
                  </div>
                  
                  {/* Last Login */}
                  <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {account.lastLogin 
                      ? new Date(account.lastLogin).toLocaleDateString()
                      : 'Never'}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://app.titan.email`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Login
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Email Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Client Configuration</CardTitle>
          <CardDescription>
            Settings for desktop and mobile email clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Send className="h-4 w-4" />
                Incoming Mail (IMAP)
              </h4>
              <dl className="space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Server:</dt>
                  <dd className="font-mono">imap.titan.email</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Port:</dt>
                  <dd className="font-mono">993</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Security:</dt>
                  <dd className="font-mono">SSL/TLS</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Outgoing Mail (SMTP)
              </h4>
              <dl className="space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Server:</dt>
                  <dd className="font-mono">smtp.titan.email</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Port:</dt>
                  <dd className="font-mono">465</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Security:</dt>
                  <dd className="font-mono">SSL/TLS</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function EmailPage({ params }: EmailPageProps) {
  const { domainId } = await params;
  
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/domains/${domainId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Domain
        </Link>
      </Button>
      
      <Suspense fallback={<EmailSkeleton />}>
        <EmailContent domainId={domainId} />
      </Suspense>
    </div>
  );
}

function EmailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="grid sm:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
