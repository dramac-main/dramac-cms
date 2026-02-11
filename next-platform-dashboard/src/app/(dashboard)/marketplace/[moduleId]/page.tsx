import { notFound } from "next/navigation";
import Link from "next/link";
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from "@/lib/locale-config";
import {
  ArrowLeft,
  Star,
  Download,
  Check,
  ExternalLink,
  Shield,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getModuleById } from "@/lib/modules/module-registry-server";
import { MODULE_CATEGORIES } from "@/lib/modules/module-catalog";
import { ModuleInstallButton } from "@/components/modules/marketplace/module-install-button";
import { ModuleIconContainer } from "@/components/modules/shared/module-icon-container";
import type { Metadata } from "next";

interface ModuleDetailPageProps {
  params: Promise<{ moduleId: string }>;
}

// Format price for display
function formatPrice(pricing: { type: string; amount: number; currency: string }): string {
  if (pricing.type === "free" || pricing.amount === 0) {
    return "Free";
  }
  
  const amount = pricing.amount / 100; // Convert cents to currency amount
  const formatted = new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: pricing.currency || DEFAULT_CURRENCY,
  }).format(amount);
  
  if (pricing.type === "monthly") {
    return `${formatted}/mo`;
  }
  if (pricing.type === "one-time") {
    return formatted;
  }
  return formatted;
}

export async function generateMetadata({ params }: ModuleDetailPageProps): Promise<Metadata> {
  const { moduleId } = await params;
  const module = await getModuleById(moduleId);
  
  if (!module) {
    return { title: "Module Not Found" };
  }
  
  return {
    title: `${module.name} - Module Marketplace`,
    description: module.description,
  };
}

export default async function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  const { moduleId } = await params;
  
  // Fetch module from registry (now includes both catalog AND studio modules)
  const module = await getModuleById(moduleId);

  if (!module) {
    notFound();
  }

  const category = MODULE_CATEGORIES.find((c) => c.id === module.category);
  const isFree = module.pricing.type === "free";

  return (
    <div className="container py-6 max-w-5xl">
      {/* Back Link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Marketplace
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <ModuleIconContainer icon={module.icon} category={module.category} size="lg" />
            <div>
              <h1 className="text-3xl font-bold">{module.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>by {module.author.name}</span>
                {module.author.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <p className="text-lg text-muted-foreground mb-4">
            {module.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {module.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{module.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({module.reviewCount} reviews)
                </span>
              </div>
            )}
            {module.installCount && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download className="h-4 w-4" />
                <span>{module.installCount.toLocaleString()} installs</span>
              </div>
            )}
            {category && (
              <Badge variant="outline">
                {category.label}
              </Badge>
            )}
            {module.status === "beta" && (
              <Badge variant="secondary">Beta</Badge>
            )}
            {module.source === "studio" && (
              <Badge variant="outline" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                Studio Module
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Card */}
        <Card className="w-full md:w-80 shrink-0">
          <CardHeader>
            <CardTitle className="text-2xl">
              {formatPrice(module.pricing)}
            </CardTitle>
            {module.pricing.type === "monthly" && (
              <p className="text-sm text-muted-foreground">
                Billed monthly per site
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <ModuleInstallButton 
              moduleId={module.id}
              moduleSlug={module.slug}
              moduleName={module.name}
              isFree={isFree}
            />

            <ul className="space-y-2 text-sm">
              {(module.features || []).slice(0, 5).map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {module.author.website && (
              <a
                href={module.author.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Visit Developer Site
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="mb-8" />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="prose dark:prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: (module.longDescription || module.description || "").replace(/\n/g, "<br />"),
              }}
            />
          </div>

          {/* Tags */}
          <div className="mt-8">
            <h3 className="font-medium mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {module.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(module.features || []).map((feature, i) => (
              <Card key={i}>
                <CardContent className="flex items-start gap-3 pt-4">
                  <Check className="h-5 w-5 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {module.requirements && module.requirements.length > 0 && (
            <div className="mt-8">
              <h3 className="font-medium mb-3">Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {module.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="changelog" className="mt-6">
          {module.changelog && module.changelog.length > 0 ? (
            <div className="space-y-6">
              {module.changelog.map((entry, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">v{entry.version}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {entry.date}
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {entry.changes.map((change, j) => (
                      <li key={j}>{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No changelog available yet.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Module Info Footer */}
      <div className="mt-12 pt-6 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Version</span>
            <p className="font-medium">{module.version}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Last Updated</span>
            <p className="font-medium">
              {module.updatedAt.toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Category</span>
            <p className="font-medium">{category?.label}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className="font-medium capitalize">{module.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
