"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Save, Eye, Send, ArrowLeft, ImageIcon, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PostEditor } from "./post-editor";
import { PostSeoPanel } from "./post-seo-panel";
import { createPost, updatePost, type BlogPost } from "@/lib/blog/post-service";
import { getCategories, type BlogCategory } from "@/lib/blog/category-service";
import { toast } from "sonner";

const postFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  slug: z.string().optional(),
  excerpt: z.string().max(500, "Excerpt is too long").optional(),
  featuredImageUrl: z.string().url().optional().or(z.literal("")),
  featuredImageAlt: z.string().max(200).optional(),
  metaTitle: z.string().max(70, "Meta title should be under 70 characters").optional(),
  metaDescription: z.string().max(160, "Meta description should be under 160 characters").optional(),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  allowComments: z.boolean(),
  isFeatured: z.boolean(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

interface PostFormProps {
  siteId: string;
  post?: BlogPost;
  canPublish?: boolean;
}

export function PostForm({ siteId, post, canPublish = true }: PostFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    post?.categories.map(c => c.id) || []
  );
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState<Record<string, unknown>>(post?.content || {});
  const [contentHtml, setContentHtml] = useState(post?.contentHtml || "");

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      excerpt: post?.excerpt || "",
      featuredImageUrl: post?.featuredImageUrl || "",
      featuredImageAlt: post?.featuredImageAlt || "",
      metaTitle: post?.metaTitle || "",
      metaDescription: post?.metaDescription || "",
      ogImageUrl: post?.ogImageUrl || "",
      canonicalUrl: post?.canonicalUrl || "",
      allowComments: post?.allowComments ?? true,
      isFeatured: post?.isFeatured ?? false,
    },
  });

  const loadCategories = useCallback(async () => {
    const cats = await getCategories(siteId);
    setCategories(cats);
  }, [siteId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleContentChange = (newContent: Record<string, unknown>, html: string) => {
    setContent(newContent);
    setContentHtml(html);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (value: string) => {
    form.setValue("title", value);
    // Auto-generate slug if not editing existing post or slug is empty
    if (!post || !form.getValues("slug")) {
      form.setValue("slug", generateSlug(value));
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const onSubmit = async (values: PostFormValues, status: "draft" | "published" = "draft") => {
    if (status === "published") {
      setPublishing(true);
    } else {
      setSaving(true);
    }

    try {
      const postData = {
        title: values.title,
        slug: values.slug || generateSlug(values.title),
        excerpt: values.excerpt,
        content,
        contentHtml,
        featuredImageUrl: values.featuredImageUrl || undefined,
        featuredImageAlt: values.featuredImageAlt,
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
        ogImageUrl: values.ogImageUrl || undefined,
        canonicalUrl: values.canonicalUrl || undefined,
        tags,
        categoryIds: selectedCategories,
        status,
        allowComments: values.allowComments,
        isFeatured: values.isFeatured,
      };

      let result: { success: boolean; postId?: string; error?: string };
      if (post) {
        result = await updatePost(post.id, postData);
      } else {
        result = await createPost(siteId, postData);
      }

      if (result.success) {
        toast.success(
          status === "published" 
            ? "Post published successfully!" 
            : post 
              ? "Post saved!" 
              : "Draft created!"
        );
        
        if (!post && result.postId) {
          router.push(`/sites/${siteId}/blog/${result.postId}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error || "Failed to save post");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    form.handleSubmit((values) => onSubmit(values, "draft"))();
  };

  const handlePublish = () => {
    form.handleSubmit((values) => onSubmit(values, "published"))();
  };

  const currentStatus = post?.status || "draft";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values, "draft"))}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/sites/${siteId}/blog`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Posts
            </Button>
            
            <div className="flex items-center gap-2">
              {currentStatus !== "draft" && (
                <Badge variant="secondary" className="mr-2">
                  {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                </Badge>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving || publishing}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              
              {canPublish && (
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving || publishing}
                >
                  {publishing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : currentStatus === "published" ? (
                    <Eye className="h-4 w-4 mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {currentStatus === "published" ? "Update" : "Publish"}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <Card>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Post title..."
                            className="text-2xl font-bold border-0 px-0 focus-visible:ring-0"
                            onChange={(e) => handleTitleChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormControl>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span className="mr-1">Slug:</span>
                            <Input
                              {...field}
                              placeholder="post-slug"
                              className="h-6 border-0 px-1 py-0 focus-visible:ring-0 text-sm"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Editor */}
              <Card>
                <CardContent className="pt-6">
                  <PostEditor
                    content={content}
                    onChange={handleContentChange}
                    placeholder="Write your post content..."
                  />
                </CardContent>
              </Card>

              {/* Excerpt */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Excerpt</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="A brief summary of your post..."
                            className="resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Tabs defaultValue="settings">
                <TabsList className="w-full">
                  <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                  <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
                </TabsList>
                
                <TabsContent value="settings" className="mt-4 space-y-6">
                  {/* Featured Image */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Featured Image</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="featuredImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="space-y-2">
                                {field.value ? (
                                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                    <Image
                                      src={field.value}
                                      alt="Featured image"
                                      fill
                                      className="object-cover"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-2 right-2 h-6 w-6"
                                      onClick={() => field.onChange("")}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                      Enter image URL below
                                    </p>
                                  </div>
                                )}
                                <Input
                                  {...field}
                                  placeholder="https://example.com/image.jpg"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="featuredImageAlt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alt Text</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Image description..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No categories yet. Create some in the categories page.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {categories.map((cat) => (
                            <label
                              key={cat.id}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat.id)}
                                onChange={() => toggleCategory(cat.id)}
                                className="rounded border-gray-300"
                              />
                              <Badge
                                variant="secondary"
                                style={{
                                  backgroundColor: `${cat.color}20`,
                                  color: cat.color,
                                }}
                              >
                                {cat.name}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tags */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add a tag..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button type="button" variant="secondary" onClick={addTag}>
                          Add
                        </Button>
                      </div>
                      
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeTag(tag)}
                            >
                              {tag}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isFeatured"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Featured Post</FormLabel>
                              <FormDescription className="text-xs">
                                Show in featured section
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <Separator />
                      
                      <FormField
                        control={form.control}
                        name="allowComments"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Allow Comments</FormLabel>
                              <FormDescription className="text-xs">
                                Enable comments on this post
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="seo" className="mt-4">
                  <PostSeoPanel form={form} title={form.watch("title")} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
