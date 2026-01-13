import { z } from "zod";
import { nameSchema, emailSchema, phoneSchema } from "./common";

export const createClientSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema.optional(),
  company: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(["active", "inactive", "archived"]),
});

// Input type for the form (before transform/default)
export type CreateClientInput = z.input<typeof createClientSchema>;

// Output type (after validation)
export type CreateClientFormData = z.output<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();

export type UpdateClientFormData = z.infer<typeof updateClientSchema>;
