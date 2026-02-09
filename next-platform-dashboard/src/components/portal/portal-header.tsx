"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Eye, Loader2, Bell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { stopImpersonatingClient } from "@/lib/actions/clients";
import { portalSignOut } from "@/lib/portal/portal-auth";
import { useBrandingOptional } from "@/components/providers/branding-provider";
import { toast } from "sonner";
import Image from "next/image";
import type { PortalUser } from "@/lib/portal/portal-auth";

interface PortalHeaderProps {
  // Legacy props for backward compatibility
  clientName?: string;
  isImpersonating?: boolean;
  impersonatorEmail?: string;
  // New props for real auth
  user?: PortalUser;
  agencyName?: string;
  unreadNotifications?: number;
}

export function PortalHeader({ 
  clientName, 
  isImpersonating, 
  impersonatorEmail,
  user,
  agencyName,
  unreadNotifications = 0,
}: PortalHeaderProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get display name from either legacy or new props
  const branding = useBrandingOptional();
  const displayName = user?.fullName || clientName || "Client";
  const displayAgencyName = branding?.getDisplayName() || agencyName || "Your Agency";
  const agencyLogoUrl = branding?.getLogoUrl();

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await portalSignOut();
    } catch (_error) {
      toast.error("Failed to log out");
      setIsLoggingOut(false);
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
                Viewing as <strong>{displayName}</strong>
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
          <Link href="/portal" className="flex items-center gap-2 font-bold text-xl">
            {agencyLogoUrl && (
              <Image src={agencyLogoUrl} alt={displayAgencyName} width={28} height={28} className="h-7 w-7 object-contain" />
            )}
            {displayAgencyName}
          </Link>
          <Badge variant="secondary">Client Portal</Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/portal" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/portal/sites" className="text-sm font-medium hover:text-primary transition-colors">
              Sites
            </Link>
            <Link href="/portal/support" className="text-sm font-medium hover:text-primary transition-colors">
              Support
            </Link>
          </nav>

          {/* Notifications */}
          {!isImpersonating && (
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/portal/notifications">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {/* User Menu */}
          {!isImpersonating && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/portal/settings" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  className="text-destructive cursor-pointer"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
