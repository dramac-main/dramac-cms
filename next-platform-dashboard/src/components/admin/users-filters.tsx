"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const roles = [
  { value: "all", label: "All Roles" },
  { value: "super_admin", label: "Super Admin" },
  { value: "agency_owner", label: "Agency Owner" },
  { value: "agency_admin", label: "Agency Admin" },
  { value: "agency_member", label: "Agency Member" },
  { value: "client", label: "Client" },
];

const statuses = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

export function UsersFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
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

  const handleRoleChange = (value: string) => {
    const queryString = createQueryString({ role: value });
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
  };

  const handleStatusChange = (value: string) => {
    const queryString = createQueryString({ status: value });
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("role") ||
    searchParams.has("status");

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="pl-9"
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => {
            const value = e.target.value;
            // Debounce search
            const timeoutId = setTimeout(() => handleSearch(value), 300);
            return () => clearTimeout(timeoutId);
          }}
        />
      </div>

      <Select
        value={searchParams.get("role") || "all"}
        onValueChange={handleRoleChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by role" />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") || "all"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
