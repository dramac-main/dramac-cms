"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-context";
import { mainNavigation, bottomNavigation, adminNavigation, type NavGroup, type NavItem } from "@/config/navigation";

interface SidebarProps {
  className?: string;
  isSuperAdmin?: boolean;
}

// Animation variants
const sidebarVariants = {
  expanded: { width: 256 },
  collapsed: { width: 64 },
};

const contentVariants = {
  visible: { opacity: 1, x: 0 },
  hidden: { opacity: 0, x: -10 },
};

const logoTextVariants = {
  visible: { opacity: 1, width: "auto" },
  hidden: { opacity: 0, width: 0 },
};

export function Sidebar({ className, isSuperAdmin = false }: SidebarProps) {
  const { collapsed, toggle, mobileOpen, setMobileOpen, closeMobile } = useSidebar();
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <TooltipProvider delayDuration={0}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-3">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 overflow-hidden"
          onClick={closeMobile}
        >
          <motion.div 
            className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg font-bold text-primary-foreground">D</span>
          </motion.div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={logoTextVariants}
                className="font-semibold text-lg whitespace-nowrap overflow-hidden"
              >
                DRAMAC
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        
        {/* Desktop collapse button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className={cn(
            "hidden lg:flex h-8 w-8 shrink-0",
            collapsed && "mx-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </Button>

        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={closeMobile}
          className="lg:hidden h-8 w-8"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {mainNavigation.map((group, groupIndex) => (
          <NavGroupComponent
            key={groupIndex}
            group={group}
            collapsed={collapsed}
            pathname={pathname}
            onItemClick={closeMobile}
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t py-4">
        {/* Admin Panel link - only for super admins */}
        {isSuperAdmin && (
          <NavItemComponent
            item={adminNavigation}
            collapsed={collapsed}
            pathname={pathname}
            onItemClick={closeMobile}
          />
        )}
        {bottomNavigation.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
            onItemClick={closeMobile}
          />
        ))}
      </div>
    </TooltipProvider>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        data-tour="sidebar"
        initial={false}
        animate={collapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "hidden lg:flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground",
          className
        )}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Trigger */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden fixed top-4 left-4 z-40"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={closeMobile}
              aria-hidden="true"
            />
            
            {/* Sidebar Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-sidebar text-sidebar-foreground border-r shadow-xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavGroupComponent({
  group,
  collapsed,
  pathname,
  onItemClick,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
  onItemClick?: () => void;
}) {
  return (
    <div className="mb-4">
      <AnimatePresence mode="wait">
        {group.title && !collapsed && (
          <motion.h4
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={contentVariants}
            transition={{ duration: 0.15 }}
            className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50"
          >
            {group.title}
          </motion.h4>
        )}
      </AnimatePresence>
      {collapsed && group.title && (
        <div className="mx-2 my-2 h-px bg-sidebar-border" aria-hidden="true" />
      )}
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}

function NavItemComponent({
  item,
  collapsed,
  pathname,
  onItemClick,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  onItemClick?: () => void;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const content = (
    <Link
      href={item.disabled ? "#" : item.href}
      data-tour={item.dataTour}
      onClick={(e) => {
        if (item.disabled) {
          e.preventDefault();
          return;
        }
        onItemClick?.();
      }}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        collapsed ? "mx-2 justify-center" : "mx-2",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        item.disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Icon 
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-150",
          !isActive && "group-hover:scale-110"
        )} 
      />
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={contentVariants}
            transition={{ duration: 0.15 }}
            className="flex flex-1 items-center justify-between overflow-hidden"
          >
            <span className="truncate">{item.title}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-sidebar-primary/10 px-2 py-0.5 text-xs font-medium text-sidebar-primary">
                {item.badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.title}
          {item.badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
