/**
 * MyAccountBlock - Customer account page for storefronts
 *
 * Shows three tabs: Orders, Addresses, Profile
 * Only renders when customer is logged in; otherwise shows auth dialog trigger.
 */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ensureAbsoluteUrl } from "@/lib/utils";
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
  Heart,
  ShoppingCart,
  Calendar,
  FileText,
  Clock,
  X,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import {
  useStorefrontAuth,
  type StorefrontCustomer,
} from "../../context/storefront-auth-context";
import { useStorefrontWishlist } from "../../hooks/useStorefrontWishlist";
import { useStorefrontCart } from "../../hooks/useStorefrontCart";
import { useStorefront } from "../../context/storefront-context";
import { getImageUrl } from "../../lib/image-utils";

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
  trackingNumber?: string;
  trackingUrl?: string;
  fulfillmentStatus?: string;
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

type AccountTab =
  | "orders"
  | "addresses"
  | "wishlist"
  | "bookings"
  | "quotes"
  | "profile";

interface Booking {
  id: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  total: number;
  currency: string;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  access_token: string | null;
  items: QuoteItem[];
}

interface QuoteItem {
  id: string;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
}

interface MyAccountBlockProps {
  /** Called when user clicks on an order to view details */
  onOrderClick?: (orderId: string, orderNumber: string) => void;
  /** Active module slugs injected by the renderer (e.g. ["ecommerce", "booking"]) */
  activeModuleSlugs?: string[];
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

/** Format a value already in main currency units (NOT cents). Used for quotes. */
function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  processing: "bg-primary/10 text-primary",
  shipped: "bg-info/10 text-info",
  delivered: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

function OrderStatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || "bg-muted text-muted-foreground";
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const handleOrderClick = useCallback(
    async (orderId: string, orderNumber: string) => {
      // If external handler provided, use it
      if (onOrderClick) {
        onOrderClick(orderId, orderNumber);
        return;
      }

      // Toggle inline detail
      if (selectedOrderId === orderId) {
        setSelectedOrderId(null);
        setOrderDetail(null);
        return;
      }

      setSelectedOrderId(orderId);
      setDetailLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/modules/ecommerce/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get-order-detail",
            token,
            siteId,
            orderId,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setOrderDetail(data.order);
      } catch {
        setOrderDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [apiBase, onOrderClick, selectedOrderId, siteId, token],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
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
        <div key={order.id}>
          <div
            className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
            onClick={() => handleOrderClick(order.id, order.orderNumber)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {order.orderNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.createdAt)} · {order.itemCount}{" "}
                  {order.itemCount === 1 ? "item" : "items"}
                </p>
                {order.trackingNumber && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tracking: {order.trackingNumber}
                    {order.trackingUrl && (
                      <>
                        {" · "}
                        <a
                          href={ensureAbsoluteUrl(order.trackingUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Track →
                        </a>
                      </>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    {formatCents(order.total, order.currency)}
                  </p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${
                    selectedOrderId === order.id ? "rotate-90" : ""
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Inline Order Detail */}
          {selectedOrderId === order.id && (
            <div className="mt-1 rounded-lg border border-border bg-card/50 p-4 space-y-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !orderDetail ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Could not load order details
                </p>
              ) : (
                <OrderDetailView
                  detail={orderDetail}
                  currency={order.currency}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ORDER DETAIL VIEW (inline)
// ============================================================================

interface OrderDetailItem {
  id: string;
  productName: string;
  productSku: string | null;
  variantOptions: Record<string, string> | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  fulfilledQuantity: number;
}

interface OrderDetailAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  currency: string;
  createdAt: string;
  shippingAddress: OrderDetailAddress | null;
  billingAddress: OrderDetailAddress | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  customerNotes: string | null;
  items: OrderDetailItem[];
}

function formatAddress(addr: OrderDetailAddress | null): string | null {
  if (!addr || !addr.address_line_1) return null;
  const parts = [
    [addr.first_name, addr.last_name].filter(Boolean).join(" "),
    addr.company,
    addr.address_line_1,
    addr.address_line_2,
    [addr.city, addr.state, addr.postal_code].filter(Boolean).join(", "),
    addr.country,
  ].filter(Boolean);
  return parts.join("\n");
}

function OrderDetailView({
  detail,
  currency,
}: {
  detail: OrderDetail;
  currency: string;
}) {
  const shippingAddr = formatAddress(detail.shippingAddress);

  return (
    <>
      {/* Status bar */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Payment:</span>
          <OrderStatusBadge status={detail.paymentStatus || "pending"} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Fulfillment:</span>
          <OrderStatusBadge
            status={detail.fulfillmentStatus || "unfulfilled"}
          />
        </div>
        {detail.trackingNumber && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Tracking:</span>
            {detail.trackingUrl ? (
              <a
                href={ensureAbsoluteUrl(detail.trackingUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {detail.trackingNumber}
              </a>
            ) : (
              <span className="font-medium">{detail.trackingNumber}</span>
            )}
          </div>
        )}
      </div>

      {/* Items table */}
      {detail.items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                  Item
                </th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground w-16">
                  Qty
                </th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground w-24">
                  Price
                </th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground w-24">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img
                          src={getImageUrl(item.imageUrl)}
                          alt={item.productName}
                          className="h-10 w-10 rounded object-cover border"
                        />
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {item.productName}
                        </p>
                        {item.productSku && (
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.productSku}
                          </p>
                        )}
                        {item.variantOptions &&
                          Object.keys(item.variantOptions).length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {Object.entries(item.variantOptions)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(", ")}
                            </p>
                          )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatCents(Number(item.unitPrice), currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                    {formatCents(Number(item.totalPrice), currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          {detail.subtotal > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">
                {formatCents(detail.subtotal, currency)}
              </span>
            </div>
          )}
          {detail.shippingAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="tabular-nums">
                {formatCents(detail.shippingAmount, currency)}
              </span>
            </div>
          )}
          {detail.taxAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span className="tabular-nums">
                {formatCents(detail.taxAmount, currency)}
              </span>
            </div>
          )}
          {detail.discountAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span className="tabular-nums text-green-600">
                -{formatCents(detail.discountAmount, currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>Total</span>
            <span className="tabular-nums">
              {formatCents(detail.total, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {shippingAddr && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            Shipping Address
          </h4>
          <p className="text-sm text-foreground whitespace-pre-line">
            {shippingAddr}
          </p>
        </div>
      )}

      {/* Customer Notes */}
      {detail.customerNotes && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Your Notes
          </h4>
          <p className="text-sm text-foreground">{detail.customerNotes}</p>
        </div>
      )}
    </>
  );
}

// ============================================================================
// ADDRESSES TAB
// ============================================================================

function AddressCard({
  address,
  onDelete,
  onEdit,
  onSetDefault,
}: {
  address: Address;
  onDelete: (id: string) => void;
  onEdit: (address: Address) => void;
  onSetDefault?: (address: Address) => void;
}) {
  return (
    <div className="relative rounded-lg border border-border bg-card p-4">
      {address.isDefault && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
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
        {!address.isDefault && onSetDefault && (
          <button
            type="button"
            onClick={() => onSetDefault(address)}
            className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <Check className="h-3 w-3" /> Set as Default
          </button>
        )}
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
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
        // Map DB snake_case to camelCase
        const mapped = (data.addresses || []).map(
          (a: Record<string, unknown>) => ({
            id: a.id,
            firstName: a.first_name || "",
            lastName: a.last_name || "",
            company: a.company || "",
            addressLine1: a.address_line_1 || "",
            addressLine2: a.address_line_2 || "",
            city: a.city || "",
            state: a.state || "",
            postalCode: a.postal_code || "",
            country: a.country || "",
            phone: a.phone || "",
            isDefault: a.is_default_shipping || false,
          }),
        );
        setAddresses(mapped);
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

  const handleSetDefault = async (address: Address) => {
    await fetch(`${apiBase}/api/modules/ecommerce/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-address",
        token,
        siteId,
        addressId: address.id,
        address: {
          firstName: address.firstName,
          lastName: address.lastName,
          company: address.company,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          phone: address.phone,
          isDefault: true,
        },
      }),
    });
    // Reload to get fresh default state
    load();
  };

  const handleSaveAddress = async (
    address: Omit<Address, "id"> & { id?: string },
  ) => {
    const isEdit = !!address.id;
    const res = await fetch(`${apiBase}/api/modules/ecommerce/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: isEdit ? "update-address" : "add-address",
        token,
        siteId,
        ...(isEdit ? { addressId: address.id } : {}),
        address: {
          firstName: address.firstName,
          lastName: address.lastName,
          company: address.company,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          phone: address.phone,
          isDefault: address.isDefault,
        },
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    // Reload addresses to get fresh state
    load();
    setShowAddForm(false);
    setEditingAddress(null);
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
      <p
        role="alert"
        className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </p>
    );
  }

  // Show address form (add or edit)
  if (showAddForm || editingAddress) {
    return (
      <AddressForm
        address={editingAddress || undefined}
        onSave={handleSaveAddress}
        onCancel={() => {
          setShowAddForm(false);
          setEditingAddress(null);
        }}
      />
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
          onEdit={(a) => setEditingAddress(a)}
          onSetDefault={handleSetDefault}
        />
      ))}

      <button
        type="button"
        className="w-full rounded-lg border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary flex items-center justify-center gap-2"
        onClick={() => setShowAddForm(true)}
      >
        <Plus className="h-4 w-4" />
        Add New Address
      </button>
    </div>
  );
}

// ============================================================================
// ADDRESS FORM (shared for add + edit)
// ============================================================================

function AddressForm({
  address,
  onSave,
  onCancel,
}: {
  address?: Address;
  onSave: (address: Omit<Address, "id"> & { id?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    firstName: address?.firstName || "",
    lastName: address?.lastName || "",
    company: address?.company || "",
    addressLine1: address?.addressLine1 || "",
    addressLine2: address?.addressLine2 || "",
    city: address?.city || "",
    state: address?.state || "",
    postalCode: address?.postalCode || "",
    country: address?.country || "",
    phone: address?.phone || "",
    isDefault: address?.isDefault || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.addressLine1 || !form.city || !form.country) {
      setError("First name, address, city, and country are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, id: address?.id } as Omit<Address, "id"> & {
        id?: string;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-foreground">
          {address ? "Edit Address" : "Add New Address"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            First Name <span className="text-destructive">*</span>
          </label>
          <input
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Last Name
          </label>
          <input
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Company
        </label>
        <input
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
          className={inputClass}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Address Line 1 <span className="text-destructive">*</span>
        </label>
        <input
          value={form.addressLine1}
          onChange={(e) => update("addressLine1", e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Address Line 2
        </label>
        <input
          value={form.addressLine2}
          onChange={(e) => update("addressLine2", e.target.value)}
          className={inputClass}
          placeholder="Apartment, suite, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            City <span className="text-destructive">*</span>
          </label>
          <input
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            State / Province
          </label>
          <input
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Postal Code
          </label>
          <input
            value={form.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Country <span className="text-destructive">*</span>
          </label>
          <input
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Phone
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => update("isDefault", e.target.checked)}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />
        <span className="text-sm text-muted-foreground">
          Set as default address
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2 min-h-11"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {address ? "Update Address" : "Add Address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 min-h-11"
        >
          Cancel
        </button>
      </div>
    </form>
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
    <>
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
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="rounded-md bg-success/5 px-3 py-2 text-sm text-success"
          >
            Profile updated successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2 min-h-11"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </form>

      {/* Change Password Section */}
      <ChangePasswordSection customer={customer} />
    </>
  );
}

function ChangePasswordSection({ customer }: { customer: StorefrontCustomer }) {
  const { changePassword } = useStorefrontAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (customer.hasPassword && !currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    setLoading(true);
    const result = await changePassword(
      newPassword,
      customer.hasPassword ? currentPassword : undefined,
    );
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <div className="mt-8 max-w-md border-t border-border pt-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
      >
        <Lock className="h-4 w-4" />
        {customer.hasPassword ? "Change Password" : "Set a Password"}
        <ChevronRight
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {!customer.hasPassword && (
            <p className="text-sm text-muted-foreground">
              You signed in via magic link or Google. Set a password to sign in
              with email and password next time.
            </p>
          )}

          {customer.hasPassword && (
            <div className="space-y-1">
              <label
                htmlFor="cp-current"
                className="block text-sm font-medium text-foreground"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  id="cp-current"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="cp-new"
              className="block text-sm font-medium text-foreground"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="cp-new"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="cp-confirm"
              className="block text-sm font-medium text-foreground"
            >
              Confirm New Password
            </label>
            <input
              id="cp-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
              disabled={loading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md bg-success/5 px-3 py-2 text-sm text-success">
              Password updated successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2 min-h-11"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {customer.hasPassword ? "Update Password" : "Set Password"}
          </button>
        </form>
      )}
    </div>
  );
}

// ============================================================================
// WISHLIST TAB
// ============================================================================

function WishlistTab({ siteId }: { siteId: string }) {
  const { products, isLoading, removeItem, itemCount } =
    useStorefrontWishlist(siteId);
  const { addItem: addToCart } = useStorefrontCart(siteId);
  const { currency, quotationHidePrices } = useStorefront();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Heart className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="text-base font-medium text-foreground">
          Your wishlist is empty
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Items you save will appear here.
        </p>
        <a
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 min-h-11"
        >
          <ShoppingBag className="h-4 w-4" />
          Start Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        My Wishlist ({itemCount} {itemCount === 1 ? "item" : "items"})
      </p>
      {products.map((product) => {
        const inStock = product.track_inventory ? product.quantity > 0 : true;

        return (
          <div
            key={product.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
          >
            {/* Product image */}
            <div className="h-16 w-16 shrink-0 rounded-md bg-muted overflow-hidden">
              {getImageUrl(product.images?.[0]) ? (
                <img
                  src={getImageUrl(product.images?.[0])!}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {product.name}
              </p>
              {!quotationHidePrices && (
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCents(product.base_price, currency)}
                </p>
              )}
              {!quotationHidePrices && (
                <p
                  className={`text-xs ${inStock ? "text-success" : "text-destructive"}`}
                >
                  {inStock ? "In Stock" : "Out of Stock"}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {quotationHidePrices ? (
                <a
                  href={`/quotes?product=${product.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Request Quote
                </a>
              ) : inStock ? (
                <button
                  onClick={() => addToCart(product.id, null, 1)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Add to Cart
                </button>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Unavailable
                </span>
              )}
              <button
                onClick={() => removeItem(product.id)}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// BOOKINGS TAB
// ============================================================================

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  "no-show": "bg-muted text-muted-foreground",
};

function BookingsTab({
  siteId,
  token,
  apiBase,
}: {
  siteId: string;
  token: string;
  apiBase: string;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/api/modules/ecommerce/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get-bookings", token, siteId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBookings(data.bookings || []);
      })
      .catch((e) => setError(e.message || "Failed to load bookings"))
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
      <p
        role="alert"
        className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </p>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="text-base font-medium text-foreground">
          No bookings yet
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          When you make bookings, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const statusColors =
          BOOKING_STATUS_COLORS[booking.status] ||
          "bg-muted text-muted-foreground";
        const isPast = new Date(booking.date) < new Date();

        return (
          <div
            key={booking.id}
            className={`rounded-lg border border-border bg-card p-4 ${isPast ? "opacity-75" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {booking.service_name}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(booking.date)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {booking.start_time}
                  {booking.end_time ? ` – ${booking.end_time}` : ""}
                </div>
                {booking.notes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {booking.notes}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors}`}
              >
                {booking.status.charAt(0).toUpperCase() +
                  booking.status.slice(1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// QUOTES TAB
// ============================================================================

const QUOTE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  viewed: "bg-info/10 text-info",
  accepted: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
};

function QuotesTab({
  siteId,
  token,
  apiBase,
}: {
  siteId: string;
  token: string;
  apiBase: string;
}) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/api/modules/ecommerce/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get-quotes", token, siteId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setQuotes(data.quotes || []);
      })
      .catch((e) => setError(e.message || "Failed to load quotes"))
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
      <p
        role="alert"
        className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </p>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="text-base font-medium text-foreground">No quotes yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Quotes you request will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => {
        const statusColors =
          QUOTE_STATUS_COLORS[quote.status] || "bg-muted text-muted-foreground";
        const isExpired =
          quote.valid_until && new Date(quote.valid_until) < new Date();
        const isPricingPending =
          quote.status === "draft" || quote.status === "pending_approval";

        return (
          <div
            key={quote.id}
            className={`rounded-lg border border-border bg-card p-4 ${quote.access_token ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}`}
            onClick={() => {
              if (quote.access_token) {
                window.location.href = `/quote/${quote.access_token}`;
              }
            }}
            role={quote.access_token ? "link" : undefined}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-foreground">
                  {quote.quote_number}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(quote.created_at)}
                  {quote.valid_until && (
                    <span className={isExpired ? "text-destructive" : ""}>
                      {" "}
                      · Valid until {formatDate(quote.valid_until)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isPricingPending ? (
                  <p className="text-sm text-muted-foreground italic">
                    Pricing pending
                  </p>
                ) : (
                  <p className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(quote.total, quote.currency)}
                  </p>
                )}
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors}`}
                >
                  {quote.status.charAt(0).toUpperCase() +
                    quote.status.slice(1).replace(/_/g, " ")}
                </span>
              </div>
            </div>
            {quote.items && quote.items.length > 0 && (
              <div className="mt-2 border-t border-border pt-2 space-y-1">
                {quote.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {item.product_name}
                      {item.variant_label && (
                        <span className="text-xs ml-1">
                          ({item.variant_label})
                        </span>
                      )}
                      <span className="text-xs ml-1">×{item.quantity}</span>
                    </span>
                    {!isPricingPending && (
                      <span className="tabular-nums text-foreground">
                        {formatCurrency(
                          item.unit_price * item.quantity,
                          quote.currency,
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {quote.notes && (
              <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                {quote.notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MyAccountBlock({
  onOrderClick,
  activeModuleSlugs,
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

  const hasEcommerce =
    !activeModuleSlugs || activeModuleSlugs.includes("ecommerce");
  const hasBooking =
    !activeModuleSlugs || activeModuleSlugs.includes("booking");

  // Smart default tab: bookings-first for booking-only sites
  const defaultTab: AccountTab = hasEcommerce
    ? "orders"
    : hasBooking
      ? "bookings"
      : "orders";
  const [activeTab, setActiveTab] = useState<AccountTab>(defaultTab);

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
          {hasEcommerce && hasBooking
            ? "Track orders, manage bookings, and update your profile."
            : hasBooking
              ? "Manage your bookings, save addresses, and update your profile."
              : "Track orders, manage addresses, and update your profile."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => openAuthDialog("login")}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 min-h-11"
          >
            Sign In
          </button>
          <button
            onClick={() => openAuthDialog("register")}
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 min-h-11"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  // Build tabs contextually based on active modules
  // Industry standard: only show tabs relevant to installed features
  const allTabs: {
    key: AccountTab;
    label: string;
    icon: React.ReactNode;
    module?: string;
  }[] = [
    {
      key: "orders",
      label: "Orders",
      icon: <Package className="h-4 w-4" />,
      module: "ecommerce",
    },
    {
      key: "bookings",
      label: "Bookings",
      icon: <Calendar className="h-4 w-4" />,
      module: "booking",
    },
    {
      key: "quotes",
      label: "Quotes",
      icon: <FileText className="h-4 w-4" />,
      module: "ecommerce",
    },
    {
      key: "wishlist",
      label: "Wishlist",
      icon: <Heart className="h-4 w-4" />,
      module: "ecommerce",
    },
    {
      key: "addresses",
      label: "Addresses",
      icon: <MapPin className="h-4 w-4" />,
    },
    { key: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  ];

  const tabs = allTabs.filter((tab) => {
    if (!tab.module) return true; // Always show addresses, profile
    if (tab.module === "ecommerce") return hasEcommerce;
    if (tab.module === "booking") return hasBooking;
    return true;
  });

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
      {activeTab === "wishlist" && <WishlistTab siteId={siteId} />}
      {activeTab === "bookings" && (
        <BookingsTab siteId={siteId} token={token} apiBase={apiBase} />
      )}
      {activeTab === "quotes" && (
        <QuotesTab siteId={siteId} token={token} apiBase={apiBase} />
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
