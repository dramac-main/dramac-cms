"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, MoreVertical, Trash2, Home, FileText, Sparkles, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Page {
  id: string;
  name: string;
  slug: string;
  is_homepage: boolean | null;
  created_at: string | null;
}

interface SitePagesListProps {
  siteId: string;
  pages: Page[];
}

export function SitePagesList({ siteId, pages }: SitePagesListProps) {
  const router = useRouter();
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);

  const handleDeleteClick = (page: Page) => {
    setPageToDelete(page);
  };

  const handleDeleteConfirm = async () => {
    if (!pageToDelete) return;

    setDeletingPageId(pageToDelete.id);
    try {
      const response = await fetch(`/api/pages/${pageToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete page");
      }

      toast.success(`Page "${pageToDelete.name}" deleted successfully`);
      router.refresh(); // Refresh the page list
    } catch (error) {
      console.error("[SitePagesList] Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete page");
    } finally {
      setDeletingPageId(null);
      setPageToDelete(null);
    }
  };

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No pages yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Create the first page for this site.
        </p>
        <Link href={`/dashboard/sites/${siteId}/pages/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Page
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Pages</h3>
            <Link href={`/dashboard/sites/${siteId}/pages/new`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Page
              </Button>
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {page.is_homepage ? (
                        <Home className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Link
                        href={`/studio/${siteId}/${page.id}`}
                        className="font-medium hover:underline"
                      >
                        {page.name}
                      </Link>
                      {page.is_homepage && (
                        <Badge variant="outline" className="text-xs">
                          Homepage
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {page.slug}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {page.created_at 
                      ? formatDistanceToNow(new Date(page.created_at), { addSuffix: true })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/studio/${siteId}/${page.id}`}>
                        <Button variant="outline" size="sm">
                          <Sparkles className="mr-2 h-3.5 w-3.5" />
                          Edit in Studio
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={deletingPageId === page.id}>
                            {deletingPageId === page.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/studio/${siteId}/${page.id}`}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Edit in Studio
                            </Link>
                          </DropdownMenuItem>
                          {!page.is_homepage && (
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(page)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!pageToDelete} onOpenChange={(open) => !open && setPageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{pageToDelete?.name}</strong>?
              This action cannot be undone and will permanently delete the page and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingPageId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!deletingPageId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingPageId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Page"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
