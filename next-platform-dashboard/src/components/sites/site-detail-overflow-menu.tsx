"use client";

import Link from "next/link";
import { MoreHorizontal, Wand2, Copy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CloneSiteDialog } from "@/components/sites/clone-site-dialog";

interface SiteDetailOverflowMenuProps {
  siteId: string;
  siteName: string;
  clientId: string | null;
  agencyId: string;
}

export function SiteDetailOverflowMenu({
  siteId,
  siteName,
  clientId,
  agencyId,
}: SiteDetailOverflowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/sites/${siteId}/ai-designer`}>
            <Wand2 className="mr-2 h-4 w-4" />
            AI Designer
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <CloneSiteDialog
          siteId={siteId}
          siteName={siteName}
          clientId={clientId || ""}
          agencyId={agencyId}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Copy className="mr-2 h-4 w-4" />
            Clone Site
          </DropdownMenuItem>
        </CloneSiteDialog>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/sites/${siteId}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Site Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
