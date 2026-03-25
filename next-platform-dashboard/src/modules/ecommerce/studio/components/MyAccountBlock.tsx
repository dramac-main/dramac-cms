/**
 * MyAccountBlock - Customer account page for storefronts
 *
 * Shows three tabs: Orders, Addresses, Profile
 * Only renders when customer is logged in; otherwise shows auth dialog trigger.
 */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  MapPin,
  User,
  LogOut,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import {
  useStorefrontAuth,
  type StorefrontCustomer,
} from "../../context/storefront-auth-context";

// ============================================================================
// TYPES
// ============================================================================

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string;
}

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

type AccountTab = "orders" | "addresses" | "profile";

interface MyAccountBlockProps {
  /** Called when user clicks on an order to view details */
  onOrderClick?: (orderId: string, orderNumber: string) => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCents(cents: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

function OrderStatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ============================================================================
// ORDERS TAB
// ============================================================================

function OrdersTab({
  siteId,
  token,
  apiBase,
  onOrderClick,
}: {
  siteId: string;
  token: string;
  apiBase: string;
  onOrderClick?: (orderId: string, orderNumber: string) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/api/modules/ecommerce/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get-orders", token, siteId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setOrders(data.orders || []);
      })
      .catch((e) => setError(e.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [siteId, token, apiBase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="text-base font-medium text-foreground">No orders yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          When you place orders, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className={`rounded-lg border border-border bg-card p-4 ${onOrderClick ? "cursor-pointer hover:border-primary/50 hover:shadow-sm" : ""}`}
          onClick={() => onOrderClick?.(order.id, order.orderNumber)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.createdAt)} · {order.itemCount}{" "}
                {order.itemCount === 1 ? "item" : "items"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold">
                  {formatCents(order.total, order.currency)}
                </p>
                <OrderStatusBadge status={order.status} />
              </div>
              {onOrderClick && (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ADDRESSES TAB
// ============================================================================

function AddressCard({
  address,
  onDelete,
  onEdit,
}: {
  address: Address;
  onDelete: (id: string) => void;
  onEdit: (address: Address) => void;
}) {
  return (
    <div className="relative rounded-lg border border-border bg-card p-4">
      {address.isDefault && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          <Check className="h-3 w-3" /> Default
        </span>
      )}
      <p className="font-medium text-foreground">
        {address.firstName} {address.lastName}
      </p>
      {address.company && (
        <p className="text-sm text-muted-foreground">{address.company}</p>
      )}
      <p className="text-sm text-muted-foreground">{address.addressLine1}</p>
      {address.addressLine2 && (
        <p className="text-sm text-muted-foreground">{address.addressLine2}</p>
      )}
      <p className="text-sm text-muted-foreground">
        {[address.city, address.state, address.postalCode]
          .filter(Boolean)
          .join(", ")}
      </p>
      <p className="text-sm text-muted-foreground">{address.country}</p>
      {address.phone && (
        <p className="text-sm text-muted-foreground">{address.phone}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(address)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(address.id)}
          className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      </div>
    </div>
  );
}

function AddressesTab({
  siteId,
  token,
  apiBase,
}: {
  siteId: string;
  token: string;
  apiBase: string;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${apiBase}/api/modules/ecommerce/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get-addresses", token, siteId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setAddresses(data.addresses || []);
      })
      .catch((e) => setError(e.message || "Failed to load addresses"))
      .finally(() => setLoading(false));
  }, [siteId, token, apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this address?")) return;
    await fetch(`${apiBase}/api/modules/ecommerce/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete-address",
        token,
        siteId,
        addressId: id,
      }),
    });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No saved addresses yet. Add one below.
          </p>
        </div>
      )}

      {addresses.map((addr) => (
        <AddressCard
          key={addr.id}
          address={addr}
          onDelete={handleDelete}
          onEdit={() => {
            /* address edit form is beyond MVP scope — show inline edit later */
          }}
        />
      ))}

      {/* Add Address placeholder */}
      <button
        type="button"
        className="w-full rounded-lg border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary flex items-center justify-center gap-2"
        onClick={() => alert("Address form coming soon")}
      >
        <Plus className="h-4 w-4" />
        Add New Address
      </button>
    </div>
  );
}

// ============================================================================
// PROFILE TAB
// ============================================================================

function ProfileTab({
  customer,
  siteId,
  token,
  apiBase,
  onUpdate,
}: {
  customer: StorefrontCustomer;
  siteId: string;
  token: string;
  apiBase: string;
  onUpdate: () => void;
}) {
  const [firstName, setFirstName] = useState(customer.firstName || "");
  const [lastName, setLastName] = useState(customer.lastName || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [acceptsMarketing, setAcceptsMarketing] = useState(
    customer.acceptsMarketing,
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const res = await fetch(`${apiBase}/api/modules/ecommerce/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-profile",
        token,
        siteId,
        firstName,
        lastName,
        phone,
        acceptsMarketing,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) {
      setError(data.error);
    } else {
      setSuccess(true);
      onUpdate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="pf-first"
            className="block text-sm font-medium text-foreground"
          >
            First Name
          </label>
          <input
            id="pf-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="pf-last"
            className="block text-sm font-medium text-foreground"
          >
            Last Name
          </label>
          <input
            id="pf-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          value={customer.email}
          disabled
          className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed.
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="pf-phone"
          className="block text-sm font-medium text-foreground"
        >
          Phone
        </label>
        <input
          id="pf-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptsMarketing}
          onChange={(e) => setAcceptsMarketing(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />
        <span className="text-sm text-muted-foreground">
          Subscribe to emails about promotions and new products.
        </span>
      </label>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Profile updated successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Changes
      </button>
    </form>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MyAccountBlock({
  onOrderClick,
  className,
}: MyAccountBlockProps) {
  const {
    customer,
    token,
    isLoading,
    isLoggedIn,
    logout,
    refreshCustomer,
    openAuthDialog,
  } = useStorefrontAuth();
  const [activeTab, setActiveTab] = useState<AccountTab>("orders");

  const apiBase = typeof window !== "undefined" ? window.location.origin : "";
  const siteId = customer?.siteId || "";

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center py-20 ${className || ""}`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isLoggedIn || !customer || !token) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-20 text-center ${className || ""}`}
      >
        <User className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Sign in to your account
        </h2>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">
          Track orders, manage addresses, and update your profile.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => openAuthDialog("login")}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </button>
          <button
            onClick={() => openAuthDialog("register")}
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: AccountTab; label: string; icon: React.ReactNode }[] = [
    { key: "orders", label: "Orders", icon: <Package className="h-4 w-4" /> },
    {
      key: "addresses",
      label: "Addresses",
      icon: <MapPin className="h-4 w-4" />,
    },
    { key: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Account</h1>
          <p className="text-sm text-muted-foreground">
            {customer.displayName || customer.email}
            {customer.ordersCount > 0 && (
              <span className="ml-2 text-muted-foreground/60">
                · {customer.ordersCount}{" "}
                {customer.ordersCount === 1 ? "order" : "orders"}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-1" aria-label="Account tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "orders" && (
        <OrdersTab
          siteId={siteId}
          token={token}
          apiBase={apiBase}
          onOrderClick={onOrderClick}
        />
      )}
      {activeTab === "addresses" && (
        <AddressesTab siteId={siteId} token={token} apiBase={apiBase} />
      )}
      {activeTab === "profile" && (
        <ProfileTab
          customer={customer}
          siteId={siteId}
          token={token}
          apiBase={apiBase}
          onUpdate={refreshCustomer}
        />
      )}
    </div>
  );
}
