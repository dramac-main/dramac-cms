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
