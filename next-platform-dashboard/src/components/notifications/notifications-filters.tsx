"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, Check } from "lucide-react";

interface NotificationsFiltersProps {
  currentFilter?: string;
}

const filters = [
  { value: undefined, label: "All notifications" },
  { value: "unread", label: "Unread only" },
];

export function NotificationsFilters({ currentFilter }: NotificationsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (filter: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (filter) {
      params.set("filter", filter);
    } else {
      params.delete("filter");
    }
    
    router.push(`/notifications?${params.toString()}`);
  };

  const currentLabel = filters.find((f) => f.value === currentFilter)?.label || "All notifications";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          {currentLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {filters.map((filter) => (
          <DropdownMenuItem
            key={filter.value ?? "all"}
            onClick={() => handleFilterChange(filter.value)}
          >
            <span className="flex-1">{filter.label}</span>
            {currentFilter === filter.value && (
              <Check className="w-4 h-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
