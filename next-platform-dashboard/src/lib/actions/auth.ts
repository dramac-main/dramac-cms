"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginFormData,
  type SignupFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";

export async function login(formData: LoginFormData, redirectTo?: string) {
  const validated = loginSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data" };
  }

  const supabase = await createClient();

  const { error, data: authData } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check onboarding status to avoid double-redirect through middleware
  if (authData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", authData.user.id)
      .single();

    if (!profile?.onboarding_completed) {
      redirect("/onboarding");
    }
  }

  redirect(redirectTo || "/dashboard");
}

export async function signup(formData: SignupFormData) {
  const validated = signupSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data", details: validated.error.flatten() };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const headersList = await headers();
  const origin = headersList.get("origin");

  // 1. Create the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        name: validated.data.name,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user" };
  }

  // Supabase returns a fake user with empty identities when the email already exists
  // (to prevent email enumeration). Detect this and show a user-friendly message.
  if (!authData.user.identities || authData.user.identities.length === 0) {
    return {
      error:
        "An account with this email already exists. Please sign in instead.",
    };
  }

  // 2. Create user profile FIRST (agencies.owner_id has FK to profiles)
  const { error: profileError } = await adminClient.from("profiles").insert({
    id: authData.user.id,
    email: validated.data.email,
    name: validated.data.name,
    role: "admin",
    onboarding_completed: false,
  });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: "Failed to create user profile" };
  }

  // Generate slug from organization name
  const slug =
    validated.data.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 30) +
    "-" +
    Date.now().toString(36);

  // 3. Create organization using admin client (bypasses RLS)
  const { data: org, error: orgError } = await adminClient
    .from("agencies")
    .insert({
      name: validated.data.organizationName,
      slug: slug,
      owner_id: authData.user.id,
    })
    .select()
    .single();

  if (orgError) {
    console.error("Agency creation error:", orgError);
    await adminClient.from("profiles").delete().eq("id", authData.user.id);
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: `Failed to create organization: ${orgError.message}` };
  }

  // 4. Update profile with agency_id
  await adminClient
    .from("profiles")
    .update({ agency_id: org.id })
    .eq("id", authData.user.id);

  // 5. Create organization membership (tracks actual ownership) using admin client
  const { error: memberError } = await adminClient
    .from("agency_members")
    .insert({
      agency_id: org.id,
      user_id: authData.user.id,
      role: "owner",
    });

  if (memberError) {
    console.error("Member creation error:", memberError);
    await adminClient.from("profiles").delete().eq("id", authData.user.id);
    await adminClient.from("agencies").delete().eq("id", org.id);
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: "Failed to create organization membership" };
  }

  // Check if email confirmation is required
  if (authData.user.identities?.length === 0) {
    return {
      success: true,
      message: "Check your email to confirm your account",
    };
  }

  // Redirect to onboarding to complete profile setup
  redirect("/onboarding");
}

export async function forgotPassword(formData: ForgotPasswordFormData) {
  const validated = forgotPasswordSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid email address" };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(
    validated.data.email,
    {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    },
  );

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Check your email for the reset link" };
}

export async function resetPassword(formData: ResetPasswordFormData) {
  const validated = resetPasswordSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=Password updated successfully");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      organization:agencies(*)
    `,
    )
    .eq("id", user.id)
    .single();

  return { user, profile };
}
