"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, resendConfirmationEmail } from "@/lib/actions/auth";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input, Button } from "@/components/ui";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">(
    "idle",
  );
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setEmailNotConfirmed(false);
    setIsPending(true);

    try {
      const result = await login(data, redirectTo);
      if (result?.error) {
        // Detect Supabase "Email not confirmed" error and show friendly UI
        if (result.error.toLowerCase().includes("email not confirmed")) {
          setEmailNotConfirmed(true);
        } else {
          setError(result.error);
        }
        setIsPending(false);
      } else if (result?.redirectTo) {
        router.push(result.redirectTo);
      }
    } catch (_err) {
      setError("An unexpected error occurred");
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    const email = form.getValues("email");
    if (!email || resendStatus === "sending") return;
    setResendStatus("sending");

    try {
      const result = await resendConfirmationEmail(email);
      if (result?.error) {
        setError(result.error);
        setResendStatus("idle");
      } else {
        setResendStatus("sent");
        setTimeout(() => setResendStatus("idle"), 30000);
      }
    } catch {
      setError("Failed to resend email");
      setResendStatus("idle");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {emailNotConfirmed && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Please confirm your email
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Check your inbox for a confirmation link. You need to verify
                  your email before signing in.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={
                    resendStatus === "sending" || resendStatus === "sent"
                  }
                  className="mt-1"
                >
                  {resendStatus === "sending" && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  {resendStatus === "sent"
                    ? "Email sent!"
                    : "Resend confirmation email"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </Form>
  );
}
