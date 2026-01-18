"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PostSeoPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  title?: string;
}

export function PostSeoPanel({ form, title }: PostSeoPanelProps) {
  const metaTitle = form.watch("metaTitle") || title || "";
  const metaDescription = form.watch("metaDescription") || "";
  const slug = form.watch("slug") || "";

  // Calculate score based on filled fields
  const calculateSeoScore = () => {
    let score = 0;
    if (metaTitle.length > 0 && metaTitle.length <= 60) score += 25;
    else if (metaTitle.length > 60) score += 15;
    if (metaDescription.length > 0 && metaDescription.length <= 160) score += 25;
    else if (metaDescription.length > 160) score += 15;
    if (slug.length > 0) score += 25;
    if (form.watch("featuredImageUrl")) score += 25;
    return score;
  };

  const seoScore = calculateSeoScore();

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return "bg-green-600";
    if (score >= 50) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <div className="space-y-6">
      {/* SEO Score */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">SEO Score</CardTitle>
            <span className={cn("text-2xl font-bold", getScoreColor(seoScore))}>
              {seoScore}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={seoScore} 
            className={cn("h-2", "[&>div]:" + getProgressColor(seoScore))}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {seoScore >= 75 
              ? "Great! Your SEO settings are optimized."
              : seoScore >= 50
                ? "Good start. Fill in more fields to improve."
                : "Add meta title, description, and image to improve."}
          </p>
        </CardContent>
      </Card>

      {/* Meta Title */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Meta Title</CardTitle>
          <CardDescription>
            The title that appears in search engine results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="metaTitle"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder={title || "Enter meta title..."}
                  />
                </FormControl>
                <FormDescription>
                  <span className={cn(
                    metaTitle.length > 60 ? "text-yellow-600" : "",
                    metaTitle.length > 70 ? "text-red-600" : ""
                  )}>
                    {metaTitle.length}/60 characters
                  </span>
                  {metaTitle.length > 60 && (
                    <span className="ml-2 text-yellow-600">
                      (May be truncated in search results)
                    </span>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Meta Description */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Meta Description</CardTitle>
          <CardDescription>
            A brief description shown in search results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="metaDescription"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Enter a compelling description..."
                    rows={3}
                    className="resize-none"
                  />
                </FormControl>
                <FormDescription>
                  <span className={cn(
                    metaDescription.length > 155 ? "text-yellow-600" : "",
                    metaDescription.length > 160 ? "text-red-600" : ""
                  )}>
                    {metaDescription.length}/160 characters
                  </span>
                  {metaDescription.length > 155 && (
                    <span className="ml-2 text-yellow-600">
                      (May be truncated)
                    </span>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Search Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Search Preview</CardTitle>
          <CardDescription>
            How your post may appear in Google search results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
            <div className="text-sm text-green-700 dark:text-green-400 truncate">
              example.com › blog › {slug || "post-slug"}
            </div>
            <div className="text-lg text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate mt-1">
              {metaTitle || title || "Post Title"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {metaDescription || "Add a meta description to see how it will appear in search results..."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Graph Image */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Social Image</CardTitle>
          <CardDescription>
            Image shown when sharing on social media
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="ogImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Open Graph Image URL</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="https://example.com/og-image.jpg"
                  />
                </FormControl>
                <FormDescription>
                  Recommended: 1200x630 pixels. Leave empty to use featured image.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Canonical URL */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Canonical URL</CardTitle>
          <CardDescription>
            Use if this content exists elsewhere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="canonicalUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="https://example.com/original-post"
                  />
                </FormControl>
                <FormDescription>
                  Leave empty to use the default URL for this post.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
