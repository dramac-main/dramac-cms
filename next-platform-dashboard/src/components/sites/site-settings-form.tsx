"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSiteAction } from "@/lib/actions/sites";
import { updateSiteSchema, type UpdateSiteFormData } from "@/lib/validations/site";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input, Button } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import type { Site } from "@/types/site";

interface SiteSettingsFormProps {
  site: Site;
  section: "general" | "domains" | "seo";
}

export function SiteSettingsForm({ site, section }: SiteSettingsFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<UpdateSiteFormData>({
    resolver: zodResolver(updateSiteSchema),
    defaultValues: {
      name: site.name,
      subdomain: site.subdomain,
      custom_domain: site.custom_domain || "",
      seo_title: site.seo_title || "",
      seo_description: site.seo_description || "",
      seo_image: site.seo_image || "",
    },
  });

  const onSubmit = async (data: UpdateSiteFormData) => {
    setIsPending(true);

    try {
      const result = await updateSiteAction(site.id, data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Settings saved successfully");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  if (section === "general") {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic site information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  if (section === "domains") {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain Settings</CardTitle>
              <CardDescription>Configure your site's URLs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subdomain</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input {...field} />
                        <span className="text-sm text-muted-foreground">.dramac.app</span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your free subdomain on dramac.app
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="custom_domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Point your domain&apos;s DNS to our servers to use a custom domain.
                      Configuration instructions will appear after saving.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  if (section === "seo") {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your site for search engines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="seo_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="My Awesome Website" 
                        maxLength={60} 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {(field.value?.length || 0)}/60 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seo_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of your website..."
                        maxLength={160}
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {(field.value?.length || 0)}/160 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seo_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Image (OG Image)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/og-image.jpg" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Image shown when sharing on social media (recommended: 1200x630px)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return null;
}
