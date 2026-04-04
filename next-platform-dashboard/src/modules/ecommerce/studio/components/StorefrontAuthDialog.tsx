/**
 * StorefrontAuthDialog - Login / Register modal for storefront customers
 *
 * Shopify-style simplicity:
 * - Sign In: email + password
 * - Create Account: email + first name + last name + password
 * - Set Password: for post-checkout account upgrade (triggered from outside)
 *
 * Usage:
 *   Rendered by StorefrontAuthProvider automatically when authDialogOpen is true.
 *   Trigger it with: const { openAuthDialog } = useStorefrontAuth()
 */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Loader2, Mail, Lock, Eye, EyeOff, ShoppingBag } from "lucide-react";
import { useStorefrontAuth } from "../../context/storefront-auth-context";

// ============================================================================
// TYPES
// ============================================================================

type DialogMode = "login" | "register" | "set-password";

interface StorefrontAuthDialogProps {
  /** Initial mode; if provided overrides the context authDialogMode */
  mode?: DialogMode;
  /** Called after successful auth */
  onSuccess?: () => void;
  /** Called when dialog closes */
  onClose?: () => void;
  /** Email pre-filled (e.g. from checkout) */
  prefillEmail?: string;
  /** Token of guest session to upgrade (for set-password flow) */
  guestToken?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function InputField({
  id,
  label,
  type: initialType = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = initialType === "password";
  const type = isPassword ? (showPassword ? "text" : "password") : initialType;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground pr-10"
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================================
// SUB-FORMS
// ============================================================================

function LoginForm({
  prefillEmail,
  onSuccess,
}: {
  prefillEmail?: string;
  onSuccess: () => void;
}) {
  const { login, requestMagicLink } = useStorefrontAuth();
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await requestMagicLink(email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setResetSent(true);
    }
  };

  if (forgotMode) {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        {resetSent ? (
          <div className="rounded-md bg-success/10 border border-success/20 px-4 py-3 text-center">
            <Mail className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              Check your email
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent
              a login link. Check your inbox and spam folder.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Enter your email and we&apos;ll send you a link to sign in.
            </p>
            <InputField
              id="forgot-email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 min-h-11 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Login Link
            </button>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={() => {
              setForgotMode(false);
              setError("");
              setResetSent(false);
            }}
          >
            Back to Sign In
          </button>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        id="login-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        disabled={loading}
      />
      <InputField
        id="login-password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        autoComplete="current-password"
        disabled={loading}
      />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2.5 min-h-11 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign In
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Forgot your password?{" "}
        <button
          type="button"
          className="text-primary hover:underline font-medium"
          onClick={() => {
            setForgotMode(true);
            setError("");
          }}
        >
          Get a login link
        </button>
      </p>
    </form>
  );
}

function RegisterForm({
  prefillEmail,
  onSuccess,
}: {
  prefillEmail?: string;
  onSuccess: () => void;
}) {
  const { register } = useStorefrontAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must include at least one uppercase letter and one number.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await register(
      email,
      password,
      firstName || undefined,
      lastName || undefined,
    );
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InputField
          id="reg-first"
          label="First Name"
          value={firstName}
          onChange={setFirstName}
          placeholder="Jane"
          autoComplete="given-name"
          disabled={loading}
        />
        <InputField
          id="reg-last"
          label="Last Name"
          value={lastName}
          onChange={setLastName}
          placeholder="Smith"
          autoComplete="family-name"
          disabled={loading}
        />
      </div>
      <InputField
        id="reg-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        disabled={loading}
      />
      <InputField
        id="reg-password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        disabled={loading}
      />
      <p className="text-xs text-muted-foreground -mt-2">
        Must be 8+ characters with at least one uppercase letter and one number.
      </p>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2.5 min-h-11 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Create Account
      </button>
    </form>
  );
}

function SetPasswordForm({
  prefillEmail,
  guestToken: _guestToken,
  onSuccess,
}: {
  prefillEmail?: string;
  guestToken?: string;
  onSuccess: () => void;
}) {
  const { setPassword } = useStorefrontAuth();
  const [password, setPasswordVal] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await setPassword(password, prefillEmail);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {prefillEmail && (
        <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          Setting password for <strong>{prefillEmail}</strong>
        </div>
      )}
      <InputField
        id="sp-password"
        label="New Password"
        type="password"
        value={password}
        onChange={setPasswordVal}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        disabled={loading}
      />
      <InputField
        id="sp-confirm"
        label="Confirm Password"
        type="password"
        value={confirm}
        onChange={setConfirm}
        placeholder="Repeat your password"
        autoComplete="new-password"
        disabled={loading}
      />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2.5 min-h-11 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Set Password &amp; Save Account
      </button>
    </form>
  );
}

// ============================================================================
// DIALOG
// ============================================================================

export function StorefrontAuthDialog({
  mode: propMode,
  onSuccess,
  onClose,
  prefillEmail,
  guestToken,
}: StorefrontAuthDialogProps) {
  const { authDialogOpen, authDialogMode, closeAuthDialog } =
    useStorefrontAuth();

  const resolvedMode: DialogMode = propMode || authDialogMode;
  const [activeMode, setActiveMode] = useState<DialogMode>(resolvedMode);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keep active mode in sync when external prop/context changes
  React.useEffect(() => {
    setActiveMode(propMode || authDialogMode);
  }, [propMode, authDialogMode]);

  const isOpen = propMode !== undefined ? true : authDialogOpen;

  const handleClose = () => {
    if (onClose) onClose();
    else closeAuthDialog();
  };

  const handleSuccess = () => {
    handleClose();
    if (onSuccess) onSuccess();
  };

  // --- Focus management (hooks must be before early return) ---

  // Auto-focus first input when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const firstInput = dialogRef.current?.querySelector<HTMLInputElement>(
        "input:not([disabled])",
      );
      firstInput?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [activeMode, isOpen]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, isOpen]);

  if (!isOpen) return null;

  const titles: Record<DialogMode, string> = {
    login: "Sign In",
    register: "Create Store Account",
    "set-password": "Save Your Account",
  };

  const subtitles: Record<DialogMode, string> = {
    login: "Welcome back! Sign in to your store account.",
    register: "Create a free account to manage orders, quotes & more.",
    "set-password": "Set a password to access your account anytime.",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={titles[activeMode]}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card p-6 shadow-2xl border border-border"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-md p-1 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header icons */}
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            {activeMode === "login" && (
              <Lock className="h-5 w-5 text-primary" />
            )}
            {activeMode === "register" && (
              <ShoppingBag className="h-5 w-5 text-primary" />
            )}
            {activeMode === "set-password" && (
              <Mail className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {titles[activeMode]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {subtitles[activeMode]}
            </p>
          </div>
        </div>

        {/* Tabs for login / register (not for set-password) */}
        {activeMode !== "set-password" && (
          <div className="mb-5 flex rounded-lg bg-muted p-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === "login"}
              onClick={() => setActiveMode("login")}
              className={`flex-1 rounded-md px-3 py-2 min-h-11 text-sm font-medium transition-colors ${
                activeMode === "login"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === "register"}
              onClick={() => setActiveMode("register")}
              className={`flex-1 rounded-md px-3 py-2 min-h-11 text-sm font-medium transition-colors ${
                activeMode === "register"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {activeMode === "register" && (
          <div className="mb-4 rounded-lg bg-primary/5 border border-primary/10 p-3">
            <p className="text-xs font-medium text-foreground mb-1.5">With your account you can:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> Track orders &amp; view invoices
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> Manage quotes &amp; request changes
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> Save addresses for faster checkout
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> Build a wishlist of favourite products
              </li>
            </ul>
          </div>
        )}

        {/* Form */}
        {activeMode === "login" && (
          <LoginForm prefillEmail={prefillEmail} onSuccess={handleSuccess} />
        )}
        {activeMode === "register" && (
          <RegisterForm prefillEmail={prefillEmail} onSuccess={handleSuccess} />
        )}
        {activeMode === "set-password" && (
          <SetPasswordForm
            prefillEmail={prefillEmail}
            guestToken={guestToken}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </>
  );
}

// ============================================================================
// STAND-ALONE TRIGGER COMPONENT (renders dialog via context)
// ============================================================================

/**
 * StorefrontAuthDialogProvider
 * Renders the auth dialog whenever authDialogOpen is true in context.
 * Mount this once inside StorefrontAuthProvider, near the root.
 */
export function StorefrontAuthDialogProvider() {
  const { authDialogOpen } = useStorefrontAuth();
  if (!authDialogOpen) return null;
  return <StorefrontAuthDialog />;
}
