// src/app/(dashboard)/marketplace/developers/[slug]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Star,
  Download,
  Package,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleCard } from "@/components/marketplace/ModuleCard";
import { getDeveloperBySlug, getDeveloperModules, getDeveloperReviews } from "@/lib/marketplace";
import { PLATFORM } from "@/lib/constants/platform";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);

  if (!developer) {
    return { title: "Developer Not Found" };
  }

  return {
    title: `${developer.display_name} - Developer Profile | ${PLATFORM.name} Marketplace`,
    description: developer.bio || `Check out modules by ${developer.display_name}`,
  };
}

export default async function DeveloperProfilePage({ params }: Props) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);

  if (!developer) {
    notFound();
  }

  const { modules } = await getDeveloperModules(developer.user_id);
  const { reviews, total: totalReviews } = await getDeveloperReviews(developer.user_id);

  return (
    <div className="container max-w-6xl py-6">
      {/* Back button */}
      <Link href="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Marketplace
      </Link>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                {developer.avatar_url ? (
                  <img
                    src={developer.avatar_url}
                    alt={developer.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-white font-bold">
                    {developer.display_name[0]?.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold">{developer.display_name}</h1>
                {developer.is_verified && (
                  <Badge className="bg-blue-500">
                    <Shield className="h-3 w-3 mr-1" />
                    {developer.verification_type === "partner"
                      ? "Partner"
                      : developer.verification_type === "business"
                      ? "Business Verified"
                      : "Verified"}
                  </Badge>
                )}
              </div>

              {developer.bio && (
                <p className="text-muted-foreground mb-4">{developer.bio}</p>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-4">
                {developer.website_url && (
                  <a
                    href={developer.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {developer.github_url && (
                  <a
                    href={developer.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {developer.twitter_url && (
                  <a
                    href={developer.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                )}
                {developer.linkedin_url && (
                  <a
                    href={developer.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">{developer.total_modules}</div>
                <div className="text-xs text-muted-foreground">Modules</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Download className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {formatNumber(developer.total_downloads)}
                </div>
                <div className="text-xs text-muted-foreground">Downloads</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <div className="text-2xl font-bold">
                  {developer.avg_rating.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <MessageSquare className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">{developer.total_reviews}</div>
                <div className="text-xs text-muted-foreground">Reviews</div>
              </div>
            </div>
          </div>

          {/* Custom Request CTA */}
          {developer.accepts_custom_requests && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium">Need a Custom Module?</h3>
                <p className="text-sm text-muted-foreground">
                  This developer accepts custom requests
                  {developer.custom_request_rate && (
                    <> starting at ${developer.custom_request_rate}/hr</>
                  )}
                </p>
              </div>
              <Button>Request Custom Module</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">
            <Package className="h-4 w-4 mr-2" />
            Modules ({modules?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <MessageSquare className="h-4 w-4 mr-2" />
            Reviews ({totalReviews})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-6">
          {modules && modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={{
                    ...module,
                    developer: {
                      name: developer.display_name,
                      slug: developer.slug,
                      is_verified: developer.is_verified,
                    },
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Published Modules</h3>
                <p className="text-muted-foreground">
                  This developer hasn&apos;t published any modules yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link
                          href={`/marketplace/modules/${review.module_id}`}
                          className="font-medium hover:underline"
                        >
                          {review.module_name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i <= review.rating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="font-medium mb-1">{review.title}</h4>
                    )}
                    {review.content && (
                      <p className="text-sm text-muted-foreground">
                        {review.content}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Reviews Yet</h3>
                <p className="text-muted-foreground">
                  This developer&apos;s modules haven&apos;t received any reviews yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
