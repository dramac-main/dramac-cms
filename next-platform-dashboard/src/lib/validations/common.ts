import { z } from "zod";

// Email validation
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Simple password for login (don't reveal requirements)
export const loginPasswordSchema = z
  .string()
  .min(1, "Password is required");

// Name validation
export const nameSchema = z
  .string()
  .min(2, "Must be at least 2 characters")
  .max(50, "Must be less than 50 characters");

// URL validation
export const urlSchema = z
  .string()
  .url("Must be a valid URL")
  .or(z.literal(""));

// Subdomain validation
export const subdomainSchema = z
  .string()
  .min(3, "Subdomain must be at least 3 characters")
  .max(30, "Subdomain must be less than 30 characters")
  .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed")
  .regex(/^[a-z]/, "Must start with a letter")
  .regex(/[a-z0-9]$/, "Must end with a letter or number");

// Domain validation
export const domainSchema = z
  .string()
  .regex(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    "Invalid domain format"
  )
  .or(z.literal(""));

// Phone validation (optional)
export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9\s-()]+$/, "Invalid phone number")
  .or(z.literal(""));

// Price validation (in cents)
export const priceSchema = z
  .number()
  .int("Price must be a whole number")
  .min(0, "Price cannot be negative");
