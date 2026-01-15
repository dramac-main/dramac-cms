"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, PenTool, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { createSiteAction, checkSubdomain } from "@/lib/actions/sites";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import type { Client } from "@/types/client";

const createSiteFormSchema = z.object({
  name: z.string().min(1, "Site name is required").max(100),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(30, "Subdomain must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  client_id: z.string().min(1, "Please select a client"),
  description: z.string().optional(),
  buildMode: z.enum(["ai", "manual"]),
});

type FormData = z.infer<typeof createSiteFormSchema>;

interface CreateSiteFormProps {
  clients: Client[];
  defaultClientId?: string;
}

export function CreateSiteForm({ clients, defaultClientId }: CreateSiteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  
  const form = useForm<FormData>({
    resolver: zodResolver(createSiteFormSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      client_id: defaultClientId || "",
      description: "",
      buildMode: "ai",
    },
  });

  const watchName = form.watch("name");
  const watchSubdomain = form.watch("subdomain");
  const debouncedSubdomain = useDebounce(watchSubdomain, 500);

  // Auto-generate subdomain from name
  useEffect(() => {
    if (watchName && !form.getValues("subdomain")) {
      const generated = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30);
      form.setValue("subdomain", generated, { shouldValidate: true });
    }
  }, [watchName, form]);

  // Check subdomain availability
  useEffect(() => {
    if (debouncedSubdomain && debouncedSubdomain.length >= 3) {
      setSubdomainStatus("checking");
      checkSubdomain(debouncedSubdomain)
        .then((result) => {
          setSubdomainStatus(result.available ? "available" : "taken");
        })
        .catch(() => {
          setSubdomainStatus("idle");
        });
    } else {
      setSubdomainStatus("idle");
    }
  }, [debouncedSubdomain]);

  const onSubmit = (data: FormData) => {
    if (subdomainStatus === "taken") {
      toast.error("Please choose a different subdomain");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createSiteAction({
          name: data.name,
          subdomain: data.subdomain,
          client_id: data.client_id,
          description: data.description,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Site created successfully!");
        
        // Navigate based on build mode
        if (data.buildMode === "ai") {
          router.push(`/dashboard/sites/${result.data?.id}/builder`);
        } else {
          router.push(`/editor/${result.data?.id}`);
        }
      } catch (error) {
        toast.error("Failed to create site. Please try again.");
      }
    });
  };

  const getSubdomainIcon = () => {
    switch (subdomainStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "available":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "taken":
        return <XCircle className="h-4 w-4 text-danger" />;
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Details</CardTitle>
            <CardDescription>Basic information about your new site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
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
                  <FormLabel>Site Name</FormLabel>
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
                  <FormLabel>Subdomain</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="my-site"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                            field.onChange(value);
                          }}
                          className="pr-10"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {getSubdomainIcon()}
                        </div>
                      </div>
                      <span className="text-muted-foreground">.dramac.app</span>
                    </div>
                  </FormControl>
                  {subdomainStatus === "taken" && (
                    <p className="text-sm text-danger">This subdomain is already taken</p>
                  )}
                  {subdomainStatus === "available" && (
                    <p className="text-sm text-success">This subdomain is available!</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the site" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How do you want to build?</CardTitle>
            <CardDescription>Choose your preferred starting method</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="buildMode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid gap-4 md:grid-cols-2"
                    >
                      <div>
                        <RadioGroupItem
                          value="ai"
                          id="ai"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="ai"
                          className="flex flex-col items-start gap-3 rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">Generate with AI</p>
                              <p className="text-sm text-muted-foreground">
                                Describe your business and let AI build it
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="manual"
                          id="manual"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="manual"
                          className="flex flex-col items-start gap-3 rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <PenTool className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">Start from Scratch</p>
                              <p className="text-sm text-muted-foreground">
                                Build manually with the visual editor
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
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

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/sites")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || subdomainStatus === "taken" || clients.length === 0}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Site
          </Button>
        </div>
      </form>
    </Form>
  );
}
