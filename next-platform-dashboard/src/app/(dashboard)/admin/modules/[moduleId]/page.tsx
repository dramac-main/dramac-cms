import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { InstallLevelBadge } from "@/components/modules/shared/install-level-badge";

export const metadata: Metadata = {
  title: "Module Details | Super Admin",
  description: "View and manage module details",
};

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

interface PageProps {
  params: Promise<{ moduleId: string }>;
}

export default async function ModuleDetailPage({ params }: PageProps) {
  const { moduleId } = await params;
  const supabase = await createClient() as AnySupabase;
  
  // Verify super admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get module
  const { data: module, error } = await supabase
    .from("modules_v2")
    .select("*")
    .eq("id", moduleId)
    .single();

  if (error || !module) {
    notFound();
  }

  // Get subscription and installation stats
  let subscriptionCount = 0;
  let agencyInstalls = 0;
  let clientInstalls = 0;
  let siteInstalls = 0;

  try {
    const [subscriptions, agency, client, site] = await Promise.all([
      (supabase as any)
        .from("agency_module_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId)
        .eq("status", "active"),
      (supabase as any)
        .from("agency_module_installations")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId),
      (supabase as any)
        .from("client_module_installations")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId),
      (supabase as any)
        .from("site_module_installations")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId),
    ]);

    subscriptionCount = subscriptions.count || 0;
    agencyInstalls = agency.count || 0;
    clientInstalls = client.count || 0;
    siteInstalls = site.count || 0;
  } catch {
    // Tables may not exist yet
  }

  const totalInstalls = agencyInstalls + clientInstalls + siteInstalls;
  const monthlyRevenue = subscriptionCount * (module.wholesale_price_monthly || 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      draft: "secondary",
      deprecated: "destructive",
      disabled: "outline",
      review: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/modules">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Link href="/admin/modules" className="hover:underline">
                Module Management
              </Link>
              <span>/</span>
              <span>{module.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{module.icon || "📦"}</span>
              <h1 className="text-3xl font-bold">{module.name}</h1>
              {getStatusBadge(module.status)}
              {module.is_featured && (
                <Badge className="bg-purple-100 text-purple-700">Featured</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/marketplace/${module.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Marketplace
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/modules/studio/${moduleId}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Module
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{subscriptionCount}</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Installations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totalInstalls}</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              ${(monthlyRevenue / 100).toFixed(0)}
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {module.rating_average ? `${module.rating_average.toFixed(1)} ⭐` : "N/A"}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{module.description || "No description"}</p>
              </div>
              
              {module.long_description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Long Description</label>
                  <p className="mt-1 whitespace-pre-wrap">{module.long_description}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slug</label>
                  <p className="mt-1 font-mono text-sm">{module.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="mt-1">{module.current_version || "1.0.0"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="mt-1">
                    <Badge variant="outline">{module.category}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Install Level</label>
                  <p className="mt-1">
                    <InstallLevelBadge level={module.install_level} />
                  </p>
                </div>
              </div>
              
              {module.features && module.features.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Features</label>
                    <ul className="mt-2 space-y-1">
                      {module.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Installation Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Installation Breakdown</CardTitle>
              <CardDescription>Where this module is installed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                    Agency Level
                  </span>
                  <span className="font-medium">{agencyInstalls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    Client Level
                  </span>
                  <span className="font-medium">{clientInstalls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    Site Level
                  </span>
                  <span className="font-medium">{siteInstalls}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pricing Type</label>
                <p className="mt-1 capitalize">{module.pricing_type || "free"}</p>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Wholesale (Monthly)</label>
                <p className="mt-1 text-lg font-bold">
                  {formatPrice(module.wholesale_price_monthly)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Wholesale (Yearly)</label>
                <p className="mt-1">
                  {formatPrice(module.wholesale_price_yearly)}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Suggested Retail (Monthly)</label>
                <p className="mt-1">
                  {formatPrice(module.suggested_retail_monthly)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Suggested Retail (Yearly)</label>
                <p className="mt-1">
                  {formatPrice(module.suggested_retail_yearly)}
                </p>
              </div>
              
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/modules/pricing`}>
                  Edit Pricing
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Integrations Card */}
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">LemonSqueezy</span>
                {module.lemon_product_id ? (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not Set
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Stripe (Legacy)</span>
                {module.stripe_product_id ? (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not Set
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(module.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(module.updated_at).toLocaleDateString()}</span>
              </div>
              {module.published_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <span>{new Date(module.published_at).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Author</span>
                <span>{module.author_name || "DRAMAC"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
