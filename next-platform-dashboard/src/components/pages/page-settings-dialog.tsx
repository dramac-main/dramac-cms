"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { updatePageAction, setHomepageAction } from "@/lib/actions/pages";
import { updatePageSchema, type UpdatePageFormData } from "@/lib/validations/page";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Page } from "@/types/page";

interface PageSettingsDialogProps {
  page: Page;
  trigger?: React.ReactNode;
}

export function PageSettingsDialog({ page, trigger }: PageSettingsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<UpdatePageFormData>({
    resolver: zodResolver(updatePageSchema),
    defaultValues: {
      name: page.name,
      slug: page.slug,
      seo_title: page.seo_title || "",
      seo_description: page.seo_description || "",
    },
  });

  const onSubmit = async (data: UpdatePageFormData) => {
    setIsPending(true);

    try {
      const result = await updatePageAction(page.id, data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Page settings saved");
        setOpen(false);
        router.refresh();
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const handleSetHomepage = async () => {
    setIsPending(true);

    try {
      const result = await setHomepageAction(page.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Homepage updated");
        setOpen(false);
        router.refresh();
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Page Settings</DialogTitle>
          <DialogDescription>
            Configure settings for &quot;{page.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="general" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={page.is_homepage ?? false} />
                      </FormControl>
                      <FormDescription>
                        {page.is_homepage
                          ? "Homepage slug cannot be changed"
                          : "The URL path for this page"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!page.is_homepage && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Homepage</p>
                        <p className="text-sm text-muted-foreground">
                          Make this the main landing page
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSetHomepage}
                        disabled={isPending}
                      >
                        Set as Homepage
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <FormField
                  control={form.control}
                  name="seo_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={page.name}
                          maxLength={60}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/60 characters
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
                          placeholder="Brief description of the page..."
                          maxLength={160}
                          className="resize-none"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/160 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
