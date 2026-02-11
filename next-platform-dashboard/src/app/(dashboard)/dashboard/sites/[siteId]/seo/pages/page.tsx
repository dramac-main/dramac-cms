"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CircleCheck,
  AlertTriangle,
  CircleX,
  Info,
  Search,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  getPagesSeo,
  getPageSeo,
  updatePageSeo,
  getSiteForSeo,
  canEditPageSeo,
  type PageSeo,
} from "@/lib/seo/seo-service";
import { 
  analyzeSeo, 
  getScoreColor, 
  getScoreLabel,
  getIssueColor,
  type SeoAuditResult 
} from "@/lib/seo/seo-analyzer";

export default function PagesSeoPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);
  const searchParams = useSearchParams();
  const selectedPageId = searchParams.get("page");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<PageSeo[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageSeo | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [analysis, setAnalysis] = useState<SeoAuditResult | null>(null);

  useEffect(() => {
    loadData();
  }, [siteId]);

  useEffect(() => {
    if (selectedPageId && pages.length > 0) {
      const page = pages.find(p => p.pageId === selectedPageId);
      if (page) {
        setSelectedPage(page);
        runAnalysis(page);
      }
    }
  }, [selectedPageId, pages]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pagesData, editPermission, siteInfo] = await Promise.all([
        getPagesSeo(siteId),
        canEditPageSeo(),
        getSiteForSeo(siteId),
      ]);
      setPages(pagesData);
      setCanEdit(editPermission);
      setSiteName(siteInfo?.name || "Site");
      
      // Auto-select first page if none selected
      if (pagesData.length > 0 && !selectedPageId) {
        setSelectedPage(pagesData[0]);
        runAnalysis(pagesData[0]);
      }
    } catch (error) {
      console.error("Failed to load pages:", error);
      toast.error("Failed to load page SEO data");
    }
    setLoading(false);
  };

  const runAnalysis = (page: PageSeo) => {
    const result = analyzeSeo({
      title: page.seoTitle || page.pageName,
      description: page.seoDescription,
      slug: page.slug,
      ogImage: page.ogImageUrl,
      keywords: page.seoKeywords,
      ogTitle: page.ogTitle,
      ogDescription: page.ogDescription,
      canonicalUrl: page.canonicalUrl,
    });
    setAnalysis(result);
  };

  const handleSelectPage = (page: PageSeo) => {
    setSelectedPage(page);
    runAnalysis(page);
  };

  const handleSave = async () => {
    if (!selectedPage || !canEdit) return;

    setSaving(true);
    try {
      const result = await updatePageSeo(selectedPage.pageId, {
        seoTitle: selectedPage.seoTitle || undefined,
        seoDescription: selectedPage.seoDescription || undefined,
        seoKeywords: selectedPage.seoKeywords,
        ogTitle: selectedPage.ogTitle || undefined,
        ogDescription: selectedPage.ogDescription || undefined,
        ogImageUrl: selectedPage.ogImageUrl,
        robotsIndex: selectedPage.robotsIndex,
        robotsFollow: selectedPage.robotsFollow,
        canonicalUrl: selectedPage.canonicalUrl || undefined,
      });
      
      if (result.success) {
        toast.success("Page SEO saved");
        // Update local state
        setPages(pages.map(p => 
          p.pageId === selectedPage.pageId ? selectedPage : p
        ));
        runAnalysis(selectedPage);
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save page SEO");
    }
    setSaving(false);
  };

  const updateSelectedPage = (updates: Partial<PageSeo>) => {
    if (!selectedPage) return;
    const updated = { ...selectedPage, ...updates };
    setSelectedPage(updated);
    runAnalysis(updated);
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/sites/${siteId}/seo`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6" />
              Page SEO
            </h1>
            <p className="text-muted-foreground mt-1">
              {siteName} - Optimize individual pages
            </p>
          </div>
        </div>
        {canEdit && selectedPage && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Page List */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Pages</CardTitle>
              <CardDescription>
                {pages.length} published page{pages.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {pages.map((page) => {
                const result = analyzeSeo({
                  title: page.seoTitle || page.pageName,
                  description: page.seoDescription,
                  slug: page.slug,
                  ogImage: page.ogImageUrl,
                  keywords: page.seoKeywords,
                });
                const isSelected = selectedPage?.pageId === page.pageId;

                return (
                  <button
                    key={page.pageId}
                    onClick={() => handleSelectPage(page)}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg text-left transition-colors ${
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {result.score >= 80 ? (
                        <CircleCheck className="h-4 w-4 text-green-600 shrink-0" />
                      ) : result.score >= 50 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                      ) : (
                        <CircleX className="h-4 w-4 text-red-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{page.pageName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          /{page.slug}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${getScoreColor(result.score)}`}>
                      {result.score}
                    </span>
                  </button>
                );
              })}

              {pages.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No published pages
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Page Editor */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {selectedPage ? (
            <>
              {/* Score Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl font-bold ${getScoreColor(analysis?.score || 0)}`}>
                        {analysis?.score || 0}
                      </div>
                      <div>
                        <p className="font-medium">{getScoreLabel(analysis?.score || 0)}</p>
                        <p className="text-sm text-muted-foreground">
                          {analysis?.issues.length || 0} issue{(analysis?.issues.length || 0) !== 1 ? "s" : ""} found
                        </p>
                      </div>
                    </div>
                    <Badge variant={analysis?.score && analysis.score >= 80 ? "default" : "secondary"}>
                      /{selectedPage.slug}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Issues & Passed */}
              {analysis && (analysis.issues.length > 0 || analysis.passed.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.issues.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Issues to Fix</p>
                        {analysis.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            {issue.type === "error" ? (
                              <CircleX className={`h-5 w-5 shrink-0 ${getIssueColor(issue.type)}`} />
                            ) : issue.type === "warning" ? (
                              <AlertTriangle className={`h-5 w-5 shrink-0 ${getIssueColor(issue.type)}`} />
                            ) : (
                              <Info className={`h-5 w-5 shrink-0 ${getIssueColor(issue.type)}`} />
                            )}
                            <div>
                              <p className="font-medium">{issue.message}</p>
                              <p className="text-sm text-muted-foreground">{issue.suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {analysis.passed.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Passed Checks</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.passed.map((item, i) => (
                            <Badge key={i} variant="outline" className="text-green-600">
                              <CircleCheck className="h-3 w-3 mr-1" />
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* SEO Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                  <CardDescription>
                    Edit SEO settings for {selectedPage.pageName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic SEO */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Basic SEO</h3>
                    
                    <div className="space-y-2">
                      <Label>SEO Title</Label>
                      <Input
                        value={selectedPage.seoTitle || ""}
                        onChange={(e) => updateSelectedPage({ seoTitle: e.target.value || null })}
                        placeholder={selectedPage.pageName}
                        disabled={!canEdit}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(selectedPage.seoTitle?.length || 0)}/60 characters
                        {(selectedPage.seoTitle?.length || 0) > 60 && (
                          <span className="text-yellow-600 ml-2">May be truncated</span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Meta Description</Label>
                      <Textarea
                        value={selectedPage.seoDescription || ""}
                        onChange={(e) => updateSelectedPage({ seoDescription: e.target.value || null })}
                        placeholder="Describe this page for search engines..."
                        rows={3}
                        disabled={!canEdit}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(selectedPage.seoDescription?.length || 0)}/160 characters
                        {(selectedPage.seoDescription?.length || 0) > 160 && (
                          <span className="text-yellow-600 ml-2">May be truncated</span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Keywords</Label>
                      <Input
                        value={selectedPage.seoKeywords?.join(", ") || ""}
                        onChange={(e) => updateSelectedPage({ 
                          seoKeywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean)
                        })}
                        placeholder="keyword1, keyword2, keyword3"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Open Graph */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Social Sharing (Open Graph)</h3>
                    
                    <div className="space-y-2">
                      <Label>OG Title</Label>
                      <Input
                        value={selectedPage.ogTitle || ""}
                        onChange={(e) => updateSelectedPage({ ogTitle: e.target.value || null })}
                        placeholder={selectedPage.seoTitle || selectedPage.pageName}
                        disabled={!canEdit}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>OG Description</Label>
                      <Textarea
                        value={selectedPage.ogDescription || ""}
                        onChange={(e) => updateSelectedPage({ ogDescription: e.target.value || null })}
                        placeholder={selectedPage.seoDescription || ""}
                        rows={2}
                        disabled={!canEdit}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>OG Image URL</Label>
                      <Input
                        value={selectedPage.ogImageUrl || ""}
                        onChange={(e) => updateSelectedPage({ ogImageUrl: e.target.value || null })}
                        placeholder="https://..."
                        disabled={!canEdit}
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 1200x630px
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Advanced */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Advanced</h3>
                    
                    <div className="space-y-2">
                      <Label>Canonical URL</Label>
                      <Input
                        value={selectedPage.canonicalUrl || ""}
                        onChange={(e) => updateSelectedPage({ canonicalUrl: e.target.value || null })}
                        placeholder="https://..."
                        disabled={!canEdit}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use if this content exists at another URL
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Indexing</Label>
                        <p className="text-sm text-muted-foreground">
                          Let search engines index this page
                        </p>
                      </div>
                      <Switch
                        checked={selectedPage.robotsIndex}
                        onCheckedChange={(checked) => updateSelectedPage({ robotsIndex: checked })}
                        disabled={!canEdit}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Link Following</Label>
                        <p className="text-sm text-muted-foreground">
                          Let search engines follow links on this page
                        </p>
                      </div>
                      <Switch
                        checked={selectedPage.robotsFollow}
                        onCheckedChange={(checked) => updateSelectedPage({ robotsFollow: checked })}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a page to edit its SEO settings
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
