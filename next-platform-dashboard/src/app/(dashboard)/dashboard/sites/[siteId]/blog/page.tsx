"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Plus, FileText, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PostList } from "@/components/blog/post-list";
import { getPosts, getBlogStats, getUserPermissions, type BlogPost } from "@/lib/blog/post-service";
import { getCategories, type BlogCategory } from "@/lib/blog/category-service";

export default function BlogPostsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, scheduled: 0, archived: 0 });
  const [permissions, setPermissions] = useState({ canPublish: true, canDelete: true, canManageCategories: true, isPortalUser: false });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Load initial data (categories, stats, permissions)
  useEffect(() => {
    let cancelled = false;
    
    const fetchInitialData = async () => {
      const [categoriesData, statsData, perms] = await Promise.all([
        getCategories(siteId),
        getBlogStats(siteId),
        getUserPermissions(),
      ]);
      
      if (!cancelled) {
        setCategories(categoriesData);
        setStats(statsData);
        setPermissions(perms);
      }
    };
    
    fetchInitialData();
    return () => { cancelled = true; };
  }, [siteId]);

  // Load posts when filters change
  useEffect(() => {
    let cancelled = false;
    
    const fetchPosts = async () => {
      setLoading(true);
      
      const postsResult = await getPosts(siteId, {
        status: statusFilter === "all" ? undefined : statusFilter,
        categoryId: categoryFilter === "all" ? undefined : categoryFilter,
        search: search || undefined,
      }, page);
      
      if (!cancelled) {
        setPosts(postsResult.posts);
        setTotal(postsResult.total);
        setLoading(false);
      }
    };
    
    fetchPosts();
    return () => { cancelled = true; };
  }, [siteId, statusFilter, categoryFilter, search, page]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleRefresh = () => {
    // Force re-fetch by resetting state that triggers useEffect
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Blog Posts
          </h1>
          <p className="text-muted-foreground mt-1">{total} total posts</p>
        </div>
        <div className="flex gap-2">
          {permissions.canManageCategories && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/sites/${siteId}/blog/categories`}>Categories</Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`/dashboard/sites/${siteId}/blog/new`}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            <p className="text-sm text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            <p className="text-sm text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.scheduled}</p>
            <p className="text-sm text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleSearch} className="sm:hidden">
          Search
        </Button>
      </div>

      {/* Posts List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <PostList 
              posts={posts} 
              siteId={siteId} 
              onRefresh={handleRefresh}
              canEdit={true}
              canDelete={permissions.canDelete}
              canPublish={permissions.canPublish}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
