import { redirect } from "next/navigation";
import Link from "next/link";
import { CircleX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Portal magic-link verify — SERVER component.
 *
 * The link in the email points here with `?token_hash=...&type=magiclink&next=/portal`
 * (see `generatePortalMagicLink` in `@/lib/portal/portal-activation`). We call
 * `verifyOtp({ token_hash, type })` server-side via the SSR client so the
 * session cookies are set HTTP-only on this same origin and we skip the PKCE
 * `code_verifier` requirement entirely (which is what was breaking the prior
 * implementation — admin-generated links never have a matching verifier on
 * the client's browser).
 *
 * On success: redirect to `next` (defaults to `/portal`).
 * On failure: render the error card with a "Back to Login" action.
 */

export const dynamic = "force-dynamic";

type SearchParams = {
  token_hash?: string;
  type?: string;
  next?: string;
  error?: string;
  error_description?: string;
  // Legacy hash-based callbacks might arrive with these; we surface a generic
  // error since we can't parse hash fragments server-side.
  code?: string;
};

function sanitizeNext(value: string | undefined): string {
  if (!value) return "/portal";
  // Only allow same-origin relative paths that point into the portal.
  if (!value.startsWith("/")) return "/portal";
  if (value.startsWith("//")) return "/portal";
  if (!value.startsWith("/portal")) return "/portal";
  return value;
}

async function VerifyError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CircleX className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Verification Failed</h2>
          <p className="text-muted-foreground mt-2">{message}</p>
          <Button asChild className="mt-6">
            <Link href="/portal/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  if (params.error) {
    return (
      <VerifyError
        message={params.error_description || "Authentication failed"}
      />
    );
  }

  const tokenHash = params.token_hash;
  const type = params.type;
  const next = sanitizeNext(params.next);

  if (!tokenHash || !type) {
    // If the user landed here from a legacy action_link (hash-fragment flow),
    // a client-side bootstrap can still try to complete the session. But for
    // our PKCE-safe flow this should never be missing — show a clear error.
    return (
      <VerifyError message="Invalid or expired link. Please request a new one." />
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as "magiclink" | "signup" | "recovery" | "invite" | "email",
    token_hash: tokenHash,
  });

  if (error) {
    console.error("[portal/verify] verifyOtp error:", error);
    return (
      <VerifyError message="Invalid or expired link. Please request a new one." />
    );
  }

  // Verify portal linkage exists and self-heal agency_id metadata if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const admin = createAdminClient();
    const { data: client } = await admin
      .from("clients")
      .select("id, portal_user_id, has_portal_access")
      .eq("portal_user_id", user.id)
      .eq("has_portal_access", true)
      .maybeSingle();

    if (!client) {
      // Try to link by email in case portal_user_id wasn't set yet.
      if (user.email) {
        const { data: byEmail } = await admin
          .from("clients")
          .select("id")
          .eq("email", user.email.toLowerCase())
          .eq("has_portal_access", true)
          .maybeSingle();
        if (byEmail) {
          await admin
            .from("clients")
            .update({ portal_user_id: user.id })
            .eq("id", byEmail.id);
        } else {
          await supabase.auth.signOut();
          return (
            <VerifyError message="Portal access not enabled for this account." />
          );
        }
      }
    }
  }

  redirect(next);
}

