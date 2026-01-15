# Phase 51: Settings & Profile - Complete Implementation

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-46-REMEDIATION-MASTER-PLAN.md`

---

## 🎯 Objective

Create complete settings and profile management system including agency settings, user profile, team management, notification preferences, and account settings.

---

## 📋 Prerequisites

- [ ] Phase 50 completed
- [ ] Authentication working
- [ ] Database tables exist

---

## ✅ Tasks

### Task 51.1: Settings Layout

**File: `src/app/(dashboard)/settings/layout.tsx`**

```tsx
import { Metadata } from "next";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";

export const metadata: Metadata = {
  title: "Settings | DRAMAC",
  description: "Manage your account and agency settings",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6">
      <aside className="w-full lg:w-64 shrink-0">
        <SettingsSidebar />
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
```

### Task 51.2: Settings Sidebar

**File: `src/components/settings/settings-sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  User,
  Users,
  Bell,
  CreditCard,
  Shield,
  Palette,
  Globe,
} from "lucide-react";

const settingsNav = [
  {
    title: "Account",
    items: [
      { name: "Profile", href: "/settings/profile", icon: User },
      { name: "Security", href: "/settings/security", icon: Shield },
      { name: "Notifications", href: "/settings/notifications", icon: Bell },
    ],
  },
  {
    title: "Agency",
    items: [
      { name: "General", href: "/settings/agency", icon: Building2 },
      { name: "Team", href: "/settings/team", icon: Users },
      { name: "Branding", href: "/settings/branding", icon: Palette },
      { name: "Domains", href: "/settings/domains", icon: Globe },
    ],
  },
  {
    title: "Billing",
    items: [
      { name: "Subscription", href: "/settings/subscription", icon: CreditCard },
    ],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account and agency
        </p>
      </div>

      {settingsNav.map((section) => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
```

### Task 51.3: Settings Main Page (Redirects)

**File: `src/app/(dashboard)/settings/page.tsx`**

```tsx
import { redirect } from "next/navigation";

export default function SettingsPage() {
  redirect("/settings/profile");
}
```

### Task 51.4: Profile Settings Page

**File: `src/app/(dashboard)/settings/profile/page.tsx`**

```tsx
import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getProfile } from "@/lib/actions/profile";
import { ProfileForm } from "@/components/settings/profile-form";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Profile Settings | DRAMAC",
};

export default async function ProfileSettingsPage() {
  const session = await getSession();
  const profile = session ? await getProfile(session.user.id) : null;

  if (!profile) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a photo to personalize your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            userId={profile.id}
            currentAvatarUrl={profile.avatar_url}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your name and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 51.5: Profile Form Component

**File: `src/components/settings/profile-form.tsx`**

```tsx
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
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/types/database";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      bio: profile.bio || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateProfile(profile.id, data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            {...register("full_name")}
            placeholder="John Doe"
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile.email || ""}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed here
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          {...register("phone")}
          placeholder="+260 XXX XXX XXX"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          {...register("bio")}
          placeholder="Tell us about yourself..."
          rows={4}
          className="resize-none"
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
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
```

### Task 51.6: Avatar Upload Component

**File: `src/components/settings/avatar-upload.tsx`**

```tsx
"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { uploadAvatar, deleteAvatar } from "@/lib/actions/profile";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
}

export function AvatarUpload({ userId, currentAvatarUrl }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const result = await uploadAvatar(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        setAvatarUrl(result.url);
        toast.success("Avatar updated successfully");
      }
    } catch (error) {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!avatarUrl) return;

    setIsDeleting(true);
    try {
      const result = await deleteAvatar(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setAvatarUrl(null);
        toast.success("Avatar deleted");
      }
    } catch (error) {
      toast.error("Failed to delete avatar");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={avatarUrl || undefined} alt="Profile picture" />
          <AvatarFallback className="text-2xl">
            {userId.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="w-4 h-4 mr-2" />
            {avatarUrl ? "Change" : "Upload"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or GIF. Max 5MB.
        </p>
      </div>
    </div>
  );
}
```

### Task 51.7: Profile Actions

**File: `src/lib/actions/profile.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string;
    phone?: string;
    bio?: string;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }

  revalidatePath("/settings/profile");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  const userId = formData.get("userId") as string;

  if (!file || !userId) {
    return { error: "Missing file or user ID" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    return { error: "Failed to upload image" };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (updateError) {
    console.error("Error updating avatar URL:", updateError);
    return { error: "Failed to save avatar" };
  }

  revalidatePath("/settings/profile");
  return { url: publicUrl };
}

export async function deleteAvatar(userId: string) {
  const supabase = await createClient();

  // Get current avatar URL to delete from storage
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  if (profile?.avatar_url) {
    // Extract file path from URL
    const urlParts = profile.avatar_url.split("/avatars/");
    if (urlParts[1]) {
      await supabase.storage.from("avatars").remove([urlParts[1]]);
    }
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", userId);

  if (error) {
    console.error("Error removing avatar:", error);
    return { error: "Failed to remove avatar" };
  }

  revalidatePath("/settings/profile");
  return { success: true };
}
```

### Task 51.8: Security Settings Page

**File: `src/app/(dashboard)/settings/security/page.tsx`**

```tsx
import { Metadata } from "next";
import { PasswordChangeForm } from "@/components/settings/password-change-form";
import { SessionsManager } from "@/components/settings/sessions-manager";
import { TwoFactorSetup } from "@/components/settings/two-factor-setup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Security Settings | DRAMAC",
};

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-muted-foreground">
          Manage your password and security settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password regularly to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage devices where you're currently logged in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsManager />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 51.9: Password Change Form

**File: `src/components/settings/password-change-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/actions/security";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export function PasswordChangeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    try {
      const result = await changePassword(data.currentPassword, data.newPassword);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password changed successfully");
        reset();
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrent ? "text" : "password"}
            {...register("currentPassword")}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowCurrent(!showCurrent)}
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        {errors.currentPassword && (
          <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNew ? "text" : "password"}
            {...register("newPassword")}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Change Password
      </Button>
    </form>
  );
}
```

### Task 51.10: Agency Settings Page

**File: `src/app/(dashboard)/settings/agency/page.tsx`**

```tsx
import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getAgency } from "@/lib/actions/agency";
import { AgencyForm } from "@/components/settings/agency-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Agency Settings | DRAMAC",
};

export default async function AgencySettingsPage() {
  const session = await getSession();
  if (!session) {
    return <div>Please log in.</div>;
  }

  const agency = await getAgency(session.user.id);

  if (!agency) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Agency Settings</h1>
          <p className="text-muted-foreground">
            You don't have an agency yet. Create one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agency Settings</h1>
        <p className="text-muted-foreground">
          Manage your agency details and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Basic details about your agency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgencyForm agency={agency} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 51.11: Agency Form Component

**File: `src/components/settings/agency-form.tsx`**

```tsx
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
import { Textarea } from "@/components/ui/textarea";
import { updateAgency } from "@/lib/actions/agency";
import type { Agency } from "@/types/database";

const agencySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().max(500).optional(),
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
      website: agency.website || "",
      description: agency.description || "",
    },
  });

  const onSubmit = async (data: AgencyFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateAgency(agency.id, data);
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
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          {...register("website")}
          placeholder="https://myagency.com"
        />
        {errors.website && (
          <p className="text-sm text-destructive">{errors.website.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Tell clients about your agency..."
          rows={4}
          className="resize-none"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
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
```

### Task 51.12: Team Management Page

**File: `src/app/(dashboard)/settings/team/page.tsx`**

```tsx
import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getAgencyTeam } from "@/lib/actions/team";
import { TeamMembersList } from "@/components/settings/team-members-list";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Team Management | DRAMAC",
};

export default async function TeamSettingsPage() {
  const session = await getSession();
  if (!session) {
    return <div>Please log in.</div>;
  }

  const team = await getAgencyTeam(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and their permissions
          </p>
        </div>
        <InviteMemberDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {team?.members?.length || 0} member(s) in your agency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMembersList members={team?.members || []} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 51.13: Team Members List

**File: `src/components/settings/team-members-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Shield, User, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { removeTeamMember, updateMemberRole } from "@/lib/actions/team";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

interface TeamMembersListProps {
  members: TeamMember[];
}

const roleColors: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-800",
  admin: "bg-blue-100 text-blue-800",
  member: "bg-gray-100 text-gray-800",
};

export function TeamMembersList({ members }: TeamMembersListProps) {
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  const handleRemove = async () => {
    if (!memberToRemove) return;

    try {
      const result = await removeTeamMember(memberToRemove.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Team member removed");
      }
    } catch (error) {
      toast.error("Failed to remove team member");
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const result = await updateMemberRole(memberId, newRole);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Role updated");
      }
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No team members yet. Invite someone to get started.
      </div>
    );
  }

  return (
    <>
      <div className="divide-y">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback>
                  {(member.full_name || member.email)
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {member.full_name || "Unnamed"}
                </p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className={roleColors[member.role]}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </Badge>

              {member.role !== "owner" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.id, "admin")}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Make Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.id, "member")}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Make Member
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setMemberToRemove(member)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {memberToRemove?.full_name || memberToRemove?.email}
              </strong>{" "}
              from your team? They will lose access to all agency resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

### Task 51.14: Notification Settings Page

**File: `src/app/(dashboard)/settings/notifications/page.tsx`**

```tsx
import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getNotificationPreferences } from "@/lib/actions/notifications";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Notification Settings | DRAMAC",
};

export default async function NotificationSettingsPage() {
  const session = await getSession();
  if (!session) {
    return <div>Please log in.</div>;
  }

  const preferences = await getNotificationPreferences(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Configure how and when you receive notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose which emails you'd like to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm preferences={preferences} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 51.15: Notification Preferences Form

**File: `src/components/settings/notification-preferences-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateNotificationPreferences } from "@/lib/actions/notifications";

interface NotificationPreferences {
  email_marketing: boolean;
  email_security: boolean;
  email_updates: boolean;
  email_team: boolean;
  email_billing: boolean;
}

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences | null;
}

const defaultPreferences: NotificationPreferences = {
  email_marketing: false,
  email_security: true,
  email_updates: true,
  email_team: true,
  email_billing: true,
};

const notificationOptions = [
  {
    id: "email_security",
    label: "Security alerts",
    description: "Get notified about login attempts and security changes",
  },
  {
    id: "email_billing",
    label: "Billing notifications",
    description: "Invoices, payment confirmations, and subscription updates",
  },
  {
    id: "email_team",
    label: "Team activity",
    description: "When team members join or leave, or roles change",
  },
  {
    id: "email_updates",
    label: "Product updates",
    description: "New features, improvements, and announcements",
  },
  {
    id: "email_marketing",
    label: "Marketing emails",
    description: "Tips, best practices, and promotional content",
  },
];

export function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    preferences || defaultPreferences
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateNotificationPreferences(prefs);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Preferences saved");
      }
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {notificationOptions.map((option) => (
        <div
          key={option.id}
          className="flex items-center justify-between gap-4"
        >
          <div className="space-y-0.5">
            <Label htmlFor={option.id}>{option.label}</Label>
            <p className="text-sm text-muted-foreground">
              {option.description}
            </p>
          </div>
          <Switch
            id={option.id}
            checked={prefs[option.id as keyof NotificationPreferences]}
            onCheckedChange={() =>
              handleToggle(option.id as keyof NotificationPreferences)
            }
          />
        </div>
      ))}

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

After implementing this phase, verify:

- [ ] Settings layout loads with sidebar
- [ ] Profile page shows user info
- [ ] Avatar upload works
- [ ] Profile form saves changes
- [ ] Security page loads
- [ ] Password change works
- [ ] Agency settings page loads
- [ ] Team management shows members
- [ ] Notification preferences save correctly
- [ ] Navigation between settings pages works

---

## 📝 Notes

- Settings use server components with client forms
- Avatar storage requires Supabase storage bucket
- Password changes go through Supabase Auth
- Team features require proper RLS policies
- All forms use react-hook-form + zod validation
