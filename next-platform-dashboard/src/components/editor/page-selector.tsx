"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Home } from "lucide-react";
import type { Page } from "@/types/page";

interface PageSelectorProps {
  siteId: string;
  currentPageId: string;
  pages: Page[];
}

export function PageSelector({ siteId, currentPageId, pages }: PageSelectorProps) {
  const router = useRouter();

  const handlePageChange = (pageId: string) => {
    if (pageId === "new") {
      router.push(`/dashboard/sites/${siteId}/pages/new`);
    } else {
      router.push(`/dashboard/sites/${siteId}/editor?page=${pageId}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentPageId} onValueChange={handlePageChange}>
        <SelectTrigger className="w-[200px] h-8">
          <SelectValue placeholder="Select page" />
        </SelectTrigger>
        <SelectContent>
          {pages.map((page) => (
            <SelectItem key={page.id} value={page.id}>
              <div className="flex items-center gap-2">
                {page.is_homepage ? (
                  <Home className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                {page.name}
              </div>
            </SelectItem>
          ))}
          <SelectItem value="new">
            <div className="flex items-center gap-2 text-primary">
              <Plus className="h-3 w-3" />
              New Page
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
