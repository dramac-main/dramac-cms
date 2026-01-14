import { z } from "zod";
import { subdomainSchema, domainSchema } from "./common";

export const createSiteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  subdomain: subdomainSchema,
  client_id: z.string().uuid("Invalid client ID"),
  template_id: z.string().optional(),
  description: z.string().max(500).optional(),
});

export type CreateSiteFormData = z.infer<typeof createSiteSchema>;

export const updateSiteSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  subdomain: subdomainSchema.optional(),
  custom_domain: domainSchema.optional().nullable(),
  published: z.boolean().optional(),
  seo_title: z.string().max(60).optional().nullable(),
  seo_description: z.string().max(160).optional().nullable(),
  seo_image: z.string().url().optional().or(z.literal("")).nullable(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateSiteFormData = z.infer<typeof updateSiteSchema>;
