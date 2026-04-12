/**
 * Social Posts List
 *
 * Phase MKT-12: Social Media Integration
 *
 * Client component showing list of social posts with status,
 * platform badges, scheduling info, and actions.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Trash2,
  Send,
  Eye,
  Loader2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteSocialPost,
  updateSocialPost,
} from "@/modules/marketing/actions/social-actions";
import {
  SOCIAL_PLATFORM_LIMITS,
  type SocialPost,
  type SocialPostStatus,
} from "@/modules/marketing/types/social-types";

interface SocialPostsListProps {
  siteId: string;
  posts: SocialPost[];
  total: number;
}

const STATUS_COLORS: Record<SocialPostStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  published:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function SocialPostsList({
  siteId,
  posts,
  total,
}: SocialPostsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const basePath = `/dashboard/sites/${siteId}/marketing/social`;

  async function handleDelete(postId: string) {
    startTransition(async () => {
      try {
        await deleteSocialPost(postId, siteId);
        toast.success("Post deleted");
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Posts</h1>
          <p className="text-sm text-muted-foreground">
            {total} total post{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href={`${basePath}/new`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Share2 className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No social posts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first post to share across social platforms
            </p>
            <Link href={`${basePath}/new`}>
              <Button className="mt-4" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Content preview */}
                  <p className="text-sm line-clamp-2">
                    {post.content || "No content"}
                  </p>

                  {/* Platform badges + status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.platforms?.map((platform) => (
                      <Badge
                        key={platform}
                        variant="outline"
                        className="text-xs"
                      >
                        {SOCIAL_PLATFORM_LIMITS[platform]?.label || platform}
                      </Badge>
                    ))}
                    <Badge className={`text-xs ${STATUS_COLORS[post.status]}`}>
                      {post.status}
                    </Badge>
                  </div>

                  {/* Schedule / Published info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {post.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                      </span>
                    )}
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        Published: {new Date(post.publishedAt).toLocaleString()}
                      </span>
                    )}
                    {post.linkUrl && (
                      <span className="truncate max-w-[200px]">
                        🔗 {post.linkUrl}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending} aria-label="Post actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {post.status === "draft" && (
                      <DropdownMenuItem
                        onClick={() =>
                          startTransition(async () => {
                            try {
                              await updateSocialPost(post.id, siteId, {
                                status: "scheduled",
                                scheduledAt: new Date().toISOString(),
                              });
                              toast.success("Post scheduled");
                              router.refresh();
                            } catch {
                              toast.error("Failed to schedule");
                            }
                          })
                        }
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Now
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
