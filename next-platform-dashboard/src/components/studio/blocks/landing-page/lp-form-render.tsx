/**
 * LP Form Render Component
 *
 * Advanced lead capture form with 5 variants, all 11 field types,
 * conditional field visibility, client-side validation, honeypot spam
 * protection, and real API submission to /api/marketing/lp/submit.
 *
 * All colors use CSS custom properties for automatic site branding inheritance.
 * No dark: Tailwind variants — storefront is always light mode.
 *
 * @phase LPB-05 — Advanced Form System
 */
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { LPFormField } from "@/modules/marketing/types/lp-builder-types";

// ============================================================================
// Props
// ============================================================================

export interface LPFormProps {
  variant?: "inline" | "card" | "floating" | "slide-in" | "minimal";
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  submitButtonColor?: string;
  submitButtonStyle?: "solid" | "gradient" | "outline";
  submitButtonFullWidth?: boolean;
  successAction?: "message" | "redirect" | "close";
  successMessage?: string;
  successRedirectUrl?: string;
  createSubscriber?: boolean;
  subscriberTags?: string[];
  mailingListId?: string;
  sequenceId?: string;
  createCrmContact?: boolean;
  doubleOptIn?: boolean;
  gdprConsentText?: string;
  showGdprConsent?: boolean;
  enableHoneypot?: boolean;
  cardBackground?: string;
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  cardShadow?: "none" | "sm" | "md" | "lg" | "xl";
  direction?: "vertical" | "horizontal";
  columns?: number;
  rateLimitPerHour?: number;
  notifyOnSubmission?: boolean;
  notificationEmails?: string[];
  fields?: LPFormField[];
  /** Injected by runtime — site ID */
  _siteId?: string;
  /** Injected by runtime — landing page ID */
  _landingPageId?: string;
  /** Injected by runtime — Studio component ID */
  _componentId?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const borderRadiusMap: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

const shadowMap: Record<string, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

function shouldShowField(
  field: LPFormField,
  formData: Record<string, string>,
): boolean {
  if (!field.showWhen) return true;
  const { fieldId, operator, value } = field.showWhen;
  const currentValue = formData[fieldId] || "";

  switch (operator) {
    case "equals":
      return currentValue === value;
    case "not_equals":
      return currentValue !== value;
    case "contains":
      return currentValue.includes(value || "");
    case "not_empty":
      return currentValue.trim() !== "";
    default:
      return true;
  }
}

function validateField(
  field: LPFormField,
  value: string,
): string | null {
  if (field.required && !value.trim()) {
    return field.errorMessage || `${field.label} is required`;
  }
  if (
    field.type === "email" &&
    value &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  ) {
    return field.errorMessage || "Please enter a valid email address";
  }
  if (
    field.type === "phone" &&
    value &&
    !/^[+]?[\d\s()-]{7,20}$/.test(value)
  ) {
    return field.errorMessage || "Please enter a valid phone number";
  }
  if (field.pattern && value) {
    try {
      if (!new RegExp(field.pattern).test(value)) {
        return field.errorMessage || `${field.label} format is invalid`;
      }
    } catch {
      // invalid regex — skip validation
    }
  }
  return null;
}

function validateFields(
  fields: LPFormField[],
  formData: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!shouldShowField(field, formData)) continue;
    if (field.type === "hidden") continue;
    const error = validateField(field, formData[field.id] || "");
    if (error) errors[field.id] = error;
  }
  return errors;
}

function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ]) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

// ============================================================================
// Field Renderer
// ============================================================================

function FormField({
  field,
  value,
  error,
  onChange,
  hideLabel,
}: {
  field: LPFormField;
  value: string;
  error?: string;
  onChange: (id: string, value: string) => void;
  hideLabel?: boolean;
}) {
  const baseInputClass =
    "w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";
  const errorClass = error ? "border-red-500" : "border-input";

  if (field.type === "hidden") {
    return (
      <input
        type="hidden"
        name={field.id}
        value={field.defaultValue || ""}
      />
    );
  }

  return (
    <div>
      {!hideLabel && field.type !== "checkbox" && (
        <label className="block text-sm font-medium mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {field.type === "textarea" ? (
        <textarea
          placeholder={field.placeholder || field.label}
          required={field.required}
          rows={3}
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={`${baseInputClass} ${errorClass}`}
        />
      ) : field.type === "select" ? (
        <select
          required={field.required}
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={`${baseInputClass} ${errorClass}`}
        >
          <option value="">
            {field.placeholder || `Select ${field.label}`}
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value === "true"}
            required={field.required}
            onChange={(e) =>
              onChange(field.id, e.target.checked ? "true" : "false")
            }
            className="rounded"
          />
          <span className="text-sm">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
      ) : field.type === "radio" ? (
        <div>
          <span className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </span>
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : field.type === "date" ? (
        <input
          type="date"
          required={field.required}
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={`${baseInputClass} ${errorClass}`}
        />
      ) : field.type === "file" ? (
        <input
          type="file"
          required={field.required}
          onChange={(e) => {
            const file = e.target.files?.[0];
            onChange(field.id, file?.name || "");
          }}
          className={`${baseInputClass} ${errorClass}`}
        />
      ) : (
        <input
          type={field.type === "phone" ? "tel" : field.type || "text"}
          placeholder={field.placeholder || field.label}
          required={field.required}
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={`${baseInputClass} ${errorClass}`}
        />
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LPFormRender({
  variant = "card",
  title = "Get Started Today",
  subtitle = "",
  submitButtonText = "Submit",
  submitButtonColor,
  submitButtonStyle = "solid",
  submitButtonFullWidth = true,
  successAction = "message",
  successMessage = "Thank you! We'll be in touch soon.",
  successRedirectUrl,
  createSubscriber,
  subscriberTags,
  mailingListId,
  sequenceId,
  createCrmContact,
  doubleOptIn,
  gdprConsentText,
  showGdprConsent = false,
  enableHoneypot = true,
  cardBackground,
  cardBorderRadius = "lg",
  cardShadow = "lg",
  direction = "vertical",
  columns = 1,
  rateLimitPerHour,
  notifyOnSubmission,
  notificationEmails,
  fields,
  _siteId,
  _landingPageId,
  _componentId,
}: LPFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [gdprConsented, setGdprConsented] = useState(false);
  const loadTimeRef = useRef(Date.now());

  // Initialize default values
  const defaultFields: LPFormField[] = fields && fields.length > 0
    ? fields
    : [
        {
          id: "email",
          type: "email",
          label: "Email",
          placeholder: "Enter your email",
          required: true,
        },
      ];

  // Initialize form data with defaults on mount
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const field of defaultFields) {
      if (field.defaultValue) {
        initial[field.id] = field.defaultValue;
      }
    }
    if (Object.keys(initial).length > 0) {
      setFormData((prev) => ({ ...initial, ...prev }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFieldChange = useCallback((id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    setFieldErrors((prev) => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      // Client-side validation
      const errors = validateFields(defaultFields, formData);

      // GDPR consent check
      if (showGdprConsent && gdprConsentText && !gdprConsented) {
        errors["_gdpr"] = "You must agree to continue";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      // Honeypot check — if filled, silently "succeed" without submitting
      if (enableHoneypot && formData["_hp_field"]) {
        setSubmitted(true);
        return;
      }

      setIsSubmitting(true);

      try {
        const timeOnPage = Math.round(
          (Date.now() - loadTimeRef.current) / 1000,
        );

        const response = await fetch("/api/marketing/lp/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId: _siteId,
            landingPageId: _landingPageId,
            formComponentId: _componentId,
            data: formData,
            utm: getUtmParams(),
            referrer:
              typeof document !== "undefined" ? document.referrer : undefined,
            timeOnPage,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(
            err.error || "Submission failed. Please try again.",
          );
        }

        // Handle success
        switch (successAction) {
          case "redirect":
            if (successRedirectUrl) {
              window.location.href = successRedirectUrl;
            } else {
              setSubmitted(true);
            }
            break;
          case "message":
          case "close":
          default:
            setSubmitted(true);
            break;
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Something went wrong",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      defaultFields,
      formData,
      showGdprConsent,
      gdprConsentText,
      gdprConsented,
      enableHoneypot,
      _siteId,
      _landingPageId,
      _componentId,
      successAction,
      successRedirectUrl,
    ],
  );

  const isCard = variant === "card" || variant === "floating";

  // ── Success state ────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        className={`p-8 text-center ${isCard ? `${borderRadiusMap[cardBorderRadius]} ${shadowMap[cardShadow]}` : ""}`}
        style={{
          backgroundColor: isCard
            ? cardBackground || "var(--card, #ffffff)"
            : undefined,
        }}
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-green-100">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-lg font-medium">{successMessage}</p>
      </div>
    );
  }

  // ── Button styles ────────────────────────────────────────────
  const btnColor = submitButtonColor || "var(--primary, #2563eb)";
  const btnClasses = `px-8 py-3 rounded-lg font-semibold transition-all ${submitButtonFullWidth ? "w-full" : ""} ${
    submitButtonStyle === "outline"
      ? "border-2 bg-transparent"
      : "text-white shadow hover:opacity-90"
  }`;
  const btnStyles: React.CSSProperties =
    submitButtonStyle === "outline"
      ? { color: btnColor, borderColor: btnColor }
      : submitButtonStyle === "gradient"
        ? {
            background: `linear-gradient(135deg, ${btnColor}, ${btnColor}99)`,
          }
        : { backgroundColor: btnColor };

  // ── Visible fields ──────────────────────────────────────────
  const visibleFields = defaultFields.filter(
    (f) => f.type !== "hidden" && shouldShowField(f, formData),
  );
  const hiddenFields = defaultFields.filter((f) => f.type === "hidden");

  // ── Minimal variant (single-line email + button) ──────────
  if (variant === "minimal") {
    const emailField = defaultFields.find((f) => f.type === "email") ||
      defaultFields[0];
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1 w-full">
            <input
              type={emailField?.type === "email" ? "email" : "text"}
              placeholder={
                emailField?.placeholder || emailField?.label || "Enter your email"
              }
              required={emailField?.required}
              value={formData[emailField?.id || "email"] || ""}
              onChange={(e) =>
                handleFieldChange(emailField?.id || "email", e.target.value)
              }
              className="w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            {fieldErrors[emailField?.id || "email"] && (
              <p className="mt-1 text-sm text-red-500">
                {fieldErrors[emailField?.id || "email"]}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all shadow hover:opacity-90 whitespace-nowrap ${isSubmitting ? "opacity-60" : ""}`}
            style={{ backgroundColor: btnColor }}
          >
            {isSubmitting ? "Submitting..." : submitButtonText}
          </button>
        </div>
        {/* Honeypot */}
        {enableHoneypot && (
          <div
            style={{ position: "absolute", left: "-9999px" }}
            aria-hidden="true"
          >
            <input
              type="text"
              name="_hp_field"
              tabIndex={-1}
              autoComplete="off"
              value={formData["_hp_field"] || ""}
              onChange={(e) => handleFieldChange("_hp_field", e.target.value)}
            />
          </div>
        )}
        {hiddenFields.map((f) => (
          <input
            key={f.id}
            type="hidden"
            name={f.id}
            value={f.defaultValue || ""}
          />
        ))}
        {submitError && (
          <p className="mt-2 text-sm text-red-500">{submitError}</p>
        )}
      </form>
    );
  }

  // ── Full form content ────────────────────────────────────────
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {title && (
        <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {subtitle}
        </p>
      )}

      <div
        className={
          direction === "horizontal"
            ? "flex flex-wrap gap-3 items-end"
            : "space-y-4"
        }
        style={
          direction === "vertical" && columns > 1
            ? {
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)`,
                gap: "1rem",
              }
            : undefined
        }
      >
        {visibleFields.map((field) => (
          <div
            key={field.id}
            className={direction === "horizontal" ? "flex-1 min-w-[200px]" : ""}
            style={
              field.width && direction === "vertical" && columns > 1
                ? { gridColumn: `span ${Math.min(field.width, columns)}` }
                : undefined
            }
          >
            <FormField
              field={field}
              value={formData[field.id] || ""}
              error={fieldErrors[field.id]}
              onChange={handleFieldChange}
            />
          </div>
        ))}
      </div>

      {/* Hidden fields */}
      {hiddenFields.map((f) => (
        <input
          key={f.id}
          type="hidden"
          name={f.id}
          value={f.defaultValue || ""}
        />
      ))}

      {/* Honeypot field */}
      {enableHoneypot && (
        <div
          style={{ position: "absolute", left: "-9999px" }}
          aria-hidden="true"
        >
          <input
            type="text"
            name="_hp_field"
            tabIndex={-1}
            autoComplete="off"
            value={formData["_hp_field"] || ""}
            onChange={(e) => handleFieldChange("_hp_field", e.target.value)}
          />
        </div>
      )}

      {/* GDPR Consent */}
      {showGdprConsent && gdprConsentText && (
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={gdprConsented}
            onChange={(e) => setGdprConsented(e.target.checked)}
            className="mt-1 rounded"
          />
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {gdprConsentText}
          </span>
        </label>
      )}
      {fieldErrors["_gdpr"] && (
        <p className="text-sm text-red-500">{fieldErrors["_gdpr"]}</p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`${btnClasses} ${isSubmitting ? "opacity-60" : ""}`}
        style={btnStyles}
      >
        {isSubmitting ? "Submitting..." : submitButtonText}
      </button>

      {/* Error message */}
      {submitError && (
        <p className="text-sm text-red-500">{submitError}</p>
      )}

      {/* Privacy note */}
      <p
        className="text-xs text-center"
        style={{ color: "var(--muted-foreground)" }}
      >
        We respect your privacy.
      </p>
    </form>
  );

  // ── Wrap in card if needed ──────────────────────────────────
  if (isCard) {
    return (
      <div
        className={`p-6 sm:p-8 ${borderRadiusMap[cardBorderRadius]} ${shadowMap[cardShadow]} ${variant === "floating" ? "shadow-2xl" : ""}`}
        style={{
          backgroundColor: cardBackground || "var(--card, #ffffff)",
          position: "relative",
        }}
      >
        {formContent}
      </div>
    );
  }

  return formContent;
}
