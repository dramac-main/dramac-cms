import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";
import Link from "next/link";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Login | ${PLATFORM.name}`,
  description: "Sign in to your account",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirect?: string; error?: string }>;
}) {
  const params = await searchParams;

  // Map auth callback error codes to user-friendly messages
  const errorMessage = params.error
    ? params.error === "auth_callback_error"
      ? "Your sign-in link has expired. Please log in with your password or request a new link."
      : "An authentication error occurred. Please try again."
    : null;
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
            {errorMessage}
          </div>
        )}

        {params.message && (
          <div className="rounded-md bg-success/10 p-4 text-sm text-success">
            {params.message}
          </div>
        )}

        <LoginForm redirectTo={params.redirect} />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
