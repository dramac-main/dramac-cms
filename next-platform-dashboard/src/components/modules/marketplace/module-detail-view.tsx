'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Star, 
  Download, 
  Check, 
  ExternalLink, 
  ChevronLeft,
  Shield,
  Users,
  MessageSquare,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { MODULE_CATEGORIES } from '@/lib/modules/module-categories';
import { formatCurrency } from '@/lib/locale-config';
import { 
  getModuleDetails, 
  getRelatedModules,
  type ModuleDetails,
  type ModuleListItem 
} from '@/lib/modules/marketplace-search';
import { EnhancedModuleCard } from './enhanced-module-card';
import { ModuleReviews } from './module-reviews';

interface ModuleDetailViewProps {
  moduleSlug: string;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onInstall?: () => void;
  isLoading?: boolean;
  backLink?: string;
}

/**
 * Format price in cents to display string
 */
function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return 'Free';
  return formatCurrency(cents / 100);
}

export function ModuleDetailView({ 
  moduleSlug,
  isSubscribed = false,
  onSubscribe,
  onInstall,
  isLoading = false,
  backLink = '/marketplace'
}: ModuleDetailViewProps) {
  const [module, setModule] = useState<ModuleDetails | null>(null);
  const [relatedModules, setRelatedModules] = useState<ModuleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState(0);

  useEffect(() => {
    async function loadModule() {
      try {
        setLoading(true);
        const data = await getModuleDetails(moduleSlug);
        if (!data) {
          setError('Module not found');
          return;
        }
        setModule(data);
        
        // Load related modules
        const related = await getRelatedModules(data.id, data.category);
        setRelatedModules(related);
      } catch (err) {
        console.error('Error loading module:', err);
        setError('Failed to load module details');
      } finally {
        setLoading(false);
      }
    }
    
    loadModule();
  }, [moduleSlug]);

  if (loading) {
    return <ModuleDetailSkeleton />;
  }

  if (error || !module) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{error || 'Module not found'}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={backLink}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>
      </Card>
    );
  }

  const category = MODULE_CATEGORIES[module.category as keyof typeof MODULE_CATEGORIES];

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={backLink}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Marketplace
        </Link>
      </Button>

      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Module Header */}
          <div className="flex items-start gap-4">
            <div className="text-6xl">{module.icon || '📦'}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{module.name}</h1>
              <p className="text-muted-foreground mt-1">
                by {module.author_name || 'Unknown'}
                {module.author_verified && (
                  <span className="ml-1 text-blue-500" title="Verified Author">✓</span>
                )}
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {category && (
                  <Badge style={{ backgroundColor: category.color, color: 'white' }}>
                    {category.label}
                  </Badge>
                )}
                {module.is_featured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
                {module.rating_average !== null && module.rating_average > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{module.rating_average.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({module.rating_count} reviews)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span>{(module.install_count || 0).toLocaleString()} installs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Screenshots */}
          {module.screenshots && module.screenshots.length > 0 && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={module.screenshots[activeScreenshot]}
                  alt={`${module.name} screenshot ${activeScreenshot + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              {module.screenshots.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {module.screenshots.map((screenshot, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveScreenshot(index)}
                      className={`relative w-24 h-16 rounded border overflow-hidden shrink-0 ${
                        index === activeScreenshot ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <Image
                        src={screenshot}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({module.rating_count || 0})
              </TabsTrigger>
              {module.changelog && <TabsTrigger value="changelog">Changelog</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="pt-6 prose dark:prose-invert max-w-none">
                  <p>{module.description}</p>
                  {module.long_description && (
                    <div 
                      className="mt-4"
                      dangerouslySetInnerHTML={{ __html: module.long_description }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="features" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {module.features && module.features.length > 0 ? (
                    <ul className="space-y-2">
                      {module.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No features listed</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-4">
              <ModuleReviews 
                moduleId={module.id}
                reviews={module.reviews || []}
              />
            </TabsContent>
            
            {module.changelog && (
              <TabsContent value="changelog" className="mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {module.changelog.map((entry, index) => (
                      <div key={index}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{entry.version}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {entry.changes.map((change, i) => (
                            <li key={i}>{change}</li>
                          ))}
                        </ul>
                        {index < module.changelog!.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar - Pricing & Install */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Price */}
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {module.pricing_type === 'free' ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>{formatPrice(module.wholesale_price_monthly)}<span className="text-lg font-normal text-muted-foreground">/mo</span></span>
                  )}
                </div>
                {module.wholesale_price_yearly && module.pricing_type !== 'free' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    or {formatPrice(module.wholesale_price_yearly)}/year
                  </p>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                {isSubscribed ? (
                  <>
                    <Button className="w-full" variant="secondary" disabled>
                      <Check className="mr-2 h-4 w-4" />
                      Subscribed
                    </Button>
                    {onInstall && (
                      <Button className="w-full" onClick={onInstall} disabled={isLoading}>
                        Install to Site
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={onSubscribe}
                    disabled={isLoading}
                  >
                    {module.pricing_type === 'free' ? 'Get Free' : 'Subscribe'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>

              <Separator />

              {/* Quick Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Updated
                  </span>
                  <span>{new Date(module.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Installs
                  </span>
                  <span>{(module.install_count || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Reviews
                  </span>
                  <span>{module.rating_count || 0}</span>
                </div>
              </div>

              {/* Links */}
              {(module.documentation_url || module.support_url) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {module.documentation_url && (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={module.documentation_url} target="_blank" rel="noopener noreferrer">
                          Documentation
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {module.support_url && (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={module.support_url} target="_blank" rel="noopener noreferrer">
                          Get Support
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {module.tags && module.tags.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {module.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {module.requirements && module.requirements.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {module.requirements.map((req, index) => (
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

      {/* Related Modules */}
      {relatedModules.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Related Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedModules.map((related) => (
              <EnhancedModuleCard key={related.id} module={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ModuleDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
