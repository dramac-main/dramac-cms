# Phase 1: Project Setup & Architecture

> **AI Model**: Claude Opus 4.5 (3x) - Foundation phase requires deep architectural thinking
> 
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` completely before starting

---

## 🎯 Objective

Initialize the Next.js 15 project with proper folder structure, TypeScript configuration, and foundational setup that all future phases will build upon.

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Node.js 20+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] VS Code with recommended extensions
- [ ] Git initialized
- [ ] GitHub account (for Vercel deployment)

---

## ✅ Tasks

### Task 1.1: Create Next.js Project

```bash
cd c:\xampp\htdocs
pnpm create next-app@latest dramac-v2 --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd dramac-v2
```

### Task 1.2: Install Core Dependencies

```bash
# UI & Styling
pnpm add class-variance-authority clsx tailwind-merge
pnpm add @radix-ui/react-slot
pnpm add lucide-react
pnpm add geist

# Data & State
pnpm add @tanstack/react-query
pnpm add zustand

# Forms & Validation
pnpm add react-hook-form @hookform/resolvers zod

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# Utilities
pnpm add date-fns

# Dev Dependencies
pnpm add -D @types/node
```

### Task 1.3: Create Folder Structure

Create the following folders:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── clients/
│   │   ├── sites/
│   │   ├── modules/
│   │   ├── billing/
│   │   ├── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── editor/
│   │   └── [siteId]/
│   ├── sites/
│   │   └── [domain]/
│   ├── api/
│   │   ├── webhooks/
│   │   └── ai/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── editor/
│   ├── renderer/
│   └── shared/
│
├── modules/
│   ├── _registry.ts
│   └── _types.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── stripe/
│   ├── ai/
│   └── utils.ts
│
├── hooks/
├── types/
│   ├── database.ts
│   └── index.ts
│
└── config/
    └── constants.ts
```

### Task 1.4: Configure TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Task 1.5: Create Utility Functions

**File: `src/lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
```

### Task 1.6: Create Type Definitions

**File: `src/types/database.ts`**

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          plan: "starter" | "professional" | "enterprise";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          white_label_enabled: boolean;
          custom_branding: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agencies"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["agencies"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: "super_admin" | "admin" | "member";
          agency_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      clients: {
        Row: {
          id: string;
          agency_id: string;
          name: string;
          email: string | null;
          company: string | null;
          phone: string | null;
          status: "active" | "inactive" | "archived";
          seat_activated_at: string;
          seat_paused_at: string | null;
          stripe_subscription_item_id: string | null;
          has_portal_access: boolean;
          portal_user_id: string | null;
          notes: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      sites: {
        Row: {
          id: string;
          client_id: string;
          agency_id: string;
          name: string;
          subdomain: string;
          custom_domain: string | null;
          status: "draft" | "published" | "archived";
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sites"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["sites"]["Insert"]>;
      };
      pages: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          slug: string;
          is_homepage: boolean;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["pages"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["pages"]["Insert"]>;
      };
      page_content: {
        Row: {
          id: string;
          page_id: string;
          content: Json;
          version: number;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["page_content"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["page_content"]["Insert"]>;
      };
    };
  };
}

// Helper types
export type Agency = Database["public"]["Tables"]["agencies"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Site = Database["public"]["Tables"]["sites"]["Row"];
export type Page = Database["public"]["Tables"]["pages"]["Row"];
export type PageContent = Database["public"]["Tables"]["page_content"]["Row"];
```

**File: `src/types/index.ts`**

```typescript
export * from "./database";

// UI Types
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  disabled?: boolean;
  badge?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Pagination
export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
```

### Task 1.7: Create Constants

**File: `src/config/constants.ts`**

```typescript
export const APP_NAME = "DRAMAC";
export const APP_DESCRIPTION = "Build beautiful websites for your clients";

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for new agencies",
    basePrice: 0,
    seatPrice: 29,
    maxClients: 5,
    features: [
      "Up to 5 client seats",
      "Visual editor",
      "Basic templates",
      "Community support",
    ],
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "For growing agencies",
    basePrice: 49,
    seatPrice: 19,
    maxClients: null, // unlimited
    features: [
      "Unlimited client seats",
      "All features",
      "White-label options",
      "Priority support",
      "API access",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For large agencies",
    basePrice: 199,
    seatPrice: 9,
    maxClients: null,
    features: [
      "Unlimited everything",
      "Full white-label",
      "Custom modules",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
} as const;

export const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { title: "Clients", href: "/clients", icon: "users" },
  { title: "Sites", href: "/sites", icon: "globe" },
  { title: "Modules", href: "/modules", icon: "puzzle" },
  { title: "Billing", href: "/billing", icon: "credit-card" },
  { title: "Settings", href: "/settings", icon: "settings" },
] as const;

export const CLIENT_STATUS = {
  active: { label: "Active", color: "success" },
  inactive: { label: "Inactive", color: "warning" },
  archived: { label: "Archived", color: "muted" },
} as const;

export const SITE_STATUS = {
  draft: { label: "Draft", color: "muted" },
  published: { label: "Published", color: "success" },
  archived: { label: "Archived", color: "warning" },
} as const;
```

### Task 1.8: Create Environment Template

**File: `.env.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxx

# Email
RESEND_API_KEY=re_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Task 1.9: Create Base Layout

**File: `src/app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

### Task 1.10: Create Placeholder Pages

**File: `src/app/page.tsx`**

```typescript
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">DRAMAC</h1>
      <p className="text-muted-foreground mb-8">
        Build beautiful websites for your clients
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 border border-border rounded-md"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
```

**File: `src/app/(dashboard)/page.tsx`**

```typescript
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to DRAMAC. This page will show your overview.
      </p>
    </div>
  );
}
```

**File: `src/app/(dashboard)/layout.tsx`**

```typescript
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar will be added in Phase 9 */}
      <aside className="w-64 border-r bg-card">
        <div className="p-4 font-bold">DRAMAC</div>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

---

## 📐 Acceptance Criteria

- [ ] Next.js 15 project initialized with TypeScript
- [ ] All dependencies installed without errors
- [ ] Folder structure matches specification exactly
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Development server runs (`pnpm dev`)
- [ ] All placeholder pages render
- [ ] `.env.example` file created
- [ ] Git repository initialized with initial commit

---

## 🧪 Verification Commands

```bash
# Check TypeScript
pnpm tsc --noEmit

# Run development server
pnpm dev

# Check for lint errors
pnpm lint
```

---

## 📁 Files Created This Phase

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css (modified in Phase 3)
│   └── (dashboard)/
│       ├── layout.tsx
│       └── page.tsx
├── lib/
│   └── utils.ts
├── types/
│   ├── database.ts
│   └── index.ts
├── config/
│   └── constants.ts
└── (empty folders for structure)

.env.example
tsconfig.json (modified)
```

---

## ➡️ Next Phase

**Phase 2: Supabase Schema & Setup** - Set up the database with all tables, relationships, and row-level security policies.


