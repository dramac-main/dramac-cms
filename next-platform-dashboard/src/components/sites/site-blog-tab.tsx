"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  FolderOpen,
  Plus,
  ArrowRight,
  PenSquare,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

interface SiteBlogTabProps {
  siteId: string;
}

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalCategories: number;
}

interface RecentPost {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
  created_at: string;
}

export function SiteBlogTab({ siteId }: SiteBlogTabProps) {
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlogData = useCallback(async () => {
    const supabase = createClient();

    try {
      // Get post counts
      const [postsResult, publishedResult, draftsResult, categoriesResult] = await Promise.all([
        supabase.from("blog_posts")
          .select("id", { count: "exact", head: true })
          .eq("site_id", siteId),
        supabase.from("blog_posts")
          .select("id", { count: "exact", head: true })
          .eq("site_id", siteId)
          .eq("status", "published"),
        supabase.from("blog_posts")
          .select("id", { count: "exact", head: true })
          .eq("site_id", siteId)
          .eq("status", "draft"),
        supabase.from("blog_categories")
          .select("id", { count: "exact", head: true })
          .eq("site_id", siteId),
      ]);

      setStats({
        totalPosts: postsResult.count || 0,
        publishedPosts: publishedResult.count || 0,
        draftPosts: draftsResult.count || 0,
        totalCategories: categoriesResult.count || 0,
      });

      // Get recent posts
      const { data: posts } = await supabase.from("blog_posts")
        .select("id, title, status, published_at, created_at")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentPosts(posts || []);
    } catch (error) {
      console.error("Error loading blog data:", error);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadBlogData();
  }, [loadBlogData]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    published: "bg-green-100 text-green-800",
    draft: "bg-yellow-100 text-yellow-800",
    scheduled: "bg-blue-100 text-blue-800",
    archived: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Recent Posts */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest blog posts</CardDescription>
          </div>
          <Link href={`/sites/${siteId}/blog/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No blog posts yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first blog post to get started
              </p>
              <Link href={`/sites/${siteId}/blog/new`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/sites/${siteId}/blog/${post.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PenSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {post.published_at
                          ? format(new Date(post.published_at), "MMM d, yyyy")
                          : format(new Date(post.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColors[post.status] || statusColors.draft}>
                    {post.status}
                  </Badge>
                </Link>
              ))}
              
              <Link href={`/sites/${siteId}/blog`}>
                <Button variant="ghost" className="w-full">
                  View All Posts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats?.publishedPosts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <PenSquare className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{stats?.draftPosts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <FolderOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{stats?.totalCategories || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href={`/sites/${siteId}/blog/categories`}>
          <Button variant="outline" className="w-full">
            Manage Categories
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
