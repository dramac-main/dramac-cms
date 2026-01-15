"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAgency } from "@/lib/actions/agency";
import type { Database } from "@/types/database";

type Agency = Database["public"]["Tables"]["agencies"]["Row"];

const agencySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  billing_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
});

type AgencyFormData = z.infer<typeof agencySchema>;

interface AgencyFormProps {
  agency: Agency;
}

export function AgencyForm({ agency }: AgencyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<AgencyFormData>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: agency.name || "",
      slug: agency.slug || "",
      billing_email: agency.billing_email || "",
    },
  });

  const onSubmit = async (data: AgencyFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateAgency(agency.id, {
        name: data.name,
        slug: data.slug,
        billing_email: data.billing_email || null,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Agency updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update agency");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Agency Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="My Agency"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Agency Slug</Label>
          <Input
            id="slug"
            {...register("slug")}
            placeholder="my-agency"
          />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Used in URLs: {agency.slug || "my-agency"}.dramac.com
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing_email">Billing Email</Label>
        <Input
          id="billing_email"
          type="email"
          {...register("billing_email")}
          placeholder="billing@myagency.com"
        />
        {errors.billing_email && (
          <p className="text-sm text-destructive">{errors.billing_email.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Invoices and billing notifications will be sent to this email
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
