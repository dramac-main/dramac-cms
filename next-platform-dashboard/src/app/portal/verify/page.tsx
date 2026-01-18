"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getPortalUser } from "@/lib/portal/portal-auth";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        // The Supabase client automatically handles the hash fragment
        // from the magic link when the page loads
        const supabase = createClient();
        
        // Check for error in URL params
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        
        if (errorParam) {
          setStatus("error");
          setError(errorDescription || "Authentication failed");
          return;
        }

        // Get the session - Supabase handles the token exchange automatically
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // Try to exchange the token if present in hash
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
          
          if (exchangeError) {
            setStatus("error");
            setError("Invalid or expired link. Please request a new one.");
            return;
          }
        }

        // Verify the user is a portal client
        const portalUser = await getPortalUser();
        
        if (!portalUser) {
          setStatus("error");
          setError("Portal access not enabled for this account");
          await supabase.auth.signOut();
          return;
        }

        setStatus("success");
        
        // Redirect after a brief delay to show success message
        setTimeout(() => {
          router.push("/portal");
          router.refresh();
        }, 1500);
        
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setError("An error occurred during verification");
      }
    };

    verifySession();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          {status === "verifying" && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <h2 className="text-xl font-bold">Verifying...</h2>
              <p className="text-muted-foreground mt-2">
                Please wait while we log you in
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Welcome back!</h2>
              <p className="text-muted-foreground mt-2">
                Redirecting to your portal...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-xl font-bold">Verification Failed</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button 
                className="mt-6" 
                onClick={() => router.push("/portal/login")}
              >
                Back to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
