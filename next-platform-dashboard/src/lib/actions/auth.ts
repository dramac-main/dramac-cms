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

export async function login(formData: LoginFormData) {
  const validated = loginSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
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

  // Generate slug from organization name
  const slug = validated.data.organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 30) + "-" + Date.now().toString(36);

  // 2. Create organization using admin client (bypasses RLS)
  // This is necessary because the user session is not yet available after signUp
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
    // Cleanup: delete the user if org creation fails
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: `Failed to create organization: ${orgError.message}` };
  }

  // 3. Create user profile using admin client
  // Agency creators get 'admin' role in profiles (which corresponds to agency_owner permissions)
  // The actual ownership is tracked in agency_members.role = "owner"
  // Only super_admin can access platform-wide admin features
  // Super admin role must be granted via scripts/create-super-admin.ts
  const { error: profileError } = await adminClient.from("profiles").insert({
    id: authData.user.id,
    email: validated.data.email,
    name: validated.data.name,
    role: "admin", // Agency creators are admins of their agency
    agency_id: org.id,
  });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    // Cleanup
    await adminClient.from("agencies").delete().eq("id", org.id);
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: "Failed to create user profile" };
  }

  // 4. Create organization membership (tracks actual ownership) using admin client
  const { error: memberError } = await adminClient.from("agency_members").insert({
    agency_id: org.id,
    user_id: authData.user.id,
    role: "owner", // Owner in agency_members table
  });

  if (memberError) {
    console.error("Member creation error:", memberError);
    // Cleanup
    await adminClient.from("profiles").delete().eq("id", authData.user.id);
    await adminClient.from("agencies").delete().eq("id", org.id);
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: "Failed to create organization membership" };
  }

  // Check if email confirmation is required
  if (authData.user.identities?.length === 0) {
    return { success: true, message: "Check your email to confirm your account" };
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

  const { error } = await supabase.auth.resetPasswordForEmail(validated.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

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
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      organization:agencies(*)
    `)
    .eq("id", user.id)
    .single();

  return { user, profile };
}
