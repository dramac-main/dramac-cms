"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2, Globe, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getPortalSeoSites,
  getPagesSeo,
  type PageSeo,
} from "@/lib/seo/seo-service";
import { analyzeSeo, getScoreColor, getScoreLabel } from "@/lib/seo/seo-analyzer";

interface SiteWithScore {
  id: string;
  name: string;
  domain: string | null;
  subdomain: string;
  score: number;
  pageCount: number;
  issues: number;
}

export default function PortalSeoPage() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<SiteWithScore[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { sites: sitesList } = await getPortalSeoSites();
      
      // Fetch SEO scores for each site
      const sitesWithScores = await Promise.all(
        sitesList.map(async (site) => {
          const pages = await getPagesSeo(site.id);
          const totalIssues = pages.reduce((sum, p) => {
            const result = analyzeSeo({
              title: p.seoTitle || p.pageName,
              description: p.seoDescription,
              slug: p.slug,
              ogImage: p.ogImageUrl,
              keywords: p.seoKeywords,
            });
            return sum + result.issues.length;
          }, 0);

          const avgScore = pages.length > 0
            ? Math.round(
                pages.reduce((sum, p) => {
                  const result = analyzeSeo({
                    title: p.seoTitle || p.pageName,
                    description: p.seoDescription,
                    slug: p.slug,
                    ogImage: p.ogImageUrl,
                    keywords: p.seoKeywords,
                  });
                  return sum + result.score;
                }, 0) / pages.length
              )
            : 0;

          return {
            ...site,
            score: avgScore,
            pageCount: pages.length,
            issues: totalIssues,
          };
        })
      );

      setSites(sitesWithScores);
    } catch (error) {
      console.error("Failed to load SEO data:", error);
      toast.error("Failed to load SEO data");
    }
    setLoading(false);
  };

  // Calculate overall stats
  const overallScore = sites.length > 0
    ? Math.round(sites.reduce((sum, s) => sum + s.score, 0) / sites.length)
    : 0;
  const totalPages = sites.reduce((sum, s) => sum + s.pageCount, 0);
  const totalIssues = sites.reduce((sum, s) => sum + s.issues, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6" />
          SEO Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Search engine optimization scores for your sites
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <div>
                <p className="font-medium">Overall Score</p>
                <p className="text-sm text-muted-foreground">
                  {getScoreLabel(overallScore)}
                </p>
              </div>
            </div>
            <Progress value={overallScore} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalPages}</p>
                <p className="text-sm text-muted-foreground">
                  Published Pages
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className={`h-8 w-8 ${totalIssues > 0 ? "text-yellow-600" : "text-green-600"}`} />
              <div>
                <p className="text-2xl font-bold">{totalIssues}</p>
                <p className="text-sm text-muted-foreground">
                  Total Issues
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sites List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Sites</CardTitle>
          <CardDescription>
            SEO scores by site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sites.map((site) => (
              <Link
                key={site.id}
                href={`/portal/seo/${site.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold w-12 text-center ${getScoreColor(site.score)}`}>
                      {site.score}
                    </div>
                    <div>
                      <p className="font-medium">{site.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {site.domain || `${site.subdomain}.dramac.app`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{site.pageCount} pages</p>
                      <p className="text-sm text-muted-foreground">
                        {site.issues} issue{site.issues !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge variant={site.score >= 80 ? "default" : site.score >= 50 ? "secondary" : "destructive"}>
                      {getScoreLabel(site.score)}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}

            {sites.length === 0 && (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No sites found
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            SEO Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <p>
            Improve your SEO scores by following these best practices:
          </p>
          <ul>
            <li><strong>Page Titles:</strong> Keep them 50-60 characters and include your main keyword</li>
            <li><strong>Meta Descriptions:</strong> Write compelling descriptions (150-160 characters) that encourage clicks</li>
            <li><strong>Images:</strong> Add descriptive alt text to all images</li>
            <li><strong>Content:</strong> Aim for at least 500 words on main pages</li>
            <li><strong>Headings:</strong> Use one H1 and structured H2/H3 headings</li>
            <li><strong>URLs:</strong> Keep them short, use hyphens, and include keywords</li>
          </ul>
          <p>
            Your agency team can help optimize your site&apos;s SEO settings.
            Contact them for personalized recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
