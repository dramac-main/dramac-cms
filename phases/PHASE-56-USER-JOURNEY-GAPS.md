# Phase 56: User Journey Gap Analysis & Fixes

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-46-REMEDIATION-MASTER-PLAN.md`

---

## 🎯 Objective

This phase identifies and fixes ALL gaps in user journeys to ensure every flow works **flawlessly from start to finish**.

---

## 📊 Journey Audit Summary

| # | Journey | Status | Rating |
|---|---------|--------|--------|
| 1 | New User Registration | ⚠️ Partial | 70% |
| 2 | Login | ⚠️ Partial | 80% |
| 3 | Agency/Profile Setup | ⚠️ Partial | 60% |
| 4 | Client Management | ✅ Complete | 95% |
| 5 | Site Management | ✅ Complete | 95% |
| 6 | Visual Editor | ✅ Complete | 90% |
| 7 | AI Site Builder | ⚠️ Partial | 75% |
| 8 | Page Management | ⚠️ Partial | 85% |
| 9 | Subscription/Billing | ⚠️ Partial | 50% |
| 10 | Settings | ⚠️ Partial | 40% |
| 11 | Admin Journey | ❌ Broken | 10% |
| 12 | Publishing Journey | ✅ Complete | 90% |

---

## 🔴 Critical Gaps to Fix

### Gap 1: Missing Reset Password Page

**Problem**: Password reset flow sends user to `/reset-password` but page doesn't exist.

**File: `src/app/(auth)/reset-password/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, KeyRound, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
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
import { createClient } from "@/lib/supabase/client";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        toast.error("Invalid or expired reset link. Please request a new one.");
        router.push("/auth/forgot-password");
      }
    };
    
    checkSession();
  }, [router]);

  const onSubmit = async (values: ResetPasswordValues) => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast.success("Password updated successfully!");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Password Reset Complete!</h1>
            <p className="text-muted-foreground">
              Your password has been updated. Redirecting to login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Gap 2: Missing Onboarding Flow

**Problem**: New users go directly to dashboard with no guidance.

**File: `src/app/(auth)/onboarding/page.tsx`**

```tsx
"use client";

import { useState } from "react";
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
  CheckCircle,
  ArrowRight,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { updateProfileAction, updateAgencyAction } from "@/lib/actions/onboarding";

const steps = [
  { id: "profile", title: "Your Profile", icon: User },
  { id: "agency", title: "Agency Setup", icon: Building2 },
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

type ProfileValues = z.infer<typeof profileSchema>;
type AgencyValues = z.infer<typeof agencySchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", jobTitle: "" },
  });

  const agencyForm = useForm<AgencyValues>({
    resolver: zodResolver(agencySchema),
    defaultValues: { agencyName: "", agencyDescription: "", website: "" },
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleProfileSubmit = async (values: ProfileValues) => {
    setIsLoading(true);
    try {
      const result = await updateProfileAction(values);
      if (result.error) throw new Error(result.error);
      setCurrentStep(1);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgencySubmit = async (values: AgencyValues) => {
    setIsLoading(true);
    try {
      const result = await updateAgencyAction(values);
      if (result.error) throw new Error(result.error);
      setCurrentStep(2);
    } catch (error: any) {
      toast.error(error.message || "Failed to update agency");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 text-xs ${
                  index <= currentStep
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <step.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Profile */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Welcome! Let's get started</CardTitle>
              <p className="text-muted-foreground">
                Tell us a bit about yourself
              </p>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
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
                        <FormLabel>Job Title (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Founder, Developer, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mr-2" />
                    )}
                    Continue
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Agency */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Set up your agency</CardTitle>
              <p className="text-muted-foreground">
                This is where you'll manage clients and sites
              </p>
            </CardHeader>
            <CardContent>
              <Form {...agencyForm}>
                <form
                  onSubmit={agencyForm.handleSubmit(handleAgencySubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={agencyForm.control}
                    name="agencyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Name</FormLabel>
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
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What does your agency do?"
                            rows={3}
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
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(0)}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      Continue
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {currentStep === 2 && (
          <Card>
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">You're all set!</h1>
              <p className="text-muted-foreground mb-8">
                Your account is ready. Let's start building amazing websites.
              </p>
              <Button onClick={handleComplete} size="lg" className="w-full max-w-xs">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

**File: `src/lib/actions/onboarding.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(values: {
  fullName: string;
  jobTitle?: string;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: values.fullName,
      job_title: values.jobTitle || null,
      onboarding_completed: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateAgencyAction(values: {
  agencyName: string;
  agencyDescription?: string;
  website?: string;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get profile to find agency_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    return { error: "No agency found" };
  }

  // Update agency
  const { error: agencyError } = await supabase
    .from("agencies")
    .update({
      name: values.agencyName,
      description: values.agencyDescription || null,
      website: values.website || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.agency_id);

  if (agencyError) {
    return { error: agencyError.message };
  }

  // Mark onboarding as complete
  await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  return { success: true };
}

export async function checkOnboardingStatus() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { needsOnboarding: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  return {
    needsOnboarding: !profile?.onboarding_completed,
  };
}
```

---

### Gap 3: Linking AI Builder from Site Creation

**Problem**: Users can't easily access AI Builder when creating a new site.

**Update site creation to include AI Builder option:**

**File: `src/app/(dashboard)/dashboard/sites/new/page.tsx`** (update)

Add AI Builder card alongside template option:

```tsx
// Add to the existing creation options
<div className="grid md:grid-cols-3 gap-4">
  <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setCreationMethod("blank")}>
    <CardContent className="pt-6 text-center">
      <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
      <h3 className="font-medium">Blank Site</h3>
      <p className="text-sm text-muted-foreground">Start from scratch</p>
    </CardContent>
  </Card>
  
  <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setCreationMethod("template")}>
    <CardContent className="pt-6 text-center">
      <Layers className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
      <h3 className="font-medium">From Template</h3>
      <p className="text-sm text-muted-foreground">Choose a template</p>
    </CardContent>
  </Card>
  
  <Card className="cursor-pointer hover:border-primary border-2 transition-colors" onClick={() => setCreationMethod("ai")}>
    <CardContent className="pt-6 text-center">
      <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
      <h3 className="font-medium">AI Builder</h3>
      <p className="text-sm text-muted-foreground">Generate with AI</p>
      <Badge className="mt-2">Recommended</Badge>
    </CardContent>
  </Card>
</div>

// When AI is selected, redirect to builder
if (creationMethod === "ai") {
  router.push(`/dashboard/sites/${newSiteId}/builder`);
}
```

---

### Gap 4: Support Page

**Problem**: Support link in nav leads to 404.

**File: `src/app/(dashboard)/dashboard/support/page.tsx`**

```tsx
import { Metadata } from "next";
import Link from "next/link";
import {
  HelpCircle,
  MessageCircle,
  Book,
  Mail,
  ExternalLink,
  FileQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Help & Support | DRAMAC",
};

const supportOptions = [
  {
    title: "Documentation",
    description: "Read guides and tutorials",
    icon: Book,
    href: "/docs",
    external: false,
  },
  {
    title: "FAQ",
    description: "Frequently asked questions",
    icon: FileQuestion,
    href: "/docs/faq",
    external: false,
  },
  {
    title: "Community",
    description: "Join our Discord community",
    icon: MessageCircle,
    href: "https://discord.gg/dramac",
    external: true,
  },
  {
    title: "Email Support",
    description: "Contact our support team",
    icon: Mail,
    href: "mailto:support@dramac.io",
    external: true,
  },
];

export default function SupportPage() {
  return (
    <div className="container py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground mt-2">
          Get help with DRAMAC CMS
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {supportOptions.map((option) => (
          <Card key={option.title} className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <option.icon className="w-5 h-5" />
                </div>
                {option.external && (
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <CardTitle className="text-lg">{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                {option.external ? (
                  <a href={option.href} target="_blank" rel="noopener noreferrer">
                    Open
                  </a>
                ) : (
                  <Link href={option.href}>View</Link>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Still need help?</CardTitle>
          <CardDescription>
            Can't find what you're looking for? Send us a message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="mailto:support@dramac.io">
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Gap 5: Settings Redirect

**Problem**: `/dashboard/settings` has no page.

**File: `src/app/(dashboard)/settings/page.tsx`**

```tsx
import { redirect } from "next/navigation";

export default function SettingsPage() {
  redirect("/settings/profile");
}
```

---

## 📋 Database Update for Onboarding

Add `onboarding_completed` to profiles:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS website text;
```

---

## 🔗 Auth Callback Update

Update auth callback to check onboarding status:

**File: `src/app/(auth)/auth/callback/route.ts`** (update)

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if onboarding is complete
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();
        
        // Redirect to onboarding if not completed
        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
```

---

## 🧪 Testing Checklist

### New User Journey
- [ ] Sign up with email
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Redirected to onboarding
- [ ] Complete profile step
- [ ] Complete agency step
- [ ] Redirected to dashboard
- [ ] Can see dashboard with data

### Password Reset Journey
- [ ] Click "Forgot Password" on login
- [ ] Enter email
- [ ] Receive reset email
- [ ] Click reset link
- [ ] Enter new password
- [ ] See success message
- [ ] Redirected to login
- [ ] Can login with new password

### AI Builder Journey
- [ ] Create new site
- [ ] Select "AI Builder" option
- [ ] Redirected to builder wizard
- [ ] Complete wizard steps
- [ ] Generate site
- [ ] See result in editor

---

## 📝 Summary

This phase fixes critical gaps:
1. ✅ Reset password page
2. ✅ Onboarding flow
3. ✅ Support page
4. ✅ AI Builder linking
5. ✅ Settings redirect

These fixes ensure the core user journeys work smoothly.
