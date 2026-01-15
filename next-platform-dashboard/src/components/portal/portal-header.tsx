"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { stopImpersonatingClient } from "@/lib/actions/clients";
import { toast } from "sonner";

interface PortalHeaderProps {
  clientName: string;
  isImpersonating?: boolean;
  impersonatorEmail?: string;
}

export function PortalHeader({ clientName, isImpersonating, impersonatorEmail }: PortalHeaderProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleExitImpersonation = async () => {
    setIsExiting(true);
    try {
      await stopImpersonatingClient();
      toast.success("Exited client view");
      router.push("/dashboard");
    } catch (_error) {
      toast.error("Failed to exit client view");
    } finally {
      setIsExiting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {isImpersonating && (
        <div className="bg-primary text-primary-foreground px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm">
                Viewing as <strong>{clientName}</strong>
                {impersonatorEmail && (
                  <span className="opacity-75"> • Logged in as {impersonatorEmail}</span>
                )}
              </span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleExitImpersonation}
              disabled={isExiting}
            >
              {isExiting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Exit Client View
            </Button>
          </div>
        </div>
      )}
      
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="font-bold text-xl">
            DRAMAC
          </Link>
          <Badge variant="secondary">Client Portal</Badge>
        </div>

        <nav className="flex items-center gap-4">
          <Link href="/portal" className="text-sm font-medium hover:underline">
            My Sites
          </Link>
          <Link href="/portal/support" className="text-sm font-medium hover:underline">
            Support
          </Link>
        </nav>
      </div>
    </header>
  );
}
