import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { 
  Package, 
  Check, 
  Star, 
  Users, 
  Building2, 
  Globe,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { SubscribeButton } from "@/components/modules/marketplace/subscribe-button";
import { ProfitCalculator } from "@/components/modules/marketplace/profit-calculator";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: module } = await supabase
    .from("modules_v2" as any)
    .select("name, description")
    .eq("slug", slug)
    .single();

  return {
    title: `${(module as any)?.name || "Module"} | Marketplace`,
    description: (module as any)?.description || "View module details",
  };
}

export default async function ModuleDetailV2Page({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user?.id || "")
    .single();

  // Get module details
  const { data: module, error } = await supabase
    .from("modules_v2" as any)
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !module) {
    notFound();
  }

  const mod = module as any;

  // Check if already subscribed
  const { data: subscription } = profile?.agency_id 
    ? await supabase
        .from("agency_module_subscriptions" as any)
        .select("*")
        .eq("agency_id", profile.agency_id)
        .eq("module_id", mod.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  const isSubscribed = !!subscription;

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getInstallLevelInfo = (level: string) => {
    switch (level) {
      case "agency":
        return {
          icon: <Building2 className="h-5 w-5" />,
          label: "Agency Level",
          description: "Tools for running your agency",
          color: "text-purple-600 bg-purple-100",
        };
      case "client":
        return {
          icon: <Users className="h-5 w-5" />,
          label: "Client Level",
          description: "Apps for your clients (no website needed)",
          color: "text-blue-600 bg-blue-100",
        };
      case "site":
        return {
          icon: <Globe className="h-5 w-5" />,
          label: "Site Level",
          description: "Website enhancements and features",
          color: "text-green-600 bg-green-100",
        };
      default:
        return {
          icon: <Package className="h-5 w-5" />,
          label: "Module",
          description: "",
          color: "",
        };
    }
  };

  const installLevelInfo = getInstallLevelInfo(mod.install_level);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link 
        href="/marketplace/v2" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <span className="text-5xl">{mod.icon || "📦"}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{mod.name}</h1>
                    {mod.is_featured && (
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">{mod.description}</p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge variant="outline">{mod.category}</Badge>
                    <Badge 
                      variant="outline" 
                      className={installLevelInfo.color}
                    >
                      {installLevelInfo.icon}
                      <span className="ml-1">{installLevelInfo.label}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {mod.install_count || 0} agencies using this
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Long Description */}
          {mod.long_description && (
            <Card>
              <CardHeader>
                <CardTitle>About this Module</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {mod.long_description}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          {mod.features && (mod.features as string[]).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(mod.features as string[]).map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Install Level Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {installLevelInfo.icon}
                {installLevelInfo.label}
              </CardTitle>
              <CardDescription>{installLevelInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {mod.install_level === "agency" && (
                <p className="text-sm text-muted-foreground">
                  This module is for your agency's internal use. Once subscribed, 
                  it will be available in your agency dashboard.
                </p>
              )}
              {mod.install_level === "client" && (
                <p className="text-sm text-muted-foreground">
                  This module can be installed for individual clients. 
                  They can access it through their client portal without needing a website.
                  You set your own price and keep the profit.
                </p>
              )}
              {mod.install_level === "site" && (
                <p className="text-sm text-muted-foreground">
                  This module enhances client websites. Install it on any site 
                  to add features like forms, analytics, or SEO tools.
                  You set your own price and keep the profit.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Pricing & Subscribe */}
        <div className="space-y-4">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Wholesale Price</p>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(mod.wholesale_price_monthly)}
                  <span className="text-lg font-normal text-muted-foreground">/mo</span>
                </p>
              </div>

              {mod.suggested_retail_monthly && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Suggested Retail</p>
                  <p className="text-lg font-semibold">
                    {formatPrice(mod.suggested_retail_monthly)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
              )}

              <Separator />

              {isSubscribed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">You're subscribed!</span>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/modules/${mod.id}`}>
                      Manage Module
                    </Link>
                  </Button>
                </div>
              ) : (
                <SubscribeButton 
                  moduleId={mod.id}
                  moduleName={mod.name}
                  price={mod.wholesale_price_monthly || 0}
                  agencyId={profile?.agency_id || ""}
                />
              )}
            </CardContent>
          </Card>

          {/* Profit Calculator */}
          {(mod.install_level === "client" || mod.install_level === "site") && (
            <ProfitCalculator 
              wholesalePrice={mod.wholesale_price_monthly || 0}
              suggestedRetail={mod.suggested_retail_monthly || (mod.wholesale_price_monthly || 0) * 2}
            />
          )}

          {/* Requirements */}
          {mod.requirements && (mod.requirements as string[]).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {(mod.requirements as string[]).map((req: string, index: number) => (
                    <li key={index} className="text-muted-foreground">
                      • {req}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
