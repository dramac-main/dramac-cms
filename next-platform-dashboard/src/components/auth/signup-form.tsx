"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { signup, resendConfirmationEmail } from "@/lib/actions/auth";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input, Button } from "@/components/ui";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      organizationName: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setError(null);
    setIsPending(true);

    try {
      const result = await signup(data);
      if (result?.error) {
        setError(result.error);
        setIsPending(false);
      } else if (result?.requiresEmailConfirmation) {
        setConfirmationEmail(result.email || data.email);
        setIsPending(false);
      } else if (result?.success) {
        setConfirmationEmail(data.email);
        setIsPending(false);
      }
    } catch (_err) {
      setError("An unexpected error occurred");
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    if (!confirmationEmail || resendStatus === "sending") return;
    setResendStatus("sending");

    try {
      const result = await resendConfirmationEmail(confirmationEmail);
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

  // Show email confirmation screen after successful signup
  if (confirmationEmail) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to
          </p>
          <p className="font-medium">{confirmationEmail}</p>
        </div>

        <p className="text-sm text-muted-foreground">
          Click the link in the email to activate your account, then you can
          sign in.
        </p>

        {error && (
          <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={resendStatus === "sending" || resendStatus === "sent"}
          >
            {resendStatus === "sending" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {resendStatus === "sent"
              ? "Email sent! Check your inbox"
              : "Resend confirmation email"}
          </Button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your full name"
                  autoComplete="name"
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
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agency name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your Agency"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This is your agency or business name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                At least 8 characters with uppercase, lowercase, and numbers
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
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
          Create account
        </Button>
      </form>
    </Form>
  );
}
