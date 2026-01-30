"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";

export interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  badge?: React.ReactNode;
  divider?: boolean;
  required?: boolean;
}

export function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  contentClassName,
  collapsible = false,
  defaultCollapsed = false,
  badge,
  divider = true,
  required = false,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(!defaultCollapsed);

  const headerContent = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 p-2 rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold leading-none flex items-center gap-2">
            {title}
            {required && (
              <span className="text-danger text-sm">*</span>
            )}
            {badge && (
              <span className="ml-1">{badge}</span>
            )}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {collapsible && (
        <CollapsibleTrigger className="rounded-md p-1 hover:bg-muted transition-colors">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
          <span className="sr-only">{isOpen ? "Collapse" : "Expand"} section</span>
        </CollapsibleTrigger>
      )}
    </div>
  );

  const content = (
    <div className={cn("mt-4 space-y-4", contentClassName)}>
      {children}
    </div>
  );

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn(
          "py-6",
          divider && "border-b border-border",
          className
        )}>
          {headerContent}
          <CollapsibleContent>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {content}
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className={cn(
      "py-6",
      divider && "border-b border-border",
      className
    )}>
      {headerContent}
      {content}
    </div>
  );
}

// Simplified section for card-style forms
export interface FormCardSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function FormCardSection({
  title,
  description,
  children,
  className,
  actions,
}: FormCardSectionProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-6",
      className
    )}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
