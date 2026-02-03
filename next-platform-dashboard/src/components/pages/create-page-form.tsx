"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPageAction } from "@/lib/actions/pages";
import {
  createPageSchema,
  type CreatePageFormData,
} from "@/lib/validations/page";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface CreatePageFormProps {
  siteId: string;
  isFirstPage?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreatePageForm({ siteId, isFirstPage }: CreatePageFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CreatePageFormData>({
    resolver: zodResolver(createPageSchema),
    defaultValues: {
      name: isFirstPage ? "Home" : "",
      slug: isFirstPage ? "home" : "",
      is_homepage: isFirstPage || false,
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!form.getFieldState("slug").isDirty || !form.getValues("slug")) {
      form.setValue("slug", slugify(value));
    }
  };

  const onSubmit = async (data: CreatePageFormData) => {
    setIsPending(true);

    try {
      const result = await createPageAction(siteId, data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Page created successfully");
        router.push(`/studio/${siteId}/${result.data?.id}`);
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>
          {isFirstPage ? "Create Homepage" : "Create New Page"}
        </CardTitle>
        <CardDescription>
          {isFirstPage
            ? "Set up the main landing page for your site."
            : "Add a new page to your site."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Page Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="About Us"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
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
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="about-us" {...field} />
                  </FormControl>
                  <FormDescription>
                    The URL path for this page (e.g., /about-us)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isFirstPage && (
              <FormField
                control={form.control}
                name="is_homepage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as Homepage</FormLabel>
                      <FormDescription>
                        Make this the main page visitors see first
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Page
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
