# Phase 8: First Deploy to Vercel

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Deploy the application to Vercel early to establish CI/CD pipeline and catch deployment issues before they accumulate. This is critical - we learned from the previous project that delaying deployment causes major issues.

---

## 📋 Prerequisites

- [ ] Phase 1-7 completed
- [ ] GitHub account
- [ ] Vercel account (free tier is fine)

---

## ✅ Tasks

### Task 8.1: Prepare for Production

**File: `next.config.ts`** (update)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for catching potential issues
  reactStrictMode: true,

  // Image optimization domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirect root to dashboard or login
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
```

### Task 8.2: Create Production Environment Check

**File: `src/lib/env.ts`**

```typescript
import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Optional: Stripe (will be added later)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Optional: AI (will be added later)
  ANTHROPIC_API_KEY: z.string().optional(),
});

// Validate environment variables
export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

// Export typed env (for server-side use)
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
};
```

### Task 8.3: Add Health Check Endpoint

**File: `src/app/api/health/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    // Check Supabase connection
    const supabase = await createClient();
    const { error } = await supabase.from("agencies").select("id").limit(1);

    const dbStatus = error ? "error" : "healthy";
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: dbStatus === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      },
      responseTime: `${responseTime}ms`,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

### Task 8.4: Create Git Repository

Run these commands in your terminal:

```bash
# Navigate to project directory
cd dramac-cms

# Initialize git repository
git init

# Create .gitignore
```

**File: `.gitignore`**

```gitignore
# Dependencies
node_modules
.pnpm-store

# Next.js
.next
out
build

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Vercel
.vercel

# Testing
coverage
.nyc_output
```

**File: `.env.example`**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL (production)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Stripe (Phase 33+)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI (Phase 22+)
ANTHROPIC_API_KEY=
```

### Task 8.5: Create VS Code Settings

**File: `.vscode/settings.json`**

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

**File: `.vscode/extensions.json`**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma"
  ]
}
```

### Task 8.6: Push to GitHub

```bash
# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Project setup with auth system"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/dramac-v2.git
git branch -M main
git push -u origin main
```

### Task 8.7: Deploy to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New Project"**
3. **Import from GitHub**: Select your `dramac-v2` repository
4. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

5. **Set Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `NEXT_PUBLIC_APP_URL` = your Vercel URL (add after first deploy)

6. **Click Deploy**

### Task 8.8: Post-Deployment Verification

After deployment, verify:

```bash
# Check health endpoint
curl https://your-app.vercel.app/api/health

# Expected response:
# {
#   "status": "healthy",
#   "services": { "database": "healthy" },
#   "responseTime": "50ms"
# }
```

### Task 8.9: Update Supabase Auth Settings

In Supabase Dashboard → Authentication → URL Configuration:

1. **Site URL**: `https://your-app.vercel.app`
2. **Redirect URLs**: Add:
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

### Task 8.10: Create Deploy Script

**File: `scripts/verify-deploy.ts`**

```typescript
/**
 * Post-deployment verification script
 * Run with: npx tsx scripts/verify-deploy.ts
 */

async function verifyDeployment() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  console.log(`\n🔍 Verifying deployment at ${appUrl}\n`);

  const checks = [
    { name: "Health Check", url: `${appUrl}/api/health` },
    { name: "Login Page", url: `${appUrl}/login` },
    { name: "Signup Page", url: `${appUrl}/signup` },
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const response = await fetch(check.url);
      const status = response.ok ? "✅" : "❌";
      console.log(`${status} ${check.name}: ${response.status}`);

      if (!response.ok) allPassed = false;
    } catch (error) {
      console.log(`❌ ${check.name}: Failed to connect`);
      allPassed = false;
    }
  }

  console.log(`\n${allPassed ? "✅ All checks passed!" : "❌ Some checks failed"}\n`);

  process.exit(allPassed ? 0 : 1);
}

verifyDeployment();
```

---

## 📐 Acceptance Criteria

- [ ] Application deploys successfully to Vercel
- [ ] Health check endpoint returns `healthy` status
- [ ] Login page loads correctly
- [ ] Signup page loads correctly
- [ ] Environment variables are set correctly
- [ ] Supabase Auth redirect URLs are configured
- [ ] Git repository is set up with proper `.gitignore`
- [ ] Automatic deploys work on push to main

---

## 🔒 Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets are committed to git
- [ ] Supabase RLS policies are enabled
- [ ] Security headers are configured

---

## 📁 Files Created This Phase

```
next.config.ts (updated)
.gitignore
.env.example
.vscode/
├── settings.json
└── extensions.json
src/lib/
└── env.ts
src/app/api/health/
└── route.ts
scripts/
└── verify-deploy.ts
```

---

## 💡 Important Notes

**Deploy Early, Deploy Often**
- Push to GitHub frequently
- Every push to `main` triggers auto-deploy
- Check Vercel deployment logs if issues occur

**Environment Variables**
- Never commit `.env.local`
- Use Vercel dashboard for production env vars
- Update `.env.example` when adding new env vars

---

## ➡️ Next Phase

**Phase 9: Dashboard Layout** - Create dashboard shell with sidebar navigation, header with user menu, and responsive layout.
