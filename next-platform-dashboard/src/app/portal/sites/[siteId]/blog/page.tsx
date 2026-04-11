"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Loader2,
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Edit,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getPosts,
  getUserPermissions,
  getBlogStats,
  type BlogPost,
} from "@/lib/blog/post-service";
import {
  getPortalSiteSubdomain,
  getPortalSitePublishStatus,
} from "@/lib/portal/portal-media-service";
import { DEFAULT_LOCALE } from "@/lib/locale-config";

const statusColors: Record<string, string> = {
  published:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  draft:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function PortalSiteBlogPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [permissions, setPermissions] = useState<{
    canEditContent: boolean;
    canPublish: boolean;
    isPortalUser: boolean;
  }>({ canEditContent: false, canPublish: false, isPortalUser: true });
  const [stats, setStats] = useState<{
    total: number;
    published: number;
    draft: number;
  }>({ total: 0, published: 0, draft: 0 });
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [sitePublished, setSitePublished] = useState(true);

  useEffect(() => {
    getUserPermissions().then(setPermissions);
    getBlogStats(siteId).then(setStats);
    getPortalSiteSubdomain(siteId).then(setSubdomain);
    getPortalSitePublishStatus(siteId).then(setSitePublished);
  }, [siteId]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const filters = search ? { search } : {};
    const result = await getPosts(siteId, filters, page);
    setPosts(result.posts);
    setTotal(result.total);
    setLoading(false);
  }, [siteId, search, page]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(DEFAULT_LOCALE, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Site not published warning */}
      {!sitePublished && (
        <Alert>
          <AlertDescription>
            Your site is not yet published. Blog posts won&apos;t be publicly
            accessible until the site is published.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Blog Posts
          </h1>
          <p className="text-muted-foreground mt-1">
            {stats.published} published
            {permissions.canEditContent && stats.draft > 0 && (
              <> &middot; {stats.draft} drafts</>
            )}
          </p>
        </div>
        {permissions.canEditContent && (
          <Button asChild>
            <Link href={`/portal/sites/${siteId}/blog/new`}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search ? "No posts match your search" : "No Blog Posts Yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "Try a different search term."
                : permissions.canEditContent
                  ? "Create your first blog post to get started."
                  : "No blog posts have been published for this site yet."}
            </p>
            {!search && permissions.canEditContent && (
              <Button asChild>
                <Link href={`/portal/sites/${siteId}/blog/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {post.featuredImageUrl && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
                      <Image
                        src={post.featuredImageUrl}
                        alt={post.featuredImageAlt || post.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/portal/sites/${siteId}/blog/${post.id}`}
                          className="hover:underline"
                        >
                          <h3 className="font-semibold text-base truncate">
                            {post.title}
                          </h3>
                        </Link>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={
                            statusColors[post.status] || statusColors.draft
                          }
                        >
                          {post.status}
                        </Badge>
                        {post.status === "published" &&
                          subdomain &&
                          sitePublished && (
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={`/blog/${subdomain}/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View published post"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        {permissions.canEditContent && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/portal/sites/${siteId}/blog/${post.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {post.authorName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.authorName}
                        </span>
                      )}
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.publishedAt)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readingTimeMinutes} min read
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
