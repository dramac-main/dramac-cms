"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopImpersonation } from "@/lib/actions/admin";

interface ImpersonationBannerProps {
  userName: string;
  userEmail?: string;
}

export function ImpersonationBanner({ userName, userEmail }: ImpersonationBannerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStopImpersonation = async () => {
    setIsLoading(true);
    try {
      const result = await stopImpersonation();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Impersonation ended");
        router.push("/admin/users");
        router.refresh();
      }
    } catch {
      toast.error("Failed to stop impersonation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="text-sm">
            You are viewing as <strong>{userName}</strong>
            {userEmail && (
              <span className="opacity-75 ml-1">({userEmail})</span>
            )}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStopImpersonation}
          disabled={isLoading}
          className="text-white hover:text-white hover:bg-white/20 h-7 px-2"
        >
          <X className="w-4 h-4 mr-1" />
          Stop Impersonation
        </Button>
      </div>
    </div>
  );
}
