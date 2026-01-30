"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mainNavigation, type NavItem } from "@/config/navigation";

interface SidebarSearchProps {
  onFilterChange: (filteredItems: NavItem[]) => void;
  collapsed?: boolean;
  className?: string;
}

/**
 * Inline search filter for sidebar navigation.
 * Filters navigation items as user types.
 */
export function SidebarSearch({ onFilterChange, collapsed, className }: SidebarSearchProps) {
  const [search, setSearch] = useState("");

  // Flatten all nav items for searching
  const allItems = useMemo(() => {
    return mainNavigation.flatMap((group) => group.items);
  }, []);

  // Filter items based on search
  const handleSearch = (value: string) => {
    setSearch(value);
    
    if (!value.trim()) {
      onFilterChange([]);
      return;
    }

    const query = value.toLowerCase();
    const filtered = allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query)
    );
    
    onFilterChange(filtered);
  };

  const clearSearch = () => {
    setSearch("");
    onFilterChange([]);
  };

  // Don't show search when sidebar is collapsed
  if (collapsed) {
    return null;
  }

  return (
    <div className={cn("relative px-3 pt-2", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search menu..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-8 pl-8 pr-8 text-sm bg-sidebar-accent/50 border-sidebar-border focus:bg-sidebar-accent"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={clearSearch}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
