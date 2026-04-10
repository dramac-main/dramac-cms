/**
 * StorefrontAuthProvider - Customer authentication context for storefronts
 *
 * Provides Shopify-style auth: email-first, password optional (set later).
 * Session token stored in localStorage per siteId.
 * On mount, validates existing token against the server.
 */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { mergePublicCarts } from "../actions/public-ecommerce-actions";

// ============================================================================
// TYPES
// ============================================================================

export interface StorefrontCustomer {
  id: string;
  siteId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
  emailVerified: boolean;
  hasPassword: boolean;
  ordersCount: number;
  totalSpent: number;
  acceptsMarketing: boolean;
  createdAt: string;
  /** True when the user just logged in via magic link (password reset grace window) */
  canResetPassword?: boolean;
}

export interface AuthContextValue {
  customer: StorefrontCustomer | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  setPassword: (
    password: string,
    email?: string,
    verificationToken?: string,
  ) => Promise<{ error: string | null }>;
  refreshCustomer: () => Promise<void>;
  /** Request a magic login link for password recovery */
  requestMagicLink: (
    email: string,
  ) => Promise<{ error: string | null; message?: string }>;
  /** Send a 6-digit verification code to the email for ownership proof */
  sendVerificationCode: (email: string) => Promise<{ error: string | null }>;
  /** Verify the 6-digit code and get a verificationToken for set-password */
  verifyEmailCode: (
    email: string,
    code: string,
  ) => Promise<{ error: string | null; verificationToken?: string }>;
  /** Redirect to Google Sign-In */
  loginWithGoogle: () => void;
  /** Whether Google Sign-In is configured and available */
  googleAuthAvailable: boolean;
  /** Change password for authenticated customer */
  changePassword: (
    newPassword: string,
    currentPassword?: string,
  ) => Promise<{ error: string | null; message?: string }>;
  /** Open the auth dialog (login/register) */
  openAuthDialog: (mode?: "login" | "register" | "set-password") => void;
  /** Close the auth dialog */
  closeAuthDialog: () => void;
  authDialogOpen: boolean;
  authDialogMode: "login" | "register" | "set-password";
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue>({
  customer: null,
  token: null,
  isLoading: true,
  isLoggedIn: false,
  login: async () => ({ error: null }),
  register: async () => ({ error: null }),
  logout: async () => {},
  setPassword: async () => ({ error: null }),
  refreshCustomer: async () => {},
  requestMagicLink: async () => ({ error: null }),
  sendVerificationCode: async () => ({ error: null }),
  verifyEmailCode: async () => ({ error: null }),
  loginWithGoogle: () => {},
  googleAuthAvailable: false,
  changePassword: async () => ({ error: null }),
  openAuthDialog: () => {},
  closeAuthDialog: () => {},
  authDialogOpen: false,
  authDialogMode: "login",
});

// ============================================================================
// HOOK
// ============================================================================

export function useStorefrontAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// ============================================================================
// PROVIDER
// ============================================================================

interface StorefrontAuthProviderProps {
  children: ReactNode;
  siteId: string;
  /** Base URL for the CMS API (defaults to window.location.origin) */
  apiBase?: string;
}

export function StorefrontAuthProvider({
  children,
  siteId,
  apiBase,
}: StorefrontAuthProviderProps) {
  const [customer, setCustomer] = useState<StorefrontCustomer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<
    "login" | "register" | "set-password"
  >("login");

  const storageKey = `dramac_customer_token_${siteId}`;
  const base =
    apiBase || (typeof window !== "undefined" ? window.location.origin : "");

  const callAuth = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`${base}/api/modules/ecommerce/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, siteId }),
      });
      return res.json();
    },
    [base, siteId],
  );

  // Restore session on mount (or handle magic link token from URL)
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    // Check for magic link token in URL (?magic_token=...)
    const urlParams = new URLSearchParams(window.location.search);
    const magicToken = urlParams.get("magic_token");
    // Check for Google auth exchange token (?google_auth_token=...)
    const googleAuthToken = urlParams.get("google_auth_token");
    const googleAuthNonce = urlParams.get("google_auth_nonce");
    const googleAuthError = urlParams.get("google_auth_error");

    // Clean Google error params from URL
    if (googleAuthError) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("google_auth_error");
      window.history.replaceState({}, "", cleanUrl.toString());
      // Silently ignore — user cancelled or Google returned an error
      // Fall through to normal session restore below
    }

    // Handle Google auth exchange token (same mechanism as magic links)
    if (googleAuthToken) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("google_auth_token");
      cleanUrl.searchParams.delete("google_auth_nonce");
      window.history.replaceState({}, "", cleanUrl.toString());

      // Verify nonce matches what we stored before redirect (CSRF protection)
      const storedNonce = sessionStorage.getItem("google_auth_nonce");
      if (storedNonce && googleAuthNonce && storedNonce !== googleAuthNonce) {
        console.warn("[Auth] Google auth nonce mismatch — possible CSRF");
        setIsLoading(false);
        return;
      }
      sessionStorage.removeItem("google_auth_nonce");

      // Exchange the short-lived token for a full session (reuses magic link mechanism)
      callAuth({ action: "session", token: googleAuthToken })
        .then((data) => {
          if (data?.customer) {
            const sessionToken = data.token || googleAuthToken;
            // Google auth also uses magic link mechanism, but we don't set
            // canResetPassword — Google users can't forget a password they
            // never set, and if they did set one it wasn't forgotten.
            saveSession(sessionToken, data.customer);
            mergeGuestCart(data.customer.id);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
      return;
    }

    if (magicToken) {
      // Clean the magic_token from the URL to prevent reuse / bookmarking
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("magic_token");
      window.history.replaceState({}, "", cleanUrl.toString());

      // Validate the magic token — server consumes it and returns a new long-lived token
      callAuth({ action: "session", token: magicToken })
        .then((data) => {
          if (data?.customer) {
            // Use the new token returned by the server (magic token is now consumed)
            const sessionToken = data.token || magicToken;
            // If server says canResetPassword, pass it to the customer object
            // so the UI can show the password reset form without current password
            if (data.canResetPassword) {
              data.customer.canResetPassword = true;
            }
            saveSession(sessionToken, data.customer);
            // Merge guest cart (non-blocking)
            mergeGuestCart(data.customer.id);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
      return;
    }

    const savedToken = localStorage.getItem(storageKey);
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    callAuth({ action: "session", token: savedToken })
      .then((data) => {
        if (data?.customer) {
          setCustomer(data.customer);
          setToken(savedToken);
        } else {
          // Token invalid/expired — clear it
          localStorage.removeItem(storageKey);
        }
      })
      .catch(() => {
        localStorage.removeItem(storageKey);
      })
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic session refresh — keeps the rolling expiry alive (every 24h)
  useEffect(() => {
    if (!token) return;

    const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    const interval = setInterval(() => {
      callAuth({ action: "session", token })
        .then((data) => {
          if (data?.customer) {
            setCustomer(data.customer);
          } else {
            // Session expired server-side
            localStorage.removeItem(storageKey);
            setToken(null);
            setCustomer(null);
          }
        })
        .catch(() => {});
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [token, callAuth, storageKey]);

  const saveSession = useCallback(
    (newToken: string, newCustomer: StorefrontCustomer) => {
      localStorage.setItem(storageKey, newToken);
      setToken(newToken);
      setCustomer(newCustomer);
    },
    [storageKey],
  );

  /** Merge guest cart into the authenticated user's cart and notify cart hook */
  const mergeGuestCart = useCallback(
    async (customerId: string) => {
      try {
        const sessionId = localStorage.getItem("ecom_session_id");
        if (!sessionId) return;

        const mergedCart = await mergePublicCarts(
          siteId,
          customerId,
          sessionId,
        );
        if (mergedCart) {
          // Clear guest session so future cart lookups use user_id
          localStorage.removeItem("ecom_session_id");
          // Notify cart hook to refresh with the merged cart
          window.dispatchEvent(
            new CustomEvent("cart-updated", {
              detail: {
                cart: mergedCart,
                itemCount:
                  mergedCart.items?.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  ) || 0,
              },
            }),
          );
        }
      } catch (err) {
        console.error("[Auth] Cart merge failed (non-blocking):", err);
      }
    },
    [siteId],
  );

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null }> => {
      const data = await callAuth({ action: "login", email, password });
      if (data?.error) return { error: data.error };
      saveSession(data.token, data.customer);
      // Merge guest cart into user's cart (non-blocking)
      mergeGuestCart(data.customer.id);
      return { error: null };
    },
    [callAuth, saveSession, mergeGuestCart],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string,
    ): Promise<{ error: string | null }> => {
      const data = await callAuth({
        action: "register",
        email,
        password,
        firstName,
        lastName,
      });
      if (data?.error) return { error: data.error };
      saveSession(data.token, data.customer);
      // Merge guest cart into user's cart (non-blocking)
      mergeGuestCart(data.customer.id);
      return { error: null };
    },
    [callAuth, saveSession, mergeGuestCart],
  );

  const logout = useCallback(async () => {
    if (token) {
      await callAuth({ action: "logout", token }).catch(() => {});
    }
    localStorage.removeItem(storageKey);
    setToken(null);
    setCustomer(null);
  }, [callAuth, storageKey, token]);

  const setPassword = useCallback(
    async (
      password: string,
      email?: string,
      verificationToken?: string,
    ): Promise<{ error: string | null }> => {
      const data = await callAuth({
        action: "set-password",
        token,
        email,
        password,
        verificationToken,
      });
      if (data?.error) return { error: data.error };
      if (data?.token && data?.customer) {
        saveSession(data.token, data.customer);
      }
      return { error: null };
    },
    [callAuth, saveSession, token],
  );

  const refreshCustomer = useCallback(async () => {
    if (!token) return;
    const data = await callAuth({ action: "session", token });
    if (data?.customer) {
      setCustomer(data.customer);
    }
  }, [callAuth, token]);

  const sendVerificationCode = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      try {
        const data = await callAuth({
          action: "send-verification-code",
          email,
        });
        if (data?.error) return { error: data.error };
        return { error: null };
      } catch {
        return { error: "Failed to send verification code. Please try again." };
      }
    },
    [callAuth],
  );

  const verifyEmailCode = useCallback(
    async (
      email: string,
      code: string,
    ): Promise<{ error: string | null; verificationToken?: string }> => {
      try {
        const data = await callAuth({
          action: "verify-email-code",
          email,
          code,
        });
        if (data?.error) return { error: data.error };
        return {
          error: null,
          verificationToken: data?.verificationToken,
        };
      } catch {
        return { error: "Verification failed. Please try again." };
      }
    },
    [callAuth],
  );

  const requestMagicLink = useCallback(
    async (
      email: string,
    ): Promise<{ error: string | null; message?: string }> => {
      try {
        const data = await callAuth({ action: "magic-link", email });
        if (data?.error) return { error: data.error };
        return {
          error: null,
          message:
            data?.message ||
            "If an account exists, a login link has been sent.",
        };
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    },
    [callAuth],
  );

  const changePassword = useCallback(
    async (
      newPassword: string,
      currentPassword?: string,
    ): Promise<{ error: string | null; message?: string }> => {
      try {
        const data = await callAuth({
          action: "change-password",
          token,
          currentPassword,
          newPassword,
        });
        if (data?.error) return { error: data.error };
        return {
          error: null,
          message: data?.message || "Password updated successfully",
        };
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    },
    [callAuth, token],
  );

  // ── Google Sign-In ──
  const googleClientId =
    typeof window !== "undefined"
      ? (window as any).__NEXT_DATA__?.props?.pageProps?.googleClientId ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        ""
      : process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const googleAuthAvailable = !!googleClientId;

  const loginWithGoogle = useCallback(() => {
    if (!googleClientId) {
      console.warn("[Auth] Google Sign-In not configured");
      return;
    }

    // Generate and store nonce for CSRF protection
    const nonce = crypto.randomUUID();
    sessionStorage.setItem("google_auth_nonce", nonce);

    // Build state payload
    const state = btoa(
      JSON.stringify({
        siteId,
        returnUrl: window.location.origin + window.location.pathname,
        nonce,
      }),
    );

    // Google OAuth redirect URI — always the centralized app domain
    const appDomain =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com";
    const redirectUri = `${appDomain}/api/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
      access_type: "online",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, [googleClientId, siteId]);

  const openAuthDialog = useCallback(
    (mode?: "login" | "register" | "set-password") => {
      setAuthDialogMode(mode || "login");
      setAuthDialogOpen(true);
    },
    [],
  );

  const closeAuthDialog = useCallback(() => {
    setAuthDialogOpen(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        isLoading,
        isLoggedIn: !!customer,
        login,
        register,
        logout,
        setPassword,
        refreshCustomer,
        requestMagicLink,
        sendVerificationCode,
        verifyEmailCode,
        loginWithGoogle,
        googleAuthAvailable,
        changePassword,
        openAuthDialog,
        closeAuthDialog,
        authDialogOpen,
        authDialogMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
