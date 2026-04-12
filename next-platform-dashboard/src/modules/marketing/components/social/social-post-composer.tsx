/**
 * Social Post Composer
 *
 * Phase MKT-12: Social Media Integration
 *
 * Client component for creating and scheduling social media posts.
 * Features multi-platform posting, character counting, scheduling,
 * and UTM parameter auto-appending.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Send,
  Calendar,
  Link2,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createSocialPost } from "@/modules/marketing/actions/social-actions";
import {
  SOCIAL_PLATFORM_LIMITS,
  type SocialPlatform,
  type SocialConnection,
} from "@/modules/marketing/types/social-types";

interface SocialPostComposerProps {
  siteId: string;
  connections: SocialConnection[];
}

const ALL_PLATFORMS: SocialPlatform[] = [
  "facebook",
  "twitter",
  "instagram",
  "linkedin",
];

export function SocialPostComposer({
  siteId,
  connections,
}: SocialPostComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(
    [],
  );
  const [linkUrl, setLinkUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [addUtm, setAddUtm] = useState(true);

  const connectedPlatforms = new Set(
    connections.filter((c) => c.status === "active").map((c) => c.platform),
  );

  function togglePlatform(platform: SocialPlatform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  }

  function getCharacterStatus(platform: SocialPlatform) {
    const limit = SOCIAL_PLATFORM_LIMITS[platform].maxLength;
    const remaining = limit - content.length;
    const isOver = remaining < 0;
    return { limit, remaining, isOver };
  }

  async function handleSubmit() {
    if (!content.trim()) {
      toast.error("Post content is required");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }

    // Validate character limits
    for (const platform of selectedPlatforms) {
      const { isOver } = getCharacterStatus(platform);
      if (isOver) {
        toast.error(
          `Content exceeds ${SOCIAL_PLATFORM_LIMITS[platform].label} character limit`,
        );
        return;
      }
    }

    startTransition(async () => {
      try {
        await createSocialPost({
          siteId,
          content: content.trim(),
          platforms: selectedPlatforms,
          linkUrl: linkUrl.trim() || undefined,
          scheduledAt: scheduledAt || undefined,
          utmParams: addUtm && linkUrl
            ? {
                utm_source: selectedPlatforms[0],
                utm_medium: "social",
                utm_campaign: "social-post",
              }
            : undefined,
        });

        toast.success(
          scheduledAt ? "Post scheduled successfully" : "Post created as draft",
        );
        router.push(`/dashboard/sites/${siteId}/marketing/social`);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to create post");
      }
    });
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Create Social Post</h1>
        <p className="text-muted-foreground">
          Compose a post for one or more social platforms
        </p>
      </div>

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platforms</CardTitle>
          <CardDescription>
            Select which platforms to post to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ALL_PLATFORMS.map((platform) => {
              const config = SOCIAL_PLATFORM_LIMITS[platform];
              const isConnected = connectedPlatforms.has(platform);
              const isSelected = selectedPlatforms.includes(platform);

              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => isConnected && togglePlatform(platform)}
                  disabled={!isConnected}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : isConnected
                        ? "border-border hover:border-primary/50"
                        : "border-border opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span className="font-medium">{config.label}</span>
                  {!isConnected && (
                    <Badge variant="outline" className="text-xs">
                      Not connected
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="What would you like to share?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="resize-none"
            />

            {/* Character counts per platform */}
            {selectedPlatforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPlatforms.map((platform) => {
                  const { remaining, isOver } = getCharacterStatus(platform);
                  return (
                    <Badge
                      key={platform}
                      variant={isOver ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {SOCIAL_PLATFORM_LIMITS[platform].label}: {remaining}{" "}
                      chars left
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label htmlFor="link-url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Link URL (optional)
            </Label>
            <Input
              id="link-url"
              type="url"
              placeholder="https://example.com/blog/my-post"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            {linkUrl && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="utm"
                  checked={addUtm}
                  onCheckedChange={(checked) => setAddUtm(checked === true)}
                />
                <Label htmlFor="utm" className="text-sm text-muted-foreground">
                  Auto-append UTM tracking parameters
                </Label>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <Label htmlFor="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule (optional)
            </Label>
            <Input
              id="schedule"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to save as draft
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : scheduledAt ? (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Post
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Save as Draft
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
