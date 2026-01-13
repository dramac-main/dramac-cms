"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNavigation, bottomNavigation, type NavGroup, type NavItem } from "@/config/navigation";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex h-screen flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">D</span>
              </div>
              <span className="font-semibold text-lg">DRAMAC</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(collapsed && "mx-auto")}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <TooltipProvider delayDuration={0}>
            {mainNavigation.map((group, groupIndex) => (
              <NavGroupComponent
                key={groupIndex}
                group={group}
                collapsed={collapsed}
                pathname={pathname}
              />
            ))}
          </TooltipProvider>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t py-4">
          <TooltipProvider delayDuration={0}>
            {bottomNavigation.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                collapsed={collapsed}
                pathname={pathname}
              />
            ))}
          </TooltipProvider>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">D</span>
              </div>
              <span className="font-semibold text-lg">DRAMAC</span>
            </Link>
          </div>
          <nav className="py-4">
            {mainNavigation.map((group, groupIndex) => (
              <NavGroupComponent
                key={groupIndex}
                group={group}
                collapsed={false}
                pathname={pathname}
              />
            ))}
          </nav>
          <div className="border-t py-4">
            {bottomNavigation.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                collapsed={false}
                pathname={pathname}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function NavGroupComponent({
  group,
  collapsed,
  pathname,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
}) {
  return (
    <div className="mb-4">
      {group.title && !collapsed && (
        <h4 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {group.title}
        </h4>
      )}
      {group.items.map((item) => (
        <NavItemComponent
          key={item.href}
          item={item}
          collapsed={collapsed}
          pathname={pathname}
        />
      ))}
    </div>
  );
}

function NavItemComponent({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const content = (
    <Link
      href={item.disabled ? "#" : item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        collapsed ? "mx-2 justify-center" : "mx-2",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        item.disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
