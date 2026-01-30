"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LogOut, 
  Settings, 
  User, 
  CreditCard, 
  HelpCircle,
  Keyboard,
  Search,
  Command,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Breadcrumbs } from "./breadcrumbs";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";
import { useScrollDirection, useIsScrolled } from "@/hooks/use-scroll-direction";
import { useBreakpointDown } from "@/hooks/use-media-query";

interface HeaderProps {
  /** Whether to show breadcrumbs */
  showBreadcrumbs?: boolean;
  /** Custom breadcrumb items */
  breadcrumbItems?: Array<{ label: string; href: string; isCurrent?: boolean }>;
  /** Additional class name */
  className?: string;
  /** Enable auto-hide on scroll (mobile only) */
  autoHide?: boolean;
  /** Threshold in pixels before auto-hide kicks in */
  autoHideThreshold?: number;
}

export function Header({ 
  showBreadcrumbs = true, 
  breadcrumbItems,
  className,
  autoHide = true,
  autoHideThreshold = 100,
}: HeaderProps) {
  const { user, profile } = useAuth();
  const { collapsed, setMobileOpen } = useSidebar();
  const scrollDirection = useScrollDirection({ threshold: 10 });
  const isScrolled = useIsScrolled(autoHideThreshold);
  const isMobile = useBreakpointDown("md");

  // Determine if header should be hidden (only on mobile when scrolling down past threshold)
  const shouldHide = autoHide && isMobile && scrollDirection === "down" && isScrolled;

  // Generate initials from profile name, with better fallback handling
  const getInitials = () => {
    if (profile?.name) {
      const parts = profile.name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        // First and last name: "Drake Machi" -> "DM"
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.length === 1) {
        // Single name: take first 2 chars
        return parts[0].substring(0, 2).toUpperCase();
      }
    }
    // Fallback to email or "U"
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  const initials = getInitials();

  return (
    <header 
      className={cn(
        // Base styles with mobile-optimized height
        "sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6",
        // Height: smaller on mobile for more content space
        "h-14 md:h-16",
        // Auto-hide transition
        "transition-transform duration-300 ease-in-out",
        shouldHide && "-translate-y-full",
        // Shadow when scrolled
        isScrolled && "shadow-sm",
        className
      )}
    >
      {/* Left side - mobile menu button + breadcrumbs */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 -ml-2 touch-manipulation"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {showBreadcrumbs && (
          <Breadcrumbs 
            items={breadcrumbItems} 
            className="hidden sm:flex"
          />
        )}
      </div>

      {/* Right side - actions with improved touch targets */}
      <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
        {/* Search button - larger touch target on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 touch-manipulation"
          aria-label="Search"
          title="Search (⌘K)"
        >
          <Search className="h-5 w-5 md:h-4 md:w-4" />
        </Button>

        {/* Theme Switch */}
        <ThemeSwitch />

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu - improved touch target */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-10 w-10 rounded-full ml-0.5 md:ml-1 touch-manipulation"
            >
              <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-transparent hover:border-primary/20 transition-colors">
                <AvatarImage 
                  src={profile?.avatar_url || undefined} 
                  alt={profile?.name || "User"} 
                />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={profile?.avatar_url || undefined} 
                    alt={profile?.name || "User"} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {profile?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/billing" className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/support" className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Keyboard className="mr-2 h-4 w-4" />
                Keyboard shortcuts
                <span className="ml-auto text-xs text-muted-foreground">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
