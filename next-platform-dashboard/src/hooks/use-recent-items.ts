"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecentItem {
  id: string;
  title: string;
  href: string;
  type: "site" | "client" | "page" | "module" | "route";
  icon?: string;
  visitedAt: number;
}

const STORAGE_KEY = "dramac-recent-items";
const MAX_ITEMS = 10;

function getStoredItems(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredItems(items: RecentItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Hook to track and retrieve recently visited items
 * 
 * @example
 * ```tsx
 * const { recentItems, addRecentItem, clearRecentItems } = useRecentItems();
 * 
 * // When visiting a page
 * addRecentItem({
 *   id: site.id,
 *   title: site.name,
 *   href: `/dashboard/sites/${site.id}`,
 *   type: "site",
 * });
 * ```
 */
export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  // Load from storage on mount
  useEffect(() => {
    setRecentItems(getStoredItems());
  }, []);

  const addRecentItem = useCallback((item: Omit<RecentItem, "visitedAt">) => {
    setRecentItems((prev) => {
      // Remove existing item if present
      const filtered = prev.filter((i) => i.id !== item.id || i.type !== item.type);
      
      // Add new item at start
      const newItems = [
        { ...item, visitedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);

      setStoredItems(newItems);
      return newItems;
    });
  }, []);

  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
    setStoredItems([]);
  }, []);

  const removeRecentItem = useCallback((id: string, type: string) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((i) => !(i.id === id && i.type === type));
      setStoredItems(filtered);
      return filtered;
    });
  }, []);

  return {
    recentItems,
    addRecentItem,
    clearRecentItems,
    removeRecentItem,
  };
}
