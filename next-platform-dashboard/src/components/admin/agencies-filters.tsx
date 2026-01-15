"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Download } from "lucide-react";

export function AgenciesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "") {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      });

      // Reset to page 1 when filters change
      if (!params.hasOwnProperty("page")) {
        newSearchParams.delete("page");
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const handleSearch = (value: string) => {
    const queryString = createQueryString({ search: value || null });
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters = searchParams.has("search");

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agencies..."
            className="pl-9"
            defaultValue={searchParams.get("search") || ""}
            onChange={(e) => {
              const value = e.target.value;
              const timeoutId = setTimeout(() => handleSearch(value), 300);
              return () => clearTimeout(timeoutId);
            }}
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <Button variant="outline">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  );
}
