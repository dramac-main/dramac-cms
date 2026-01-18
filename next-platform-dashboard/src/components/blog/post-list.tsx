"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Star,
  StarOff,
  Clock,
  Calendar,
  User,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updatePost, deletePost, type BlogPost } from "@/lib/blog/post-service";
import { toast } from "sonner";
import { useState } from "react";

interface PostListProps {
  posts: BlogPost[];
  siteId: string;
  onRefresh: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canPublish?: boolean;
}

const statusConfig = {
  draft: { 
    label: "Draft", 
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" 
  },
  scheduled: { 
    label: "Scheduled", 
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" 
  },
  published: { 
    label: "Published", 
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
  },
  archived: { 
    label: "Archived", 
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
  },
};

export function PostList({ 
  posts, 
  siteId, 
  onRefresh,
  canEdit = true,
  canDelete = true,
  canPublish = true,
}: PostListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleFeatured = async (postId: string, currentValue: boolean) => {
    const result = await updatePost(postId, { isFeatured: !currentValue });
    if (result.success) {
      toast.success(currentValue ? "Removed from featured" : "Added to featured");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  const handleDelete = async (postId: string) => {
    setDeletingId(postId);
    const result = await deletePost(postId);
    setDeletingId(null);
    
    if (result.success) {
      toast.success("Post deleted successfully");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to delete post");
    }
  };

  const handlePublish = async (postId: string) => {
    const result = await updatePost(postId, { status: "published" });
    if (result.success) {
      toast.success("Post published successfully");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to publish");
    }
  };

  const handleUnpublish = async (postId: string) => {
    const result = await updatePost(postId, { status: "draft" });
    if (result.success) {
      toast.success("Post unpublished");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to unpublish");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground mb-4">No posts found</p>
        <Button asChild>
          <Link href={`/sites/${siteId}/blog/new`}>Create your first post</Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="hidden md:table-cell">Author</TableHead>
          <TableHead className="hidden lg:table-cell">Categories</TableHead>
          <TableHead className="w-28">Status</TableHead>
          <TableHead className="w-32 hidden sm:table-cell">Date</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.id}>
            {/* Thumbnail */}
            <TableCell>
              {post.featuredImageUrl ? (
                <div className="w-10 h-10 relative rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={post.featuredImageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs flex-shrink-0">
                  No img
                </div>
              )}
            </TableCell>
            
            {/* Title & Excerpt */}
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/sites/${siteId}/blog/${post.id}`}
                    className="font-medium hover:text-primary transition-colors line-clamp-1"
                  >
                    {post.title}
                  </Link>
                  {post.isFeatured && (
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                </div>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </TableCell>
            
            {/* Author */}
            <TableCell className="hidden md:table-cell">
              <div className="flex items-center gap-2">
                {post.authorAvatarUrl ? (
                  <Image
                    src={post.authorAvatarUrl}
                    alt={post.authorName || ""}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                  {post.authorName}
                </span>
              </div>
            </TableCell>
            
            {/* Categories */}
            <TableCell className="hidden lg:table-cell">
              <div className="flex flex-wrap gap-1">
                {post.categories.slice(0, 2).map((cat) => (
                  <Badge
                    key={cat.id}
                    variant="secondary"
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${cat.color}20`, 
                      color: cat.color,
                      borderColor: `${cat.color}40`,
                    }}
                  >
                    {cat.name}
                  </Badge>
                ))}
                {post.categories.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{post.categories.length - 2}
                  </Badge>
                )}
                {post.categories.length === 0 && (
                  <span className="text-xs text-muted-foreground">No categories</span>
                )}
              </div>
            </TableCell>
            
            {/* Status */}
            <TableCell>
              <Badge
                variant="secondary"
                className={statusConfig[post.status].className}
              >
                {post.status === "scheduled" && <Clock className="h-3 w-3 mr-1" />}
                {statusConfig[post.status].label}
              </Badge>
            </TableCell>
            
            {/* Date */}
            <TableCell className="hidden sm:table-cell">
              <div className="text-sm text-muted-foreground">
                {post.status === "published" ? (
                  formatDate(post.publishedAt)
                ) : post.status === "scheduled" ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.scheduledFor)}
                  </span>
                ) : (
                  formatDate(post.updatedAt)
                )}
              </div>
            </TableCell>
            
            {/* Actions */}
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem asChild>
                      <Link href={`/sites/${siteId}/blog/${post.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {post.status === "published" && (
                    <DropdownMenuItem asChild>
                      <a 
                        href={`/sites/${siteId}/preview/blog/${post.slug}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </DropdownMenuItem>
                  )}
                  
                  {canPublish && (
                    <>
                      <DropdownMenuSeparator />
                      {post.status !== "published" && (
                        <DropdownMenuItem onClick={() => handlePublish(post.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      {post.status === "published" && (
                        <DropdownMenuItem onClick={() => handleUnpublish(post.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Unpublish
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  
                  {canEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleFeatured(post.id, post.isFeatured)}
                      >
                        {post.isFeatured ? (
                          <>
                            <StarOff className="h-4 w-4 mr-2" />
                            Remove Featured
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Make Featured
                          </>
                        )}
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{post.title}&quot;? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(post.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deletingId === post.id}
                            >
                              {deletingId === post.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
