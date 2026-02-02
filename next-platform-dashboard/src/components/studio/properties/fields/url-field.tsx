/**
 * DRAMAC Studio URL Field Editor
 * 
 * URL input with link preview option.
 */

"use client";

import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Link, ExternalLink, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldWrapper } from "../field-wrapper";
import type { FieldEditorProps, FieldDefinition } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface UrlFieldProps extends FieldEditorProps<string> {
  field: FieldDefinition;
}

// =============================================================================
// URL VALIDATION
// =============================================================================

function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty is valid
  if (url.startsWith("/")) return true; // Internal path
  if (url.startsWith("#")) return true; // Anchor
  if (url.startsWith("mailto:")) return true; // Email
  if (url.startsWith("tel:")) return true; // Phone
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UrlField({
  field,
  value,
  onChange,
  showResponsive,
  activeBreakpoint,
  onBreakpointChange,
  disabled,
}: UrlFieldProps) {
  const [touched, setTouched] = useState(false);
  const validateUrl = field.validateUrl !== false;
  
  const isValid = !validateUrl || isValidUrl(value || "");
  const showError = touched && !isValid;
  
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );
  
  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);
  
  const handleOpenLink = useCallback(() => {
    if (value && isValid) {
      window.open(value, "_blank", "noopener,noreferrer");
    }
  }, [value, isValid]);
  
  return (
    <FieldWrapper
      field={field}
      showResponsiveToggle={showResponsive && field.responsive}
      activeBreakpoint={activeBreakpoint}
      onBreakpointChange={onBreakpointChange}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <Link className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              value={value || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={field.placeholder || "https://..."}
              disabled={disabled}
              className={cn(
                "h-9 pl-8 pr-8",
                showError && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {showError && (
              <AlertCircle className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
            )}
          </div>
          
          {/* Open link button */}
          {value && isValid && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleOpenLink}
              title="Open link in new tab"
              disabled={disabled}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {showError && (
          <p className="text-xs text-destructive">
            Please enter a valid URL
          </p>
        )}
      </div>
    </FieldWrapper>
  );
}
