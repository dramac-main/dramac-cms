import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Settings, 
  User,
  Building,
  Phone,
  MapPin,
  Mail,
  Shield,
  Lock,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDomain } from "@/lib/actions/domains";

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
  const contact = MOCK_CONTACT;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Domain Settings</h1>
        <p className="text-muted-foreground">
          Advanced settings for {domain.domain_name}
        </p>
      </div>
      
      {/* Domain Lock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Domain Lock
          </CardTitle>
          <CardDescription>
            Protect your domain from unauthorized transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Transfer Lock</p>
              <p className="text-sm text-muted-foreground">
                When enabled, the domain cannot be transferred to another registrar
              </p>
            </div>
            <Switch defaultChecked={domain.transfer_lock ?? true} />
          </div>
        </CardContent>
      </Card>
      
      {/* WHOIS Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            WHOIS Privacy
          </CardTitle>
          <CardDescription>
            Hide your personal information from public WHOIS lookups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Privacy Protection</p>
              <p className="text-sm text-muted-foreground">
                Replace your contact info with privacy service details
              </p>
            </div>
            <Switch defaultChecked={domain.whois_privacy} />
          </div>
          
          {domain.whois_privacy && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Privacy Enabled</AlertTitle>
              <AlertDescription>
                Your personal information is hidden from public WHOIS lookups.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Auto-Renewal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Auto-Renewal
          </CardTitle>
          <CardDescription>
            Automatically renew your domain before it expires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Auto-Renew</p>
              <p className="text-sm text-muted-foreground">
                Domain will be renewed 7 days before expiry
              </p>
            </div>
            <Switch defaultChecked={domain.auto_renew} />
          </div>
        </CardContent>
      </Card>
      
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registrant Contact
          </CardTitle>
          <CardDescription>
            Contact information associated with this domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={contact.name} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input id="organization" defaultValue={contact.organization} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={contact.email} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue={contact.phone} />
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" defaultValue={contact.address} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" defaultValue={contact.city} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input id="state" defaultValue={contact.state} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" defaultValue={contact.country} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipcode">Postal Code</Label>
              <Input id="zipcode" defaultValue={contact.zipcode} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Contact
          </Button>
        </CardFooter>
      </Card>
      
      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for this domain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium">Delete Domain</p>
              <p className="text-sm text-muted-foreground">
                Remove this domain from your account. This cannot be undone.
              </p>
            </div>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Transfer Domain Out</p>
              <p className="text-sm text-muted-foreground">
                Transfer this domain to another registrar
              </p>
            </div>
            <Button variant="outline">
              Start Transfer
            </Button>
          </div>
        </CardContent>
      </Card>
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
