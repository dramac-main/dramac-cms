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
  ) => Promise<{ error: string | null }>;
  refreshCustomer: () => Promise<void>;
  /** Request a magic login link for password recovery */
  requestMagicLink: (
    email: string,
  ) => Promise<{ error: string | null; message?: string }>;
  /** Open the auth dialog (login/register) */
  openAuthDialog: (mode?: "login" | "register") => void;
  /** Close the auth dialog */
  closeAuthDialog: () => void;
  authDialogOpen: boolean;
  authDialogMode: "login" | "register";
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
  const [authDialogMode, setAuthDialogMode] = useState<"login" | "register">(
    "login",
  );

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

  // Restore session on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
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
      callAuth({ action: "session", token }).then((data) => {
        if (data?.customer) {
          setCustomer(data.customer);
        } else {
          // Session expired server-side
          localStorage.removeItem(storageKey);
          setToken(null);
          setCustomer(null);
        }
      }).catch(() => {});
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
    ): Promise<{ error: string | null }> => {
      const data = await callAuth({
        action: "set-password",
        token,
        email,
        password,
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

  const openAuthDialog = useCallback((mode?: "login" | "register") => {
    setAuthDialogMode(mode || "login");
    setAuthDialogOpen(true);
  }, []);

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
