# Phase 74: Agency Onboarding Wizard - FIX AUTO-REDIRECT

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 4-5 hours

---

## 🎯 Objective

**FIX THE BROKEN ONBOARDING REDIRECT!** The wizard EXISTS but users never see it because signup redirects to `/dashboard` instead of `/onboarding`.

**ROOT CAUSE IDENTIFIED:**
```typescript
// src/lib/actions/auth.ts line 123
redirect("/dashboard");  // ← BUG! Should be "/onboarding"
```

**ALSO:** Middleware doesn't check `onboarding_completed` flag!

---

## 📋 Prerequisites

- [ ] Authentication system working
- [ ] Supabase profiles table exists
- [ ] Agencies table exists
- [ ] Basic UI components ready

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ Onboarding page at `/app/(auth)/onboarding/page.tsx` (354 lines)
- ✅ 3-step wizard: Profile → Agency Setup → Complete
- ✅ Form validation with Zod
- ✅ `checkOnboardingStatus()` function
- ✅ Progress bar UI
- ✅ `onboarding_completed` field in profiles table

**What's BROKEN:**
- ❌ `src/lib/actions/auth.ts` line 123: `redirect("/dashboard")` - WRONG!
- ❌ Middleware doesn't check `onboarding_completed` flag
- ❌ No forced redirect for incomplete onboarding

**What's Missing (Enhancements):**
- Industry selection for better AI suggestions
- First client/site creation step (optional)
- Product tour after completion (optional)

---

## 💼 Business Value

1. **Higher Activation** - Guided setup increases user engagement
2. **Better Data** - Collecting industry/goals helps personalization
3. **Reduced Churn** - Users who complete setup are 3x more likely to stay
4. **AI Quality** - Industry data improves AI-generated content
5. **Support Reduction** - Self-service onboarding reduces tickets

---

## 📁 Files to Create/Modify

```
src/app/(auth)/onboarding/
├── page.tsx                     # Enhanced wizard (MODIFY)
├── layout.tsx                   # Onboarding layout
├── steps/
│   ├── profile-step.tsx         # Profile form
│   ├── agency-step.tsx          # Agency setup
│   ├── industry-step.tsx        # Industry selection
│   ├── goals-step.tsx           # Goals & team size
│   ├── first-client-step.tsx    # Create first client
│   ├── complete-step.tsx        # Success + tour

src/lib/actions/onboarding.ts    # Enhanced actions (MODIFY)

src/components/onboarding/
├── step-indicator.tsx           # Step progress
├── industry-selector.tsx        # Industry grid
├── goal-cards.tsx               # Goal selection
├── product-tour.tsx             # Interactive tour
├── onboarding-redirect.tsx      # Auto-redirect component

src/hooks/
├── use-onboarding.ts            # Onboarding state hook
├── use-product-tour.ts          # Tour management
```

---

## ✅ Tasks

### Task 74.0: FIX SIGNUP REDIRECT (THE ACTUAL BUG!)

**This is the critical fix - without this, onboarding never shows!**

**File: `src/lib/actions/auth.ts`** (MODIFY - change redirect)

Find line ~123 and change:
```typescript
// BEFORE (BUG):
redirect("/dashboard");

// AFTER (FIXED):
redirect("/onboarding");
```

**Full context - the signup function should end like this:**

```typescript
  // 4. Create organization membership
  const { error: memberError } = await supabase.from("agency_members").insert({
    agency_id: org.id,
    user_id: authData.user.id,
    role: "owner",
  });

  if (memberError) {
    return { error: "Failed to create organization membership" };
  }

  // Check if email confirmation is required
  if (authData.user.identities?.length === 0) {
    return { success: true, message: "Check your email to confirm your account" };
  }

  // FIXED: Redirect to onboarding instead of dashboard!
  redirect("/onboarding");
}
```

---

### Task 74.0b: FIX MIDDLEWARE - Force Onboarding Check

**File: `src/lib/supabase/middleware.ts`** (MODIFY - add onboarding check)

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: _options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const publicRoutes = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute && !request.nextUrl.pathname.startsWith("/api")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding"; // Changed from /dashboard
    return NextResponse.redirect(url);
  }

  // NEW: Check if user needs onboarding (except on onboarding page itself)
  if (user && !request.nextUrl.pathname.startsWith("/onboarding") && !request.nextUrl.pathname.startsWith("/api")) {
    // Check if onboarding is completed
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist or onboarding not completed, redirect
    if (!profile || profile.onboarding_completed !== true) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
```

---

### Task 74.1: Enhanced Onboarding Actions

**File: `src/lib/actions/onboarding.ts`** (REPLACE entire file)

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Industry options with AI context
export const INDUSTRIES = [
  { id: "restaurant", label: "Restaurant & Food", icon: "🍽️", aiContext: "food service, dining, menu, reservations" },
  { id: "retail", label: "Retail & E-commerce", icon: "🛍️", aiContext: "products, shopping, inventory, sales" },
  { id: "healthcare", label: "Healthcare & Medical", icon: "🏥", aiContext: "medical, health, wellness, patients" },
  { id: "legal", label: "Legal & Law", icon: "⚖️", aiContext: "legal services, law firm, attorneys, cases" },
  { id: "realestate", label: "Real Estate", icon: "🏠", aiContext: "property, homes, listings, agents" },
  { id: "fitness", label: "Fitness & Wellness", icon: "💪", aiContext: "gym, fitness, training, health" },
  { id: "beauty", label: "Beauty & Salon", icon: "💇", aiContext: "beauty, salon, spa, treatments" },
  { id: "automotive", label: "Automotive", icon: "🚗", aiContext: "cars, vehicles, repair, dealership" },
  { id: "construction", label: "Construction", icon: "🏗️", aiContext: "building, contractors, renovation" },
  { id: "finance", label: "Finance & Accounting", icon: "💰", aiContext: "financial, accounting, investment" },
  { id: "education", label: "Education", icon: "📚", aiContext: "learning, courses, school, training" },
  { id: "technology", label: "Technology", icon: "💻", aiContext: "tech, software, IT, digital" },
  { id: "creative", label: "Creative & Design", icon: "🎨", aiContext: "design, creative, art, branding" },
  { id: "hospitality", label: "Hospitality & Travel", icon: "✈️", aiContext: "hotel, travel, tourism, booking" },
  { id: "nonprofit", label: "Non-Profit", icon: "❤️", aiContext: "charity, nonprofit, community, cause" },
  { id: "other", label: "Other", icon: "📌", aiContext: "business, professional services" },
] as const;

export type IndustryId = typeof INDUSTRIES[number]["id"];

export interface OnboardingStatus {
  needsOnboarding: boolean;
  currentStep: number;
  completedSteps: string[];
  hasAgency: boolean;
  hasProfile: boolean;
}

export async function checkOnboardingStatus(): Promise<OnboardingStatus> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { 
      needsOnboarding: true, 
      currentStep: 0, 
      completedSteps: [], 
      hasAgency: false,
      hasProfile: false,
    };
  }

  // Check profile completion
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, onboarding_completed, job_title")
    .eq("id", user.id)
    .single();

  // Check if user has an agency
  const { data: agencyMembership } = await supabase
    .from("agency_members")
    .select("agency_id, role, agency:agencies(id, name)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const hasProfile = !!(profile?.name);
  const hasAgency = !!(agencyMembership?.agency);
  const isCompleted = profile?.onboarding_completed === true;

  const completedSteps: string[] = [];
  if (hasProfile) completedSteps.push("profile");
  if (hasAgency) completedSteps.push("agency");

  let currentStep = 0;
  if (hasProfile) currentStep = 1;
  if (hasAgency) currentStep = 2;

  return {
    needsOnboarding: !isCompleted,
    currentStep,
    completedSteps,
    hasAgency,
    hasProfile,
  };
}

export interface ProfileFormData {
  fullName: string;
  jobTitle?: string;
}

export async function updateProfileAction(data: ProfileFormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      name: data.fullName,
      job_title: data.jobTitle || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  
  revalidatePath("/onboarding");
  return {};
}

export interface AgencyFormData {
  agencyName: string;
  agencyDescription?: string;
  website?: string;
  industry?: IndustryId;
  teamSize?: string;
  goals?: string[];
}

export async function updateAgencyAction(data: AgencyFormData): Promise<{ error?: string; agencyId?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if user already has an agency
  const { data: existingMembership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (existingMembership?.agency_id) {
    // Update existing agency
    const { error } = await supabase
      .from("agencies")
      .update({
        name: data.agencyName,
        description: data.agencyDescription || null,
        website: data.website || null,
        industry: data.industry || null,
        team_size: data.teamSize || null,
        goals: data.goals || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingMembership.agency_id);

    if (error) return { error: error.message };
    return { agencyId: existingMembership.agency_id };
  }

  // Create new agency
  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .insert({
      name: data.agencyName,
      description: data.agencyDescription || null,
      website: data.website || null,
      industry: data.industry || null,
      team_size: data.teamSize || null,
      goals: data.goals || [],
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (agencyError) return { error: agencyError.message };

  // Add user as owner member
  const { error: memberError } = await supabase
    .from("agency_members")
    .insert({
      agency_id: agency.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) return { error: memberError.message };

  revalidatePath("/onboarding");
  return { agencyId: agency.id };
}

export interface FirstClientData {
  clientName: string;
  clientEmail?: string;
  clientIndustry?: IndustryId;
}

export async function createFirstClientAction(
  agencyId: string,
  data: FirstClientData
): Promise<{ error?: string; clientId?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      agency_id: agencyId,
      name: data.clientName,
      email: data.clientEmail || null,
      industry: data.clientIndustry || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  
  revalidatePath("/onboarding");
  return { clientId: client.id };
}

export async function completeOnboardingAction(): Promise<{ error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  
  revalidatePath("/dashboard");
  return {};
}

export async function skipOnboardingAction(): Promise<{ error?: string }> {
  return completeOnboardingAction();
}
```

---

### Task 74.2: Industry Selector Component

**File: `src/components/onboarding/industry-selector.tsx`**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { INDUSTRIES, type IndustryId } from "@/lib/actions/onboarding";
import { Check } from "lucide-react";

interface IndustrySelectorProps {
  value?: IndustryId;
  onChange: (id: IndustryId) => void;
}

export function IndustrySelector({ value, onChange }: IndustrySelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {INDUSTRIES.map((industry) => (
        <button
          key={industry.id}
          type="button"
          onClick={() => onChange(industry.id)}
          className={cn(
            "relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
            "hover:border-primary/50 hover:bg-muted/50",
            value === industry.id
              ? "border-primary bg-primary/5"
              : "border-border"
          )}
        >
          {value === industry.id && (
            <div className="absolute top-2 right-2">
              <Check className="h-4 w-4 text-primary" />
            </div>
          )}
          <span className="text-2xl mb-2">{industry.icon}</span>
          <span className="text-xs font-medium text-center">
            {industry.label}
          </span>
        </button>
      ))}
    </div>
  );
}
```

---

### Task 74.3: Goals Selection Component

**File: `src/components/onboarding/goal-cards.tsx`**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const GOALS = [
  {
    id: "build-sites",
    label: "Build client websites",
    description: "Create and manage websites for clients",
    icon: "🌐",
  },
  {
    id: "grow-agency",
    label: "Grow my agency",
    description: "Scale operations and take on more clients",
    icon: "📈",
  },
  {
    id: "automate",
    label: "Automate workflows",
    description: "Save time with AI and automation",
    icon: "⚡",
  },
  {
    id: "white-label",
    label: "White-label for clients",
    description: "Offer a branded experience",
    icon: "🏷️",
  },
  {
    id: "modules",
    label: "Add functionality",
    description: "Extend sites with modules",
    icon: "🧩",
  },
  {
    id: "revenue",
    label: "Generate recurring revenue",
    description: "Monthly subscriptions from clients",
    icon: "💰",
  },
];

const TEAM_SIZES = [
  { id: "solo", label: "Just me", description: "Solo agency" },
  { id: "small", label: "2-5 people", description: "Small team" },
  { id: "medium", label: "6-20 people", description: "Growing team" },
  { id: "large", label: "20+ people", description: "Large agency" },
];

interface GoalCardsProps {
  selectedGoals: string[];
  onGoalsChange: (goals: string[]) => void;
  teamSize?: string;
  onTeamSizeChange: (size: string) => void;
}

export function GoalCards({
  selectedGoals,
  onGoalsChange,
  teamSize,
  onTeamSizeChange,
}: GoalCardsProps) {
  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      onGoalsChange(selectedGoals.filter((g) => g !== goalId));
    } else {
      onGoalsChange([...selectedGoals, goalId]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Team Size */}
      <div>
        <h3 className="text-sm font-medium mb-3">Team Size</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TEAM_SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => onTeamSizeChange(size.id)}
              className={cn(
                "p-3 rounded-lg border-2 text-left transition-all",
                "hover:border-primary/50",
                teamSize === size.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <p className="font-medium text-sm">{size.label}</p>
              <p className="text-xs text-muted-foreground">{size.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          What are your main goals? <span className="text-muted-foreground">(Select all that apply)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GOALS.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "relative flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                "hover:border-primary/50",
                selectedGoals.includes(goal.id)
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              {selectedGoals.includes(goal.id) && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
              <span className="text-xl">{goal.icon}</span>
              <div>
                <p className="font-medium text-sm">{goal.label}</p>
                <p className="text-xs text-muted-foreground">{goal.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 74.4: Step Indicator Component

**File: `src/components/onboarding/step-indicator.tsx`**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center",
              index < steps.length - 1 && "flex-1"
            )}
          >
            {/* Step circle */}
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                isCompleted && "bg-primary border-primary",
                isCurrent && "border-primary bg-primary/10",
                !isCompleted && !isCurrent && "border-muted-foreground/30"
              )}
            >
              {isCompleted ? (
                <Check className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isCurrent ? "text-primary" : "text-muted-foreground/50"
                  )}
                />
              )}
            </div>

            {/* Step label */}
            <span
              className={cn(
                "ml-2 text-sm font-medium hidden sm:inline",
                isCompleted && "text-primary",
                isCurrent && "text-foreground",
                !isCompleted && !isCurrent && "text-muted-foreground/50"
              )}
            >
              {step.title}
            </span>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

### Task 74.5: Onboarding Redirect Component (for Dashboard Layout)

**File: `src/components/onboarding/onboarding-redirect.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkOnboardingStatus } from "@/lib/actions/onboarding";

interface OnboardingRedirectProps {
  children: React.ReactNode;
}

export function OnboardingRedirect({ children }: OnboardingRedirectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Don't check if already on onboarding page
    if (pathname.startsWith("/onboarding")) {
      setIsChecking(false);
      return;
    }

    const check = async () => {
      try {
        const status = await checkOnboardingStatus();
        
        if (status.needsOnboarding) {
          setShouldRedirect(true);
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    check();
  }, [pathname, router]);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Don't render children if redirecting
  if (shouldRedirect) {
    return null;
  }

  return <>{children}</>;
}
```

---

### Task 74.6: Product Tour Component

**File: `src/components/onboarding/product-tour.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='sidebar']",
    title: "Navigation Sidebar",
    description: "Access all your clients, sites, and settings from here.",
    position: "right",
  },
  {
    target: "[data-tour='clients']",
    title: "Client Management",
    description: "Add and manage your clients. Each client can have multiple websites.",
    position: "right",
  },
  {
    target: "[data-tour='sites']",
    title: "Site Builder",
    description: "Create stunning websites with our visual editor or AI builder.",
    position: "right",
  },
  {
    target: "[data-tour='ai-builder']",
    title: "AI Builder",
    description: "Generate complete websites from a simple description in seconds!",
    position: "right",
  },
  {
    target: "[data-tour='modules']",
    title: "Module Marketplace",
    description: "Extend your sites with powerful add-ons like forms, analytics, and more.",
    position: "right",
  },
];

interface ProductTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

export function ProductTour({ onComplete, isOpen }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    const element = document.querySelector(step.target);

    if (element) {
      const rect = element.getBoundingClientRect();
      
      // Calculate position based on step.position
      let top = 0;
      let left = 0;

      switch (step.position) {
        case "right":
          top = rect.top + rect.height / 2 - 50;
          left = rect.right + 16;
          break;
        case "left":
          top = rect.top + rect.height / 2 - 50;
          left = rect.left - 316;
          break;
        case "top":
          top = rect.top - 120;
          left = rect.left + rect.width / 2 - 150;
          break;
        case "bottom":
          top = rect.bottom + 16;
          left = rect.left + rect.width / 2 - 150;
          break;
      }

      setTooltipPosition({ top, left });

      // Highlight element
      element.classList.add("ring-2", "ring-primary", "ring-offset-2", "z-50");

      return () => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2", "z-50");
      };
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />

      {/* Tooltip */}
      <Card
        className="fixed w-80 z-50 shadow-xl"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">{step.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onComplete}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {step.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              {!isFirst && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep((s) => s - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {isLast ? (
                <Button size="sm" onClick={onComplete}>
                  Finish Tour
                </Button>
              ) : (
                <Button size="sm" onClick={() => setCurrentStep((s) => s + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
```

---

### Task 74.7: Enhanced Onboarding Page

**File: `src/app/(auth)/onboarding/page.tsx`** (REPLACE entire file)

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  User,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Briefcase,
  Target,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { IndustrySelector } from "@/components/onboarding/industry-selector";
import { GoalCards } from "@/components/onboarding/goal-cards";
import {
  updateProfileAction,
  updateAgencyAction,
  createFirstClientAction,
  completeOnboardingAction,
  skipOnboardingAction,
  checkOnboardingStatus,
  type IndustryId,
} from "@/lib/actions/onboarding";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { id: "profile", title: "Your Profile", icon: User },
  { id: "agency", title: "Agency", icon: Building2 },
  { id: "goals", title: "Goals", icon: Target },
  { id: "industry", title: "Industry", icon: Briefcase },
  { id: "client", title: "First Client", icon: Users },
  { id: "complete", title: "All Set!", icon: CheckCircle },
];

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  jobTitle: z.string().optional(),
});

const agencySchema = z.object({
  agencyName: z.string().min(2, "Agency name must be at least 2 characters"),
  agencyDescription: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const clientSchema = z.object({
  clientName: z.string().min(2, "Client name required"),
  clientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;
type AgencyValues = z.infer<typeof agencySchema>;
type ClientValues = z.infer<typeof clientSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // Additional state for goals/industry
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryId | undefined>();
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", jobTitle: "" },
  });

  const agencyForm = useForm<AgencyValues>({
    resolver: zodResolver(agencySchema),
    defaultValues: { agencyName: "", agencyDescription: "", website: "" },
  });

  const clientForm = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { clientName: "", clientEmail: "" },
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Check onboarding status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        const result = await checkOnboardingStatus();
        
        if (!result.needsOnboarding) {
          router.push("/dashboard");
          return;
        }

        // Pre-fill name from auth metadata
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        if (userName) {
          profileForm.setValue("fullName", userName);
        }

        // Resume from where they left off
        if (result.hasProfile && result.hasAgency) {
          setCurrentStep(2); // Goals step
        } else if (result.hasProfile) {
          setCurrentStep(1); // Agency step
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setIsChecking(false);
      }
    };

    checkStatus();
  }, [router, profileForm]);

  const handleProfileSubmit = async (values: ProfileValues) => {
    setIsLoading(true);
    try {
      const result = await updateProfileAction(values);
      if (result.error) throw new Error(result.error);
      setCurrentStep(1);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgencySubmit = async (values: AgencyValues) => {
    setIsLoading(true);
    try {
      const result = await updateAgencyAction({
        ...values,
        industry: selectedIndustry,
        teamSize,
        goals: selectedGoals,
      });
      if (result.error) throw new Error(result.error);
      if (result.agencyId) setAgencyId(result.agencyId);
      setCurrentStep(2);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create agency");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalsNext = () => {
    setCurrentStep(3);
  };

  const handleIndustryNext = () => {
    setCurrentStep(4);
  };

  const handleClientSubmit = async (values: ClientValues) => {
    if (!agencyId) {
      // Skip client creation if no agency
      setCurrentStep(5);
      return;
    }

    setIsLoading(true);
    try {
      const result = await createFirstClientAction(agencyId, {
        clientName: values.clientName,
        clientEmail: values.clientEmail || undefined,
        clientIndustry: selectedIndustry,
      });
      if (result.error) throw new Error(result.error);
      setCurrentStep(5);
      toast.success("Client created!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create client");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipClient = () => {
    setCurrentStep(5);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await completeOnboardingAction();
      router.push("/dashboard?tour=true");
    } catch (error) {
      toast.error("Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipAll = async () => {
    setIsLoading(true);
    try {
      await skipOnboardingAction();
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to skip onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step 1: Profile */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Welcome to DRAMAC CMS!
              </CardTitle>
              <CardDescription>
                Let's set up your account. This will only take a minute.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Agency Owner, Designer, etc." {...field} />
                        </FormControl>
                        <FormDescription>Optional but helps us personalize your experience</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="ghost" onClick={handleSkipAll}>
                      Skip for now
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Agency */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Set Up Your Agency
              </CardTitle>
              <CardDescription>
                Tell us about your agency so we can customize your experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...agencyForm}>
                <form onSubmit={agencyForm.handleSubmit(handleAgencySubmit)} className="space-y-4">
                  <FormField
                    control={agencyForm.control}
                    name="agencyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Agency" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={agencyForm.control}
                    name="agencyDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What does your agency do?"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={agencyForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://myagency.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(0)}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Goals */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Goals
              </CardTitle>
              <CardDescription>
                Help us understand what you want to achieve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoalCards
                selectedGoals={selectedGoals}
                onGoalsChange={setSelectedGoals}
                teamSize={teamSize}
                onTeamSizeChange={setTeamSize}
              />
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleGoalsNext}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Industry */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Primary Industry
              </CardTitle>
              <CardDescription>
                What industry do most of your clients belong to? This helps our AI generate better content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IndustrySelector value={selectedIndustry} onChange={setSelectedIndustry} />
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleIndustryNext}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: First Client */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add Your First Client
              </CardTitle>
              <CardDescription>
                Create your first client to get started building websites. You can skip this and add clients later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...clientForm}>
                <form onSubmit={clientForm.handleSubmit(handleClientSubmit)} className="space-y-4">
                  <FormField
                    control={clientForm.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client/Business Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email</FormLabel>
                        <FormControl>
                          <Input placeholder="client@example.com" type="email" {...field} />
                        </FormControl>
                        <FormDescription>Optional - for sending invites later</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={handleSkipClient}>
                        Skip
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Client
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Complete */}
        {currentStep === 5 && (
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">You're All Set!</CardTitle>
              <CardDescription className="text-base">
                Your agency is ready. Start building amazing websites for your clients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-left">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">🚀</p>
                  <p className="text-sm font-medium">Visual Editor</p>
                  <p className="text-xs text-muted-foreground">Drag & drop builder</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">✨</p>
                  <p className="text-sm font-medium">AI Builder</p>
                  <p className="text-xs text-muted-foreground">Generate sites instantly</p>
                </div>
              </div>
              <Button size="lg" onClick={handleComplete} disabled={isLoading} className="mt-6">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Go to Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

### Task 74.8: Update Dashboard Layout for Redirect

**File: `src/app/(dashboard)/layout.tsx`** (Add OnboardingRedirect wrapper)

Add this import and wrapper to the existing layout:

```typescript
// Add import at top
import { OnboardingRedirect } from "@/components/onboarding/onboarding-redirect";

// Wrap children in OnboardingRedirect
export default function DashboardLayout({ children }) {
  return (
    <OnboardingRedirect>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </OnboardingRedirect>
  );
}
```

---

### Task 74.9: Database Migration for Onboarding Fields

**File: `migrations/onboarding-complete.sql`**

```sql
-- Add missing columns for enhanced onboarding
-- Run this after the existing onboarding.sql migration

-- Add industry column to agencies if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'industry'
    ) THEN
        ALTER TABLE agencies ADD COLUMN industry TEXT;
    END IF;
END $$;

-- Add team_size column to agencies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'team_size'
    ) THEN
        ALTER TABLE agencies ADD COLUMN team_size TEXT;
    END IF;
END $$;

-- Add goals column to agencies (array)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'goals'
    ) THEN
        ALTER TABLE agencies ADD COLUMN goals TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Add industry column to clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'industry'
    ) THEN
        ALTER TABLE clients ADD COLUMN industry TEXT;
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN agencies.industry IS 'Primary industry the agency serves';
COMMENT ON COLUMN agencies.team_size IS 'Team size category: solo, small, medium, large';
COMMENT ON COLUMN agencies.goals IS 'Array of goal IDs selected during onboarding';
COMMENT ON COLUMN clients.industry IS 'Client industry for AI content generation';
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Profile form validation works
- [ ] Agency form validation works
- [ ] Industry selector updates state
- [ ] Goal cards toggle correctly

### Integration Tests
- [ ] Onboarding status check works
- [ ] Profile update saves to database
- [ ] Agency creation works
- [ ] Client creation works
- [ ] Onboarding completion flags user

### E2E Tests
- [ ] New user redirected to onboarding
- [ ] Can complete all steps
- [ ] Skip functionality works
- [ ] Dashboard loads after completion
- [ ] No redirect loop for completed users

---

## ✅ Completion Checklist

- [ ] Onboarding actions enhanced
- [ ] Industry selector created
- [ ] Goal cards created
- [ ] Step indicator created
- [ ] Onboarding redirect component created
- [ ] Product tour component created
- [ ] Enhanced onboarding page created
- [ ] Dashboard layout updated
- [ ] Database migration created
- [ ] Tests passing

---

**Next Phase**: Phase 75 - Visual Editor Preview Fix
