/**
 * useStorefrontWishlist - Wishlist hook
 *
 * Phase ECOM-20: Core Data Hooks
 *
 * Manages wishlist state in localStorage with product fetching.
 */
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getPublicProductsByIds } from "../actions/public-ecommerce-actions";
import type {
  Product,
  WishlistItem,
  StorefrontWishlistResult,
} from "../types/ecommerce-types";

const WISHLIST_STORAGE_KEY = "ecom_wishlist";

function getStoredWishlist(siteId: string): WishlistItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(`${WISHLIST_STORAGE_KEY}_${siteId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredWishlist(siteId: string, items: WishlistItem[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      `${WISHLIST_STORAGE_KEY}_${siteId}`,
      JSON.stringify(items),
    );
  } catch (err) {
    console.error("Error saving wishlist:", err);
  }
}

export function useStorefrontWishlist(
  siteId: string,
): StorefrontWishlistResult {
  // Lazy-initialise from localStorage so items are never [] on first render.
  // This eliminates the race where the save-effect wrote [] before the old
  // load-effect's setItems could fire.
  const [items, setItems] = useState<WishlistItem[]>(() =>
    getStoredWishlist(siteId),
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stable key for product IDs — only re-fetch when the set of IDs changes
  const productIdsKey = useMemo(
    () => items.map((i) => i.productId).sort().join(","),
    [items],
  );
  const justPruned = useRef(false);

  // Fetch product details for wishlist items — single batch query
  useEffect(() => {
    if (!siteId) return;

    if (items.length === 0) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    // Skip re-fetch if we just pruned phantom items (IDs changed, but no new items)
    if (justPruned.current) {
      justPruned.current = false;
      return;
    }

    setIsLoading(true);
    const productIds = items.map((item) => item.productId);
    getPublicProductsByIds(siteId, productIds)
      .then((results) => {
        setProducts(results);
        // Prune localStorage items whose products no longer exist (deleted/archived)
        const fetchedIds = new Set(results.map((p) => p.id));
        setItems((prev) => {
          const cleaned = prev.filter((i) => fetchedIds.has(i.productId));
          if (cleaned.length !== prev.length) {
            justPruned.current = true;
            return cleaned;
          }
          return prev;
        });
      })
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, productIdsKey]);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (siteId) {
      setStoredWishlist(siteId, items);
    }
  }, [siteId, items]);

  // Add item
  const addItem = useCallback((productId: string, variantId?: string) => {
    setItems((prev) => {
      // Check if already exists
      const exists = prev.some(
        (item) => item.productId === productId && item.variantId === variantId,
      );

      if (exists) return prev;

      return [
        ...prev,
        {
          productId,
          variantId,
          addedAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  // Remove item
  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(item.productId === productId && item.variantId === variantId),
      ),
    );
  }, []);

  // Toggle item
  const toggleItem = useCallback(
    (productId: string, variantId?: string) => {
      const exists = items.some(
        (item) => item.productId === productId && item.variantId === variantId,
      );

      if (exists) {
        removeItem(productId, variantId);
      } else {
        addItem(productId, variantId);
      }
    },
    [items, addItem, removeItem],
  );

  // Check if in wishlist
  const isInWishlist = useCallback(
    (productId: string, variantId?: string): boolean => {
      return items.some(
        (item) => item.productId === productId && item.variantId === variantId,
      );
    },
    [items],
  );

  // Clear wishlist
  const clear = useCallback(() => {
    setItems([]);
  }, []);

  // Item count
  const itemCount = useMemo(() => items.length, [items]);

  return {
    items,
    products,
    isLoading,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clear,
    itemCount,
  };
}
