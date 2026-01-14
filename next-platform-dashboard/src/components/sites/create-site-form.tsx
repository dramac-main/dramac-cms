"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createSiteAction, checkSubdomain } from "@/lib/actions/sites";
import { createSiteSchema, type CreateSiteFormData } from "@/lib/validations/site";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import type { Client } from "@/types/client";

interface CreateSiteFormProps {
  clients: Client[];
  defaultClientId?: string;
}

export function CreateSiteForm({ clients, defaultClientId }: CreateSiteFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const form = useForm<CreateSiteFormData>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      client_id: defaultClientId || "",
      description: "",
    },
  });

  // Auto-generate subdomain from name
  const watchName = form.watch("name");
  useEffect(() => {
    if (watchName && !form.getValues("subdomain")) {
      const subdomain = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30);
      form.setValue("subdomain", subdomain);
    }
  }, [watchName, form]);

  // Check subdomain availability
  const checkSubdomainAvailability = useDebouncedCallback(async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus("idle");
      return;
    }

    setSubdomainStatus("checking");
    try {
      const { available } = await checkSubdomain(subdomain);
      setSubdomainStatus(available ? "available" : "taken");
    } catch {
      setSubdomainStatus("idle");
    }
  }, 500);

  const watchSubdomain = form.watch("subdomain");
  useEffect(() => {
    checkSubdomainAvailability(watchSubdomain);
  }, [watchSubdomain, checkSubdomainAvailability]);

  const onSubmit = async (data: CreateSiteFormData) => {
    if (subdomainStatus === "taken") {
      toast.error("Please choose a different subdomain");
      return;
    }

    setIsPending(true);

    try {
      const result = await createSiteAction(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Site created successfully");
        router.push(`/dashboard/sites/${result.data?.id}`);
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Details</CardTitle>
            <CardDescription>Basic information about the website.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                          {client.company && ` (${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Website" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdomain *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="my-awesome-site"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                            field.onChange(value);
                          }}
                        />
                        {subdomainStatus !== "idle" && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {subdomainStatus === "checking" && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {subdomainStatus === "available" && (
                              <Check className="h-4 w-4 text-success" />
                            )}
                            {subdomainStatus === "taken" && (
                              <X className="h-4 w-4 text-danger" />
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">.dramac.app</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {subdomainStatus === "available" && (
                      <span className="text-success">This subdomain is available!</span>
                    )}
                    {subdomainStatus === "taken" && (
                      <span className="text-danger">This subdomain is already taken.</span>
                    )}
                    {subdomainStatus === "idle" && "Only lowercase letters, numbers, and hyphens."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the website..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {clients.length === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-warning/10 p-4 text-warning">
            <AlertCircle className="h-5 w-5" />
            <span>You need to create a client before creating a site.</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || clients.length === 0 || subdomainStatus === "taken"}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Site
          </Button>
        </div>
      </form>
    </Form>
  );
}
