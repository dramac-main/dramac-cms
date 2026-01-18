"use client";

import Link from "next/link";
import { CheckCircle, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { analyzeSeo, getScoreColor, type SeoAuditResult } from "@/lib/seo/seo-analyzer";
import type { PageSeo } from "@/lib/seo/seo-service";

interface PageSeoListProps {
  pages: PageSeo[];
  siteId: string;
  baseUrl?: string;
  onSelectPage?: (page: PageSeo) => void;
}

export function PageSeoList({ 
  pages, 
  siteId, 
  baseUrl,
  onSelectPage 
}: PageSeoListProps) {
  if (pages.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No published pages found</p>
      </div>
    );
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (score >= 50) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getAnalysis = (page: PageSeo): SeoAuditResult => {
    return analyzeSeo({
      title: page.seoTitle || page.pageName,
      description: page.seoDescription,
      slug: page.slug,
      ogImage: page.ogImageUrl,
      keywords: page.seoKeywords,
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            <TableHead>SEO Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-center">Index</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => {
            const analysis = getAnalysis(page);
            
            return (
              <TableRow 
                key={page.pageId}
                className={onSelectPage ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onSelectPage?.(page)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{page.pageName}</p>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="max-w-[200px] truncate">
                    {page.seoTitle || <span className="text-muted-foreground">Not set</span>}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="max-w-[200px] truncate text-sm">
                    {page.seoDescription || <span className="text-muted-foreground">Not set</span>}
                  </p>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {getScoreIcon(analysis.score)}
                    <span className={`font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {page.robotsIndex ? (
                    <Badge variant="outline" className="text-green-600">Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600">No</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {baseUrl && (
                      <Button variant="ghost" size="icon" asChild>
                        <a 
                          href={`${baseUrl}/${page.slug === 'home' ? '' : page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/sites/${siteId}/seo/pages?page=${page.pageId}`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Compact version for smaller spaces
interface CompactPageSeoListProps {
  pages: PageSeo[];
  siteId: string;
  maxItems?: number;
}

export function CompactPageSeoList({ 
  pages, 
  siteId, 
  maxItems = 5 
}: CompactPageSeoListProps) {
  const displayPages = pages.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {displayPages.map((page) => {
        const analysis = analyzeSeo({
          title: page.seoTitle || page.pageName,
          description: page.seoDescription,
          slug: page.slug,
          ogImage: page.ogImageUrl,
          keywords: page.seoKeywords,
        });

        return (
          <Link
            key={page.pageId}
            href={`/sites/${siteId}/seo/pages?page=${page.pageId}`}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {analysis.score >= 80 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : analysis.score >= 50 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <div>
                <p className="font-medium text-sm">{page.pageName}</p>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
              </div>
            </div>
            <span className={`font-bold text-sm ${getScoreColor(analysis.score)}`}>
              {analysis.score}
            </span>
          </Link>
        );
      })}

      {pages.length > maxItems && (
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/sites/${siteId}/seo/pages`}>
            View all {pages.length} pages
          </Link>
        </Button>
      )}

      {pages.length === 0 && (
        <p className="text-center text-muted-foreground py-4 text-sm">
          No published pages
        </p>
      )}
    </div>
  );
}
