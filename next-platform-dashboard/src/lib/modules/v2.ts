// =============================================================
// MODULE SYSTEM V2 - CENTRAL EXPORTS
// =============================================================
// This file provides the main entry point for the new module system.
// Import from @/lib/modules/v2 to use the new system.

// Types
export * from "./types";

// Context & Hooks
export * from "./context";
export * from "./hooks";

// Runtime Components
export * from "./runtime";

// Services (server-side)
// Note: Import services directly in server components/actions
// import { installModule } from "@/lib/modules/services/installation-service";
// import { getAgencyModulePricing } from "@/lib/modules/services/pricing-service";
